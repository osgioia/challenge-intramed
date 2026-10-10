import { BadRequestException, HttpStatus } from '@nestjs/common';
import { MovieValidationError } from '../domain/types';

/**
 * HTTP exception (400) returned when movie data violates domain validation
 * rules. Carries the detailed list of validation errors for the client.
 */
export class MovieValidationException extends BadRequestException {
  constructor(
    message: string,
    public readonly validationErrors: MovieValidationError[] = [],
  ) {
    super({
      status: HttpStatus.BAD_REQUEST,
      error: 'movieValidationFailed',
      message,
      validationErrors,
    });
  }
}
