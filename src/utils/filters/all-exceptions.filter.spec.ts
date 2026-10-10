import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import {
  MovieDomainError,
  MovieNotFoundError,
  MovieValidationException as MovieDomainValidationException,
} from '../../movies/domain/types';
import { SwapiUnavailableException } from '../../swapi/exceptions/swapi-unavailable.exception';

interface MockedHttpContext {
  filter: AllExceptionsFilter;
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
}

function createMockedHttpContext(
  request: { method: string; url: string } = {
    method: 'GET',
    url: '/v1/movies',
  },
): MockedHttpContext {
  const json = jest.fn();
  const status = jest.fn();
  const response = { status, json };
  status.mockReturnValue(response);

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { filter: new AllExceptionsFilter(), host, status, json };
}

describe('AllExceptionsFilter', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should translate a domain MovieNotFoundError into a 404 response', () => {
    const { filter, host, status, json } = createMockedHttpContext();

    filter.catch(new MovieNotFoundError(999, 'id'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      status: 404,
      error: 'movieNotFound',
      message: 'Movie with ID 999 not found',
    });
  });

  it('should translate a domain MovieValidationException into a 400 response', () => {
    const validationErrors = [
      { field: 'title', message: 'title should not be empty', value: '' },
    ];
    const { filter, host, status, json } = createMockedHttpContext();

    filter.catch(
      new MovieDomainValidationException(
        'Movie validation failed',
        validationErrors,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      status: 400,
      error: 'movieValidationFailed',
      message: 'Movie validation failed',
      validationErrors,
    });
  });

  it('should translate a conflict MovieDomainError into a 409 response', () => {
    const { filter, host, status, json } = createMockedHttpContext();

    filter.catch(
      new MovieDomainError(
        'A movie with title "A New Hope" already exists',
        'title',
        'A New Hope',
        'conflict',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 409,
        error: 'movieAlreadyExists',
        field: 'title',
      }),
    );
  });

  it('should translate a validation MovieDomainError into a 400 response', () => {
    const { filter, host, status, json } = createMockedHttpContext();

    filter.catch(
      new MovieDomainError('Movie validation failed', 'title', ''),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        error: 'movieValidationFailed',
        message: 'Movie validation failed',
        field: 'title',
      }),
    );
  });

  it('should keep SwapiUnavailableException as a 503 response', () => {
    const { filter, host, status, json } = createMockedHttpContext();

    filter.catch(
      new SwapiUnavailableException('Failed to fetch films list'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(json).toHaveBeenCalledWith({
      status: 503,
      error: 'swapiUnavailable',
      message: 'Failed to fetch films list',
    });
  });

  it('should keep other HttpExceptions with their own status and payload', () => {
    const { filter, host, status, json } = createMockedHttpContext();

    filter.catch(new UnauthorizedException(), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Unauthorized',
      }),
    );
  });

  it('should normalize HttpExceptions with a plain string response', () => {
    const { filter, host, status, json } = createMockedHttpContext();

    filter.catch(new HttpException('Something went wrong', 502), host);

    expect(status).toHaveBeenCalledWith(502);
    expect(json).toHaveBeenCalledWith({
      status: 502,
      message: 'Something went wrong',
    });
  });

  it('should convert unexpected errors into a generic 500 response', () => {
    const { filter, host, status, json } = createMockedHttpContext();

    filter.catch(new Error('Sensitive database credentials'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      status: 500,
      error: 'internalServerError',
      message: 'Internal server error',
    });
  });

  it('should not leak internal details of unexpected errors', () => {
    const { filter, host, json } = createMockedHttpContext();

    filter.catch(new Error('Sensitive database credentials'), host);

    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('Sensitive');
  });

  it('should log a warning for client errors and an error for server errors', () => {
    const clientContext = createMockedHttpContext({
      method: 'GET',
      url: '/v1/movies/999',
    });
    clientContext.filter.catch(
      new MovieNotFoundError(999, 'id'),
      clientContext.host,
    );

    const serverContext = createMockedHttpContext({
      method: 'POST',
      url: '/v1/movies',
    });
    serverContext.filter.catch(
      new Error('Unexpected failure'),
      serverContext.host,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      'GET /v1/movies/999 - 404 Movie with ID 999 not found',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'POST /v1/movies - 500 Internal server error',
      expect.any(String),
    );
  });
});
