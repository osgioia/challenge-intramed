import { ArgumentsHost, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { AllExceptionsFilter } from '../utils/filters/all-exceptions.filter';
import { MovieDomainError, MovieNotFoundError } from './domain/types';
import { SwapiUnavailableException } from '../swapi/exceptions/swapi-unavailable.exception';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

interface FilteredResponse {
  status: number | undefined;
  body: Record<string, unknown> | undefined;
}

describe('Movies error handling flows (controller + global filter)', () => {
  let controller: MoviesController;
  let filter: AllExceptionsFilter;

  const mockMoviesService = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    syncWithSwapi: jest.fn(),
  };

  const createMovieDto = {
    title: 'A New Hope',
    episodeId: 4,
    openingCrawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz, Rick McCallum',
    releaseDate: '1977-05-25',
    characters: ['https://www.swapi.tech/api/people/1/'],
    planets: ['https://www.swapi.tech/api/planets/1/'],
    starships: ['https://www.swapi.tech/api/starships/2/'],
    vehicles: ['https://www.swapi.tech/api/vehicles/4/'],
    species: ['https://www.swapi.tech/api/species/1/'],
    swapiUrl: 'https://www.swapi.tech/api/films/1/',
  } as CreateMovieDto;

  const updateMovieDto = {
    title: 'A New Hope (Special Edition)',
  } as UpdateMovieDto;

  /**
   * Runs the action, catches whatever it throws and feeds the error to the
   * global exception filter, exactly like the HTTP layer would do.
   */
  async function runThroughFilter(
    action: () => Promise<unknown>,
  ): Promise<FilteredResponse> {
    const json = jest.fn();
    const status = jest.fn();
    status.mockReturnValue({ json });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
        getRequest: () => ({ method: 'GET', url: '/v1/movies' }),
      }),
    } as unknown as ArgumentsHost;

    await action().catch((error: unknown) => filter.catch(error, host));

    return {
      status: status.mock.calls[0]?.[0] as number | undefined,
      body: json.mock.calls[0]?.[0] as Record<string, unknown> | undefined,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [{ provide: MoviesService, useValue: mockMoviesService }],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    filter = new AllExceptionsFilter();

    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should respond 404 when getting a movie that does not exist', async () => {
    mockMoviesService.findById.mockRejectedValue(
      new MovieNotFoundError(999, 'id'),
    );

    const { status, body } = await runThroughFilter(() =>
      controller.findOne(999),
    );

    expect(status).toBe(404);
    expect(body).toEqual({
      status: 404,
      error: 'movieNotFound',
      message: 'Movie with ID 999 not found',
    });
  });

  it('should respond 409 when creating a duplicated movie', async () => {
    mockMoviesService.create.mockRejectedValue(
      new MovieDomainError(
        'A movie with title "A New Hope" already exists',
        'title',
        'A New Hope',
        'conflict',
      ),
    );

    const { status, body } = await runThroughFilter(() =>
      controller.create(createMovieDto),
    );

    expect(status).toBe(409);
    expect(body).toEqual(
      expect.objectContaining({
        status: 409,
        error: 'movieAlreadyExists',
        field: 'title',
      }),
    );
  });

  it('should respond 400 with validation errors when movie data is invalid', async () => {
    mockMoviesService.create.mockRejectedValue(
      new MovieDomainError('Movie validation failed', 'title', ''),
    );

    const { status, body } = await runThroughFilter(() =>
      controller.create(createMovieDto),
    );

    expect(status).toBe(400);
    expect(body).toEqual(
      expect.objectContaining({
        status: 400,
        error: 'movieValidationFailed',
        message: 'Movie validation failed',
      }),
    );
    expect(body?.validationErrors).toEqual([
      { field: 'title', message: 'Movie validation failed', value: '' },
    ]);
  });

  it('should respond 404 when updating a movie that does not exist', async () => {
    mockMoviesService.update.mockRejectedValue(
      new MovieNotFoundError(999, 'id'),
    );

    const { status, body } = await runThroughFilter(() =>
      controller.update(999, updateMovieDto),
    );

    expect(status).toBe(404);
    expect(body).toEqual(
      expect.objectContaining({ status: 404, error: 'movieNotFound' }),
    );
  });

  it('should respond 503 when SWAPI is unavailable during sync', async () => {
    mockMoviesService.syncWithSwapi.mockRejectedValue(
      new SwapiUnavailableException('Failed to fetch films list'),
    );

    const { status, body } = await runThroughFilter(() =>
      controller.syncWithSwapi(),
    );

    expect(status).toBe(503);
    expect(body).toEqual({
      status: 503,
      error: 'swapiUnavailable',
      message: 'Failed to fetch films list',
    });
  });

  it('should respond 500 without leaking internals on unexpected errors', async () => {
    mockMoviesService.findById.mockRejectedValue(
      new Error('Database password is hunter2'),
    );

    const { status, body } = await runThroughFilter(() =>
      controller.findOne(1),
    );

    expect(status).toBe(500);
    expect(body).toEqual({
      status: 500,
      error: 'internalServerError',
      message: 'Internal server error',
    });
    expect(JSON.stringify(body)).not.toContain('hunter2');
  });
});
