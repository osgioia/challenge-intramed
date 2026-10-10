import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MovieRepository } from './infrastructure/persistence/movie.repository';
import { SwapiService } from '../swapi/swapi.service';
import { SwapiUnavailableException } from '../swapi/exceptions/swapi-unavailable.exception';
import { Movie, PaginatedMovies } from './domain/movie';
import { MovieNotFoundError, MovieDomainError } from './domain/types';
import { SyncResultDto } from './dto/sync-result.dto';
import { SwapiFilmPropertiesDto } from '../swapi/dto/swapi-film.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';

describe('MoviesService', () => {
  let service: MoviesService;
  let movieRepository: jest.Mocked<MovieRepository>;
  let swapiService: jest.Mocked<SwapiService>;

  const mockMovie: Movie = {
    id: 1,
    title: 'A New Hope',
    episodeId: 4,
    openingCrawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz, Rick McCallum',
    releaseDate: new Date('1977-05-25'),
    characters: ['https://swapi.dev/api/people/1/'],
    planets: ['https://swapi.dev/api/planets/1/'],
    starships: ['https://swapi.dev/api/starships/2/'],
    vehicles: ['https://swapi.dev/api/vehicles/4/'],
    species: ['https://swapi.dev/api/species/1/'],
    swapiUrl: 'https://swapi.dev/api/films/1/',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Movie;

  const mockCreateMovieDto: CreateMovieDto = {
    title: 'A New Hope',
    episodeId: 4,
    openingCrawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz, Rick McCallum',
    releaseDate: '1977-05-25',
    characters: ['https://swapi.dev/api/people/1/'],
    planets: ['https://swapi.dev/api/planets/1/'],
    starships: ['https://swapi.dev/api/starships/2/'],
    vehicles: ['https://swapi.dev/api/vehicles/4/'],
    species: ['https://swapi.dev/api/species/1/'],
    swapiUrl: 'https://swapi.dev/api/films/1/',
  };

  const mockPaginatedMovies: PaginatedMovies = {
    data: [mockMovie],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const mockSwapiFilm: SwapiFilmPropertiesDto = {
    title: 'A New Hope',
    episode_id: 4,
    opening_crawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz, Rick McCallum',
    release_date: '1977-05-25',
    characters: ['https://www.swapi.tech/api/people/1/'],
    planets: ['https://www.swapi.tech/api/planets/1/'],
    starships: ['https://www.swapi.tech/api/starships/2/'],
    vehicles: ['https://www.swapi.tech/api/vehicles/4/'],
    species: ['https://www.swapi.tech/api/species/1/'],
    created: '2014-12-10T14:23:31.880000Z',
    edited: '2014-12-20T19:49:45.256000Z',
    url: 'https://www.swapi.tech/api/films/1/',
  };

  beforeEach(async () => {
    const mockMovieRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByTitle: jest.fn(),
      findByEpisodeId: jest.fn(),
      findBySwapiUrl: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
    };

    const mockSwapiService = {
      getAllFilms: jest.fn(),
      getFilmById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: MovieRepository,
          useValue: mockMovieRepository,
        },
        {
          provide: SwapiService,
          useValue: mockSwapiService,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    movieRepository = module.get(MovieRepository);
    swapiService = module.get(SwapiService);

    // Mock Logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated movies with default options', async () => {
      // Arrange
      movieRepository.findAll.mockResolvedValue(mockPaginatedMovies);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockPaginatedMovies);
      expect(movieRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
    });

    it('should return paginated movies with custom query options', async () => {
      // Arrange
      const query: QueryMovieDto = {
        page: 2,
        limit: 5,
        search: 'Hope',
        sortBy: 'title',
        sortOrder: 'ASC',
      };
      movieRepository.findAll.mockResolvedValue(mockPaginatedMovies);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toEqual(mockPaginatedMovies);
      expect(movieRepository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        search: 'Hope',
        sortBy: 'title',
        sortOrder: 'ASC',
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      movieRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('should return movie when found', async () => {
      // Arrange
      movieRepository.findById.mockResolvedValue(mockMovie);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(mockMovie);
      expect(movieRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw MovieNotFoundError when movie is not found', async () => {
      // Arrange
      movieRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(999)).rejects.toThrow(MovieNotFoundError);
      expect(movieRepository.findById).toHaveBeenCalledWith(999);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      movieRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findById(1)).rejects.toThrow(error);
    });
  });

  describe('create', () => {
    it('should create a new movie successfully', async () => {
      // Arrange
      movieRepository.findByTitle.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.create.mockResolvedValue(mockMovie);

      // Act
      const result = await service.create(mockCreateMovieDto);

      // Assert
      expect(result).toEqual(mockMovie);
      expect(movieRepository.findByTitle).toHaveBeenCalledWith(
        mockCreateMovieDto.title,
      );
      expect(movieRepository.findByEpisodeId).toHaveBeenCalledWith(
        mockCreateMovieDto.episodeId,
      );
      expect(movieRepository.findBySwapiUrl).toHaveBeenCalledWith(
        mockCreateMovieDto.swapiUrl,
      );
      expect(movieRepository.create).toHaveBeenCalledWith({
        title: mockCreateMovieDto.title,
        episodeId: mockCreateMovieDto.episodeId,
        openingCrawl: mockCreateMovieDto.openingCrawl,
        director: mockCreateMovieDto.director,
        producer: mockCreateMovieDto.producer,
        releaseDate: new Date(mockCreateMovieDto.releaseDate),
        characters: mockCreateMovieDto.characters,
        planets: mockCreateMovieDto.planets,
        starships: mockCreateMovieDto.starships,
        vehicles: mockCreateMovieDto.vehicles,
        species: mockCreateMovieDto.species,
        swapiUrl: mockCreateMovieDto.swapiUrl,
      });
    });

    it('should throw MovieDomainError when movie with same title already exists', async () => {
      // Arrange
      movieRepository.findByTitle.mockResolvedValue(mockMovie);

      // Act & Assert
      await expect(service.create(mockCreateMovieDto)).rejects.toThrow(
        MovieDomainError,
      );
      expect(movieRepository.create).not.toHaveBeenCalled();
    });

    it('should throw MovieDomainError when movie with same episode ID already exists', async () => {
      // Arrange
      movieRepository.findByTitle.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(mockMovie);

      // Act & Assert
      await expect(service.create(mockCreateMovieDto)).rejects.toThrow(
        MovieDomainError,
      );
      expect(movieRepository.create).not.toHaveBeenCalled();
    });

    it('should throw MovieDomainError when movie with same SWAPI URL already exists', async () => {
      // Arrange
      movieRepository.findByTitle.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.findBySwapiUrl.mockResolvedValue(mockMovie);

      // Act & Assert
      await expect(service.create(mockCreateMovieDto)).rejects.toThrow(
        MovieDomainError,
      );
      expect(movieRepository.create).not.toHaveBeenCalled();
    });

    it('should create movie without SWAPI URL validation when not provided', async () => {
      // Arrange
      const createDtoWithoutSwapiUrl = { ...mockCreateMovieDto };
      delete createDtoWithoutSwapiUrl.swapiUrl;

      movieRepository.findByTitle.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.create.mockResolvedValue(mockMovie);

      // Act
      const result = await service.create(createDtoWithoutSwapiUrl);

      // Assert
      expect(result).toEqual(mockMovie);
      expect(movieRepository.findBySwapiUrl).not.toHaveBeenCalled();
    });

    it('should log and rethrow unexpected repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      movieRepository.findByTitle.mockRejectedValue(error);

      // Act & Assert
      await expect(service.create(mockCreateMovieDto)).rejects.toThrow(error);
      expect(movieRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdateMovieDto = {
      title: 'Updated Title',
      director: 'Updated Director',
    };

    it('should update movie successfully', async () => {
      // Arrange
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.findByTitle.mockResolvedValue(null);
      movieRepository.update.mockResolvedValue({
        ...mockMovie,
        ...updateDto,
      } as Movie);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(result.title).toBe(updateDto.title);
      expect(result.director).toBe(updateDto.director);
      expect(movieRepository.findById).toHaveBeenCalledWith(1);
      expect(movieRepository.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw MovieNotFoundError when movie does not exist', async () => {
      // Arrange
      movieRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(999, updateDto)).rejects.toThrow(
        MovieNotFoundError,
      );
      expect(movieRepository.update).not.toHaveBeenCalled();
    });

    it('should throw MovieDomainError when updating to duplicate title', async () => {
      // Arrange
      const anotherMovie = {
        ...mockMovie,
        id: 2,
        title: 'Another Movie',
      } as Movie;
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.findByTitle.mockResolvedValue(anotherMovie);

      // Act & Assert
      await expect(service.update(1, updateDto)).rejects.toThrow(
        MovieDomainError,
      );
      expect(movieRepository.update).not.toHaveBeenCalled();
    });

    it('should allow updating to same title', async () => {
      // Arrange
      const updateWithSameTitle = { title: mockMovie.title };
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.update.mockResolvedValue(mockMovie);

      // Act
      const result = await service.update(1, updateWithSameTitle);

      // Assert
      expect(result).toEqual(mockMovie);
      expect(movieRepository.findByTitle).not.toHaveBeenCalled();
    });

    it('should throw MovieNotFoundError when update returns null', async () => {
      // Arrange
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.findByTitle.mockResolvedValue(null);
      movieRepository.update.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(1, updateDto)).rejects.toThrow(
        MovieNotFoundError,
      );
    });

    it('should throw MovieDomainError when updating to a duplicate episode ID', async () => {
      // Arrange
      const duplicateEpisodeDto: UpdateMovieDto = { episodeId: 5 };
      const anotherMovie = {
        ...mockMovie,
        id: 2,
        episodeId: 5,
      } as Movie;
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.findByEpisodeId.mockResolvedValue(anotherMovie);

      // Act & Assert
      await expect(service.update(1, duplicateEpisodeDto)).rejects.toThrow(
        MovieDomainError,
      );
      expect(movieRepository.update).not.toHaveBeenCalled();
    });

    it('should throw MovieDomainError when updating to a duplicate SWAPI URL', async () => {
      // Arrange
      const duplicateSwapiUrlDto: UpdateMovieDto = {
        swapiUrl: 'https://swapi.dev/api/films/2/',
      };
      const anotherMovie = {
        ...mockMovie,
        id: 2,
        swapiUrl: 'https://swapi.dev/api/films/2/',
      } as Movie;
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.findBySwapiUrl.mockResolvedValue(anotherMovie);

      // Act & Assert
      await expect(service.update(1, duplicateSwapiUrlDto)).rejects.toThrow(
        MovieDomainError,
      );
      expect(movieRepository.update).not.toHaveBeenCalled();
    });

    it('should map every provided field when updating a movie', async () => {
      // Arrange
      const fullUpdateDto: UpdateMovieDto = {
        title: 'Updated Title',
        episodeId: 5,
        openingCrawl: 'Updated crawl',
        director: 'Updated Director',
        producer: 'Updated Producer',
        releaseDate: '1980-05-17',
        characters: ['https://swapi.dev/api/people/2/'],
        planets: ['https://swapi.dev/api/planets/2/'],
        starships: ['https://swapi.dev/api/starships/3/'],
        vehicles: ['https://swapi.dev/api/vehicles/5/'],
        species: ['https://swapi.dev/api/species/2/'],
        swapiUrl: 'https://swapi.dev/api/films/2/',
      };
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.findByTitle.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.update.mockResolvedValue({
        ...mockMovie,
        ...fullUpdateDto,
        releaseDate: new Date('1980-05-17'),
      } as Movie);

      // Act
      const result = await service.update(1, fullUpdateDto);

      // Assert
      expect(movieRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'Updated Title',
          episodeId: 5,
          openingCrawl: 'Updated crawl',
          director: 'Updated Director',
          producer: 'Updated Producer',
          releaseDate: new Date('1980-05-17'),
          characters: ['https://swapi.dev/api/people/2/'],
          planets: ['https://swapi.dev/api/planets/2/'],
          starships: ['https://swapi.dev/api/starships/3/'],
          vehicles: ['https://swapi.dev/api/vehicles/5/'],
          species: ['https://swapi.dev/api/species/2/'],
          swapiUrl: 'https://swapi.dev/api/films/2/',
        }),
      );
      expect(result.title).toBe('Updated Title');
    });

    it('should log and rethrow unexpected repository errors during movie update', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.findByTitle.mockResolvedValue(null);
      movieRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(service.update(1, updateDto)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should remove movie successfully', async () => {
      // Arrange
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.remove.mockResolvedValue(undefined);

      // Act
      await service.remove(1);

      // Assert
      expect(movieRepository.findById).toHaveBeenCalledWith(1);
      expect(movieRepository.remove).toHaveBeenCalledWith(1);
    });

    it('should throw MovieNotFoundError when movie does not exist', async () => {
      // Arrange
      movieRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999)).rejects.toThrow(MovieNotFoundError);
      expect(movieRepository.remove).not.toHaveBeenCalled();
    });

    it('should handle repository errors during removal', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      movieRepository.findById.mockResolvedValue(mockMovie);
      movieRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(service.remove(1)).rejects.toThrow(error);
    });
  });

  describe('syncWithSwapi', () => {
    beforeEach(() => {
      // Mock Date.now() to ensure consistent timing in tests
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01T00:00:00.000Z
      jest.useFakeTimers().setSystemTime(new Date('2022-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should create new movies when they do not exist locally', async () => {
      // Arrange
      swapiService.getAllFilms.mockResolvedValue([mockSwapiFilm]);
      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.create.mockResolvedValue(mockMovie);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(true);
      expect(result.stats.total).toBe(1);
      expect(result.stats.created).toBe(1);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toBeUndefined();
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);

      expect(swapiService.getAllFilms).toHaveBeenCalled();
      expect(movieRepository.findBySwapiUrl).toHaveBeenCalledWith(
        mockSwapiFilm.url,
      );
      expect(movieRepository.findByEpisodeId).toHaveBeenCalledWith(
        mockSwapiFilm.episode_id,
      );
      expect(movieRepository.create).toHaveBeenCalled();
    });

    it('should update existing movies found by SWAPI URL', async () => {
      // Arrange
      swapiService.getAllFilms.mockResolvedValue([mockSwapiFilm]);
      movieRepository.findBySwapiUrl.mockResolvedValue(mockMovie);
      movieRepository.update.mockResolvedValue(mockMovie);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(true);
      expect(result.stats.total).toBe(1);
      expect(result.stats.created).toBe(0);
      expect(result.stats.updated).toBe(1);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toBeUndefined();

      expect(movieRepository.findBySwapiUrl).toHaveBeenCalledWith(
        mockSwapiFilm.url,
      );
      expect(movieRepository.findByEpisodeId).not.toHaveBeenCalled();
      expect(movieRepository.update).toHaveBeenCalledWith(
        mockMovie.id,
        expect.objectContaining({
          title: mockSwapiFilm.title,
          episodeId: mockSwapiFilm.episode_id,
          director: mockSwapiFilm.director,
        }),
      );
      expect(movieRepository.create).not.toHaveBeenCalled();
    });

    it('should update existing movies found by episode ID when SWAPI URL not found', async () => {
      // Arrange
      swapiService.getAllFilms.mockResolvedValue([mockSwapiFilm]);
      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(mockMovie);
      movieRepository.update.mockResolvedValue(mockMovie);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(true);
      expect(result.stats.total).toBe(1);
      expect(result.stats.created).toBe(0);
      expect(result.stats.updated).toBe(1);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toBeUndefined();

      expect(movieRepository.findBySwapiUrl).toHaveBeenCalledWith(
        mockSwapiFilm.url,
      );
      expect(movieRepository.findByEpisodeId).toHaveBeenCalledWith(
        mockSwapiFilm.episode_id,
      );
      expect(movieRepository.update).toHaveBeenCalled();
      expect(movieRepository.create).not.toHaveBeenCalled();
    });

    it('should return failure result when SWAPI service is unavailable', async () => {
      // Arrange
      const swapiError = new SwapiUnavailableException('SWAPI is down');
      swapiService.getAllFilms.mockRejectedValue(swapiError);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false);
      expect(result.message).toContain('SWAPI is down');
      expect(result.stats.total).toBe(0);
      expect(result.stats.created).toBe(0);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain('SWAPI unavailable');

      expect(movieRepository.create).not.toHaveBeenCalled();
      expect(movieRepository.update).not.toHaveBeenCalled();
    });

    it('should handle movie mapping errors and continue processing', async () => {
      // Arrange
      const invalidSwapiFilm = { ...mockSwapiFilm, title: '' }; // Invalid title
      const validSwapiFilm = mockSwapiFilm;

      swapiService.getAllFilms.mockResolvedValue([
        invalidSwapiFilm,
        validSwapiFilm,
      ]);
      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.create.mockResolvedValue(mockMovie);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false); // Should be false due to errors
      expect(result.stats.total).toBe(2);
      expect(result.stats.created).toBe(1);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain('Title is required');
    });

    it('should handle update failure and continue processing', async () => {
      // Arrange
      swapiService.getAllFilms.mockResolvedValue([mockSwapiFilm]);
      movieRepository.findBySwapiUrl.mockResolvedValue(mockMovie);
      movieRepository.update.mockResolvedValue(null); // Simulate update failure

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false); // Should be false due to errors
      expect(result.stats.total).toBe(1);
      expect(result.stats.created).toBe(0);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain('Failed to update movie');
    });

    it('should process multiple movies correctly', async () => {
      // Arrange
      const secondSwapiFilm: SwapiFilmPropertiesDto = {
        ...mockSwapiFilm,
        title: 'The Empire Strikes Back',
        episode_id: 5,
        url: 'https://www.swapi.tech/api/films/2/',
      };

      const secondMovie = {
        ...mockMovie,
        id: 2,
        title: 'The Empire Strikes Back',
        episodeId: 5,
      } as Movie;

      swapiService.getAllFilms.mockResolvedValue([
        mockSwapiFilm,
        secondSwapiFilm,
      ]);

      // First movie doesn't exist - should be created
      movieRepository.findBySwapiUrl.mockImplementation((url: string) => {
        if (url === mockSwapiFilm.url) return Promise.resolve(null);
        if (url === secondSwapiFilm.url) return Promise.resolve(secondMovie);
        return Promise.resolve(null);
      });
      movieRepository.findByEpisodeId.mockImplementation(
        (episodeId: number) => {
          if (episodeId === 4) return Promise.resolve(null);
          if (episodeId === 5) return Promise.resolve(secondMovie);
          return Promise.resolve(null);
        },
      );

      movieRepository.create.mockResolvedValue(mockMovie);
      movieRepository.update.mockResolvedValue(secondMovie);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(true);
      expect(result.stats.total).toBe(2);
      expect(result.stats.created).toBe(1);
      expect(result.stats.updated).toBe(1);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toBeUndefined();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      swapiService.getAllFilms.mockResolvedValue([mockSwapiFilm]);
      movieRepository.findBySwapiUrl.mockRejectedValue(
        new Error('Database error'),
      );

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false); // Should be false due to errors
      expect(result.stats.total).toBe(1);
      expect(result.stats.created).toBe(0);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain('Database error');
    });

    it('should return success with errors when some movies fail but others succeed', async () => {
      // Arrange
      const invalidSwapiFilm = { ...mockSwapiFilm, title: '', episode_id: 1 };
      const validSwapiFilm = { ...mockSwapiFilm, episode_id: 4 };

      swapiService.getAllFilms.mockResolvedValue([
        invalidSwapiFilm,
        validSwapiFilm,
      ]);
      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.create.mockResolvedValue(mockMovie);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false); // Should be false when there are errors
      expect(result.stats.total).toBe(2);
      expect(result.stats.created).toBe(1);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].title).toBeUndefined(); // Invalid title should be undefined
      expect(result.errors![0].episodeId).toBe(1);
      expect(result.errors![0].error).toContain('Title is required');
      expect(result.message).toContain(
        'Synchronization completed with 1 error(s)',
      );
    });

    it('should handle unexpected errors during synchronization', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected database failure');
      swapiService.getAllFilms.mockRejectedValue(unexpectedError);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unexpected database failure');
      expect(result.stats.total).toBe(0);
      expect(result.stats.created).toBe(0);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain('Synchronization error');
    });

    it('should include timing information in sync result', async () => {
      // Arrange
      swapiService.getAllFilms.mockResolvedValue([mockSwapiFilm]);
      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.create.mockResolvedValue(mockMovie);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
      expect(result.durationMs).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);

      const startedAtTime = new Date(result.startedAt).getTime();
      const completedAtTime = new Date(result.completedAt).getTime();
      expect(completedAtTime).toBeGreaterThanOrEqual(startedAtTime);
      expect(result.durationMs).toBe(completedAtTime - startedAtTime);
    });
  });
});
