import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  MovieDomainError,
  MovieNotFoundError,
  MovieValidationException as MovieDomainValidationException,
} from '../../movies/domain/types';

interface ErrorResponseBody {
  status: number;
  error?: string;
  message: string;
  [key: string]: unknown;
}

/**
 * Global exception filter.
 *
 * Translates domain level errors (movie not found, movie validation and
 * business rule violations) into proper HTTP responses, normalizes any other
 * `HttpException` keeping its original payload, and converts unexpected
 * errors into a generic 500 response without leaking internal details.
 *
 * It also logs every failed request: `warn` for 4xx responses and `error`
 * (with the stack trace) for 5xx responses.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.toErrorResponse(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} ${body.message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} ${body.message}`,
      );
    }

    response.status(status).json(body);
  }

  private toErrorResponse(exception: unknown): {
    status: number;
    body: ErrorResponseBody;
  } {
    // Domain errors translated to HTTP
    if (exception instanceof MovieNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: {
          status: HttpStatus.NOT_FOUND,
          error: 'movieNotFound',
          message: `Movie with ID ${exception.id} not found`,
        },
      };
    }

    if (exception instanceof MovieDomainValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          status: HttpStatus.BAD_REQUEST,
          error: 'movieValidationFailed',
          message: exception.message,
          validationErrors: exception.validationErrors,
        },
      };
    }

    if (exception instanceof MovieDomainError) {
      if (exception.kind === 'conflict') {
        return {
          status: HttpStatus.CONFLICT,
          body: {
            status: HttpStatus.CONFLICT,
            error: 'movieAlreadyExists',
            message: exception.message,
            field: exception.field,
          },
        };
      }

      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          status: HttpStatus.BAD_REQUEST,
          error: 'movieValidationFailed',
          message: exception.message,
          field: exception.field,
          value: exception.value,
        },
      };
    }

    // Every other HTTP exception (including SwapiUnavailableException)
    // keeps its own status code and response payload.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return { status, body: this.normalizeHttpException(exception, status) };
    }

    // Unexpected errors never expose internal details to the client.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'internalServerError',
        message: 'Internal server error',
      },
    };
  }

  private normalizeHttpException(
    exception: HttpException,
    status: number,
  ): ErrorResponseBody {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        status,
        message: response,
      };
    }

    return response as ErrorResponseBody;
  }
}
