import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MovieDto } from './dto/movie.dto';
import { PaginatedMoviesDto } from './dto/paginated-movies.dto';
import { QueryMovieDto } from './dto/query-movie.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { SyncResultDto } from './dto/sync-result.dto';
import { Movie, PaginatedMovies } from './domain/movie';
import { MovieDomainError, MovieNotFoundError } from './domain/types';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { SwapiUnavailableException } from '../swapi/exceptions/swapi-unavailable.exception';
import type { ExecutionContext } from '@nestjs/common';

describe('MoviesController', () => {
  let controller: MoviesController;
  let guard: RolesGuard;

  const mockMovie: Movie = Movie.create({
    id: 1,
    title: 'A New Hope',
    episodeId: 4,
    openingCrawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz, Rick McCallum',
    releaseDate: new Date('1977-05-25'),
    characters: ['https://www.swapi.tech/api/people/1/'],
    planets: ['https://www.swapi.tech/api/planets/1/'],
    starships: ['https://www.swapi.tech/api/starships/2/'],
    vehicles: ['https://www.swapi.tech/api/vehicles/4/'],
    species: ['https://www.swapi.tech/api/species/1/'],
    swapiUrl: 'https://www.swapi.tech/api/films/1/',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T12:00:00.000Z'),
  });

  const mockPaginatedMovies: PaginatedMovies = {
    data: [mockMovie],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const mockMoviesService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    syncWithSwapi: jest.fn(),
  };

  const createMovieDto: CreateMovieDto = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
        Reflector,
        RolesGuard,
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated movies', async () => {
      const query: QueryMovieDto = { page: 1, limit: 10 };
      mockMoviesService.findAll.mockResolvedValue(mockPaginatedMovies);

      const result = await controller.findAll(query);

      expect(mockMoviesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toBeInstanceOf(PaginatedMoviesDto);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(MovieDto);
      expect(result.data[0].title).toBe('A New Hope');
      expect(result.total).toBe(1);
    });

    it('should handle empty query parameters', async () => {
      const query: QueryMovieDto = {};
      mockMoviesService.findAll.mockResolvedValue(mockPaginatedMovies);

      const result = await controller.findAll(query);

      expect(mockMoviesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toBeInstanceOf(PaginatedMoviesDto);
    });
  });

  describe('findOne', () => {
    it('should return a movie by ID', async () => {
      const movieId = 1;
      mockMoviesService.findById.mockResolvedValue(mockMovie);

      const result = await controller.findOne(movieId);

      expect(mockMoviesService.findById).toHaveBeenCalledWith(movieId);
      expect(result).toBeInstanceOf(MovieDto);
      expect(result.title).toBe('A New Hope');
      expect(result.episodeId).toBe(4);
    });

    it('should throw NotFoundException when movie is not found', async () => {
      const movieId = 999;
      mockMoviesService.findById.mockRejectedValue(
        new MovieNotFoundError(movieId, 'id'),
      );

      await expect(controller.findOne(movieId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMoviesService.findById).toHaveBeenCalledWith(movieId);
    });

    it('should propagate other errors', async () => {
      const movieId = 1;
      const genericError = new Error('Database connection failed');
      mockMoviesService.findById.mockRejectedValue(genericError);

      await expect(controller.findOne(movieId)).rejects.toThrow(genericError);
      expect(mockMoviesService.findById).toHaveBeenCalledWith(movieId);
    });
  });

  describe('create', () => {
    it('should create a movie and return it as MovieDto', async () => {
      mockMoviesService.create.mockResolvedValue(mockMovie);

      const result = await controller.create(createMovieDto);

      expect(mockMoviesService.create).toHaveBeenCalledWith(createMovieDto);
      expect(result).toBeInstanceOf(MovieDto);
      expect(result.title).toBe('A New Hope');
      expect(result.episodeId).toBe(4);
    });

    it('should throw ConflictException when the movie already exists', async () => {
      mockMoviesService.create.mockRejectedValue(
        new MovieDomainError(
          'A movie with title "A New Hope" already exists',
          'title',
          'A New Hope',
          'conflict',
        ),
      );

      await expect(controller.create(createMovieDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should propagate unexpected errors', async () => {
      const genericError = new Error('Database connection failed');
      mockMoviesService.create.mockRejectedValue(genericError);

      await expect(controller.create(createMovieDto)).rejects.toThrow(
        genericError,
      );
    });
  });

  describe('update', () => {
    const updateMovieDto: UpdateMovieDto = {
      title: 'A New Hope (Special Edition)',
    } as UpdateMovieDto;

    it('should update a movie and return it as MovieDto', async () => {
      const updatedMovie = Movie.create({
        ...createMovieDto,
        title: 'A New Hope (Special Edition)',
        id: 1,
        createdAt: mockMovie.createdAt,
      });
      mockMoviesService.update.mockResolvedValue(updatedMovie);

      const result = await controller.update(1, updateMovieDto);

      expect(mockMoviesService.update).toHaveBeenCalledWith(1, updateMovieDto);
      expect(result).toBeInstanceOf(MovieDto);
      expect(result.title).toBe('A New Hope (Special Edition)');
    });

    it('should throw NotFoundException when the movie does not exist', async () => {
      mockMoviesService.update.mockRejectedValue(
        new MovieNotFoundError(999, 'id'),
      );

      await expect(controller.update(999, updateMovieDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when the update duplicates another movie', async () => {
      mockMoviesService.update.mockRejectedValue(
        new MovieDomainError(
          'A movie with title "A New Hope (Special Edition)" already exists',
          'title',
          'A New Hope (Special Edition)',
          'conflict',
        ),
      );

      await expect(controller.update(1, updateMovieDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an existing movie', async () => {
      mockMoviesService.remove.mockResolvedValue(undefined);

      await expect(controller.remove(1)).resolves.toBeUndefined();
      expect(mockMoviesService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when the movie does not exist', async () => {
      mockMoviesService.remove.mockRejectedValue(
        new MovieNotFoundError(999, 'id'),
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('syncWithSwapi', () => {
    const syncResult = new SyncResultDto({
      success: true,
      message: 'Synchronization completed successfully. Created: 1, Updated: 5',
      stats: { created: 1, updated: 5, failed: 0, total: 6 },
      startedAt: '2023-01-01T12:00:00.000Z',
      completedAt: '2023-01-01T12:00:01.000Z',
      durationMs: 1000,
    });

    it('should return the synchronization statistics', async () => {
      mockMoviesService.syncWithSwapi.mockResolvedValue(syncResult);

      const result = await controller.syncWithSwapi();

      expect(mockMoviesService.syncWithSwapi).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(true);
      expect(result.stats).toEqual({
        created: 1,
        updated: 5,
        failed: 0,
        total: 6,
      });
    });

    it('should propagate SwapiUnavailableException when SWAPI cannot be reached', async () => {
      mockMoviesService.syncWithSwapi.mockRejectedValue(
        new SwapiUnavailableException('Failed to fetch films list'),
      );

      await expect(controller.syncWithSwapi()).rejects.toThrow(
        SwapiUnavailableException,
      );
    });
  });

  describe('role-based authorization', () => {
    const mockExecutionContext = (
      handler: object,
      user?: { role?: { id: number } },
    ): ExecutionContext =>
      ({
        getClass: () => MoviesController,
        getHandler: () => handler,
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      }) as unknown as ExecutionContext;

    it('should restrict write endpoints to the admin role', () => {
      const adminHandlers = [
        controller.create,
        controller.update,
        controller.remove,
        controller.syncWithSwapi,
      ];

      adminHandlers.forEach((handler) => {
        expect(Reflect.getMetadata('roles', handler)).toEqual([RoleEnum.admin]);
      });
    });

    it('should not restrict read endpoints to a specific role', () => {
      [controller.findAll, controller.findOne].forEach((handler) => {
        expect(Reflect.getMetadata('roles', handler)).toBeUndefined();
      });
    });

    it('should allow administrators to execute admin endpoints', () => {
      const context = mockExecutionContext(controller.create, {
        role: { id: RoleEnum.admin },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny regular users access to admin endpoints', () => {
      const context = mockExecutionContext(controller.create, {
        role: { id: RoleEnum.user },
      });

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should deny unauthenticated requests to admin endpoints', () => {
      const context = mockExecutionContext(controller.syncWithSwapi);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should allow any authenticated role on read endpoints', () => {
      const context = mockExecutionContext(controller.findAll, {
        role: { id: RoleEnum.user },
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
