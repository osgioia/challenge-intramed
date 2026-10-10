import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '../http.module';
import { ConfigService } from '@nestjs/config';
import { MoviesService } from './movies.service';
import { SwapiService } from '../swapi/swapi.service';
import { MovieRepository } from './infrastructure/persistence/movie.repository';
import { Movie, CreateMovieData } from './domain/movie';
import { SyncResultDto } from './dto/sync-result.dto';
import { SwapiFilmPropertiesDto } from '../swapi/dto/swapi-film.dto';
import { SwapiUnavailableException } from '../swapi/exceptions/swapi-unavailable.exception';

describe('MoviesService Integration Tests - SWAPI Sync', () => {
  let service: MoviesService;
  let swapiService: SwapiService;
  let movieRepository: jest.Mocked<MovieRepository>;

  const mockSwapiFilms: SwapiFilmPropertiesDto[] = [
    {
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
    },
    {
      title: 'The Empire Strikes Back',
      episode_id: 5,
      opening_crawl: 'It is a dark time for the Rebellion...',
      director: 'Irvin Kershner',
      producer: 'Gary Kurtz, Rick McCallum',
      release_date: '1980-05-17',
      characters: ['https://www.swapi.tech/api/people/1/'],
      planets: ['https://www.swapi.tech/api/planets/4/'],
      starships: ['https://www.swapi.tech/api/starships/3/'],
      vehicles: ['https://www.swapi.tech/api/vehicles/8/'],
      species: ['https://www.swapi.tech/api/species/6/'],
      created: '2014-12-12T11:26:24.656000Z',
      edited: '2014-12-15T13:07:53.386000Z',
      url: 'https://www.swapi.tech/api/films/2/',
    },
    {
      title: 'Return of the Jedi',
      episode_id: 6,
      opening_crawl: 'Luke Skywalker has returned to his home planet...',
      director: 'Richard Marquand',
      producer: 'Howard G. Kazanjian, George Lucas, Rick McCallum',
      release_date: '1983-05-25',
      characters: ['https://www.swapi.tech/api/people/1/'],
      planets: ['https://www.swapi.tech/api/planets/5/'],
      starships: ['https://www.swapi.tech/api/starships/2/'],
      vehicles: ['https://www.swapi.tech/api/vehicles/16/'],
      species: ['https://www.swapi.tech/api/species/1/'],
      created: '2014-12-18T10:39:33.255000Z',
      edited: '2014-12-20T09:48:37.462000Z',
      url: 'https://www.swapi.tech/api/films/3/',
    },
  ];

  const existingMovie: Movie = {
    id: 1,
    title: 'A New Hope (Old Version)',
    episodeId: 4,
    openingCrawl: 'Old opening crawl...',
    director: 'George Lucas',
    producer: 'Gary Kurtz',
    releaseDate: new Date('1977-05-25'),
    characters: ['https://old.swapi.dev/api/people/1/'],
    planets: ['https://old.swapi.dev/api/planets/1/'],
    starships: ['https://old.swapi.dev/api/starships/2/'],
    vehicles: ['https://old.swapi.dev/api/vehicles/4/'],
    species: ['https://old.swapi.dev/api/species/1/'],
    swapiUrl: 'https://www.swapi.tech/api/films/1/',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Movie;

  beforeEach(async () => {
    // Create mock repository
    const mockMovieRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      remove: jest.fn(),
      findByTitle: jest.fn(),
      findByEpisodeId: jest.fn(),
      findBySwapiUrl: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        MoviesService,
        SwapiService,
        {
          provide: MovieRepository,
          useValue: mockMovieRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const values: Record<string, unknown> = {
                'swapi.baseUrl': 'https://www.swapi.tech/api',
                'swapi.requestTimeout': 10000,
              };

              return values[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    swapiService = module.get<SwapiService>(SwapiService);
    movieRepository = module.get<MovieRepository>(
      MovieRepository,
    ) as jest.Mocked<MovieRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncWithSwapi - Integration Scenarios', () => {
    it('should synchronize new movies from SWAPI successfully', async () => {
      // Arrange
      jest.spyOn(swapiService, 'getAllFilms').mockResolvedValue(mockSwapiFilms);

      // No existing movies
      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);

      // Mock successful creation for each movie
      let createdId = 1;
      movieRepository.create.mockImplementation((data: CreateMovieData) =>
        Promise.resolve({
          id: createdId++,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Movie),
      );

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(true);
      expect(result.stats.total).toBe(3);
      expect(result.stats.created).toBe(3);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toBeUndefined();

      // Verify all movies were processed
      expect(swapiService.getAllFilms).toHaveBeenCalledTimes(1);
      expect(movieRepository.create).toHaveBeenCalledTimes(3);

      // Verify movie data was correctly mapped
      expect(movieRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          title: 'A New Hope',
          episodeId: 4,
          director: 'George Lucas',
          releaseDate: new Date('1977-05-25'),
          swapiUrl: 'https://www.swapi.tech/api/films/1/',
        }),
      );

      expect(movieRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          title: 'The Empire Strikes Back',
          episodeId: 5,
          director: 'Irvin Kershner',
          releaseDate: new Date('1980-05-17'),
          swapiUrl: 'https://www.swapi.tech/api/films/2/',
        }),
      );

      expect(movieRepository.create).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          title: 'Return of the Jedi',
          episodeId: 6,
          director: 'Richard Marquand',
          releaseDate: new Date('1983-05-25'),
          swapiUrl: 'https://www.swapi.tech/api/films/3/',
        }),
      );
    });

    it('should update existing movie and create new ones', async () => {
      // Arrange
      jest.spyOn(swapiService, 'getAllFilms').mockResolvedValue(mockSwapiFilms);

      // First movie exists (by SWAPI URL), others don't
      movieRepository.findBySwapiUrl.mockImplementation((url: string) =>
        Promise.resolve(
          url === 'https://www.swapi.tech/api/films/1/' ? existingMovie : null,
        ),
      );

      movieRepository.findByEpisodeId.mockImplementation((episodeId: number) =>
        Promise.resolve(episodeId === 4 ? existingMovie : null),
      );

      // Mock successful operations
      movieRepository.update.mockImplementation((id, data) =>
        Promise.resolve({
          ...existingMovie,
          ...data,
          updatedAt: new Date(),
        } as Movie),
      );

      let createdId = 2;
      movieRepository.create.mockImplementation((data: CreateMovieData) =>
        Promise.resolve({
          id: createdId++,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Movie),
      );

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(true);
      expect(result.stats.total).toBe(3);
      expect(result.stats.created).toBe(2);
      expect(result.stats.updated).toBe(1);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toBeUndefined();

      // Verify update was called for existing movie
      expect(movieRepository.update).toHaveBeenCalledWith(
        existingMovie.id,
        expect.objectContaining({
          title: 'A New Hope',
          openingCrawl: 'It is a period of civil war...',
          producer: 'Gary Kurtz, Rick McCallum',
        }),
      );

      // Verify creates were called for new movies
      expect(movieRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure scenarios', async () => {
      // Arrange - Create invalid SWAPI data mixed with valid data
      const mixedSwapiFilms = [
        mockSwapiFilms[0], // Valid
        { ...mockSwapiFilms[1], title: '' }, // Invalid - empty title
        mockSwapiFilms[2], // Valid
        {
          ...mockSwapiFilms[0],
          episode_id: -1,
          url: 'https://www.swapi.tech/api/films/4/',
        }, // Invalid episode ID
      ];

      jest
        .spyOn(swapiService, 'getAllFilms')
        .mockResolvedValue(mixedSwapiFilms as SwapiFilmPropertiesDto[]);

      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);

      let createdId = 1;
      movieRepository.create.mockImplementation((data: CreateMovieData) =>
        Promise.resolve({
          id: createdId++,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Movie),
      );

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false); // Should be false due to failures
      expect(result.stats.total).toBe(4);
      expect(result.stats.created).toBe(2); // Only valid movies created
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(2); // Two invalid movies failed
      expect(result.errors).toHaveLength(2);

      // Verify error details
      expect(result.errors![0].title).toBeUndefined(); // Empty title
      expect(result.errors![0].episodeId).toBe(5);
      expect(result.errors![0].error).toContain('Title is required');

      expect(result.errors![1].title).toBe('A New Hope'); // Invalid episode ID
      expect(result.errors![1].episodeId).toBe(-1);
      expect(result.errors![1].error).toContain(
        'Episode ID must be a positive number',
      );

      // Verify only valid movies were created
      expect(movieRepository.create).toHaveBeenCalledTimes(2);

      // Verify success message includes error count
      expect(result.message).toContain(
        'Synchronization completed with 2 error(s)',
      );
      expect(result.message).toContain('Created: 2, Updated: 0, Failed: 2');
    });

    it('should handle SWAPI service unavailable gracefully', async () => {
      // Arrange
      const swapiError = new SwapiUnavailableException(
        'SWAPI service is temporarily unavailable',
      );
      jest.spyOn(swapiService, 'getAllFilms').mockRejectedValue(swapiError);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false);
      expect(result.message).toContain(
        'SWAPI service is temporarily unavailable',
      );
      expect(result.stats.total).toBe(0);
      expect(result.stats.created).toBe(0);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain('SWAPI unavailable');

      // Verify no repository operations were attempted
      expect(movieRepository.create).not.toHaveBeenCalled();
      expect(movieRepository.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during synchronization', async () => {
      // Arrange
      jest
        .spyOn(swapiService, 'getAllFilms')
        .mockResolvedValue([mockSwapiFilms[0]]);

      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.create.mockRejectedValue(
        new Error('Database connection timeout'),
      );

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false);
      expect(result.stats.total).toBe(1);
      expect(result.stats.created).toBe(0);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain('Database connection timeout');
      expect(result.errors![0].title).toBe('A New Hope');
      expect(result.errors![0].episodeId).toBe(4);
    });

    it('should handle update failures and continue processing other movies', async () => {
      // Arrange
      jest
        .spyOn(swapiService, 'getAllFilms')
        .mockResolvedValue(mockSwapiFilms.slice(0, 2));

      // First movie exists and will fail to update, second is new
      movieRepository.findBySwapiUrl.mockImplementation((url: string) =>
        Promise.resolve(
          url === 'https://www.swapi.tech/api/films/1/' ? existingMovie : null,
        ),
      );

      movieRepository.findByEpisodeId.mockImplementation((episodeId: number) =>
        Promise.resolve(episodeId === 4 ? existingMovie : null),
      );

      // Mock update failure for existing movie
      movieRepository.update.mockResolvedValue(null); // Simulate update failure

      // Mock successful create for new movie
      movieRepository.create.mockImplementation((data: CreateMovieData) =>
        Promise.resolve({
          id: 2,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Movie),
      );

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(false);
      expect(result.stats.total).toBe(2);
      expect(result.stats.created).toBe(1); // Second movie created successfully
      expect(result.stats.updated).toBe(0); // First movie failed to update
      expect(result.stats.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain(
        'Failed to update movie with ID 1',
      );
      expect(result.errors![0].title).toBe('A New Hope');
      expect(result.errors![0].episodeId).toBe(4);

      // Verify both operations were attempted
      expect(movieRepository.update).toHaveBeenCalledWith(
        existingMovie.id,
        expect.any(Object),
      );
      expect(movieRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'The Empire Strikes Back',
          episodeId: 5,
        }),
      );
    });

    it('should provide accurate timing information', async () => {
      // Arrange
      const startTime = Date.now();
      jest.spyOn(swapiService, 'getAllFilms').mockImplementation(async () => {
        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 10));
        return [mockSwapiFilms[0]];
      });

      movieRepository.findBySwapiUrl.mockResolvedValue(null);
      movieRepository.findByEpisodeId.mockResolvedValue(null);
      movieRepository.create.mockImplementation(
        async (data: CreateMovieData) => {
          // Simulate database write time
          await new Promise((resolve) => setTimeout(resolve, 5));
          return {
            id: 1,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Movie;
        },
      );

      // Act
      const result = await service.syncWithSwapi();
      const endTime = Date.now();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(true);

      // Verify timing accuracy
      const actualDuration = endTime - startTime;
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.durationMs).toBeLessThanOrEqual(actualDuration + 10); // Allow small margin

      // Verify timestamp format
      expect(new Date(result.startedAt)).toBeInstanceOf(Date);
      expect(new Date(result.completedAt)).toBeInstanceOf(Date);
      expect(new Date(result.completedAt).getTime()).toBeGreaterThan(
        new Date(result.startedAt).getTime(),
      );
    });

    it('should handle empty SWAPI response gracefully', async () => {
      // Arrange
      jest.spyOn(swapiService, 'getAllFilms').mockResolvedValue([]);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(result).toBeInstanceOf(SyncResultDto);
      expect(result.success).toBe(true);
      expect(result.stats.total).toBe(0);
      expect(result.stats.created).toBe(0);
      expect(result.stats.updated).toBe(0);
      expect(result.stats.failed).toBe(0);
      expect(result.errors).toBeUndefined();
      expect(result.message).toBe(
        'Synchronization completed successfully. Created: 0, Updated: 0',
      );

      // Verify no repository operations were performed
      expect(movieRepository.findBySwapiUrl).not.toHaveBeenCalled();
      expect(movieRepository.findByEpisodeId).not.toHaveBeenCalled();
      expect(movieRepository.create).not.toHaveBeenCalled();
      expect(movieRepository.update).not.toHaveBeenCalled();
    });
  });
});
