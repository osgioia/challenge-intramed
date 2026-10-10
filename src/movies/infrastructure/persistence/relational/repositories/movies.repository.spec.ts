import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MoviesRelationalRepository } from './movies.repository';
import { MovieEntity } from '../entities/movie.entity';
import {
  Movie,
  CreateMovieData,
  UpdateMovieData,
} from '../../../../domain/movie';

describe('MoviesRelationalRepository', () => {
  let repository: MoviesRelationalRepository;
  let movieRepository: Repository<MovieEntity>;
  let queryBuilder: Partial<SelectQueryBuilder<MovieEntity>>;

  const mockMovieEntity: MovieEntity = Object.assign(new MovieEntity(), {
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
    createdAt: new Date('2021-01-01T00:00:00Z'),
    updatedAt: new Date('2021-01-01T00:00:00Z'),
  });

  const mockCreateMovieData: CreateMovieData = {
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
  };

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesRelationalRepository,
        {
          provide: getRepositoryToken(MovieEntity),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
      ],
    }).compile();

    repository = module.get<MoviesRelationalRepository>(
      MoviesRelationalRepository,
    );
    movieRepository = module.get<Repository<MovieEntity>>(
      getRepositoryToken(MovieEntity),
    );
  });

  describe('create', () => {
    it('should create and return a movie', async () => {
      const createdEntity = { ...mockMovieEntity };
      jest
        .spyOn(movieRepository, 'create')
        .mockReturnValue(createdEntity as any);
      jest.spyOn(movieRepository, 'save').mockResolvedValue(mockMovieEntity);

      const result = await repository.create(mockCreateMovieData);

      expect(movieRepository.create).toHaveBeenCalled();
      expect(movieRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toBeInstanceOf(Movie);
      expect(result.title).toBe(mockCreateMovieData.title);
    });

    it('should validate movie data before creating', async () => {
      const invalidData = { ...mockCreateMovieData, title: '' };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return paginated movies with default options', async () => {
      const mockEntities = [mockMovieEntity];
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(1);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(mockEntities);

      const result = await repository.findAll();

      expect(movieRepository.createQueryBuilder).toHaveBeenCalledWith('movie');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'movie.createdAt',
        'DESC',
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should handle pagination options', async () => {
      const mockEntities = [mockMovieEntity];
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(15);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(mockEntities);

      const options = { page: 2, limit: 5 };
      const result = await repository.findAll(options);

      expect(queryBuilder.skip).toHaveBeenCalledWith(5);
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should handle search functionality', async () => {
      const mockEntities = [mockMovieEntity];
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(1);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(mockEntities);

      const options = { search: 'Hope' };
      await repository.findAll(options);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(movie.title ILIKE :search OR movie.director ILIKE :search OR movie.producer ILIKE :search)',
        { search: '%Hope%' },
      );
    });

    it('should handle sorting options', async () => {
      const mockEntities = [mockMovieEntity];
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(1);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(mockEntities);

      const options = { sortBy: 'title' as const, sortOrder: 'ASC' as const };
      await repository.findAll(options);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('movie.title', 'ASC');
    });
  });

  describe('findById', () => {
    it('should return a movie when found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovieEntity);

      const result = await repository.findById(1);

      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBeInstanceOf(Movie);
      expect(result?.title).toBe(mockMovieEntity.title);
    });

    it('should return null when movie not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the movie when found', async () => {
      const updatedEntity = Object.assign(new MovieEntity(), {
        ...mockMovieEntity,
        title: 'Updated Title',
      });

      jest
        .spyOn(movieRepository, 'findOne')
        .mockResolvedValueOnce(mockMovieEntity)
        .mockResolvedValueOnce(updatedEntity);
      jest
        .spyOn(movieRepository, 'update')
        .mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      const updateData: UpdateMovieData = { title: 'Updated Title' };
      const result = await repository.update(1, updateData);

      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(movieRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'Updated Title',
          updatedAt: expect.any(Date),
        }),
      );
      expect(result).toBeInstanceOf(Movie);
      expect(result?.title).toBe('Updated Title');
    });

    it('should return null when movie not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      const updateData: UpdateMovieData = { title: 'Updated Title' };
      const result = await repository.update(999, updateData);

      expect(result).toBeNull();
    });

    it('should validate update data', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovieEntity);

      const invalidUpdateData: UpdateMovieData = { title: '' };

      await expect(repository.update(1, invalidUpdateData)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove a movie successfully', async () => {
      jest.spyOn(movieRepository, 'delete').mockResolvedValue({
        affected: 1,
        raw: {},
      });

      await expect(repository.remove(1)).resolves.not.toThrow();

      expect(movieRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findBySwapiUrl', () => {
    it('should return a movie when found by SWAPI URL', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovieEntity);

      const result = await repository.findBySwapiUrl(
        'https://www.swapi.tech/api/films/1/',
      );

      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { swapiUrl: 'https://www.swapi.tech/api/films/1/' },
      });
      expect(result).toBeInstanceOf(Movie);
    });

    it('should return null when not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findBySwapiUrl(
        'https://example.com/nonexistent',
      );

      expect(result).toBeNull();
    });
  });

  describe('findByTitle', () => {
    it('should return a movie when found by title', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovieEntity);

      const result = await repository.findByTitle('A New Hope');

      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { title: 'A New Hope' },
      });
      expect(result).toBeInstanceOf(Movie);
    });
  });

  describe('findByEpisodeId', () => {
    it('should return a movie when found by episode ID', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovieEntity);

      const result = await repository.findByEpisodeId(4);

      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { episodeId: 4 },
      });
      expect(result).toBeInstanceOf(Movie);
    });
  });

  describe('exists', () => {
    it('should return true when movie exists', async () => {
      jest.spyOn(movieRepository, 'count').mockResolvedValue(1);

      const result = await repository.exists(1);

      expect(result).toBe(true);
    });

    it('should return false when movie does not exist', async () => {
      jest.spyOn(movieRepository, 'count').mockResolvedValue(0);

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return the total count of movies', async () => {
      jest.spyOn(movieRepository, 'count').mockResolvedValue(42);

      const result = await repository.count();

      expect(result).toBe(42);
    });
  });

  describe('createMany', () => {
    it('should create multiple movies', async () => {
      const mockEntity2 = Object.assign(new MovieEntity(), {
        ...mockMovieEntity,
        id: 2,
        episodeId: 5,
      });
      const mockEntities = [mockMovieEntity, mockEntity2];
      jest
        .spyOn(movieRepository, 'create')
        .mockReturnValue(mockEntities as any);
      jest
        .spyOn(movieRepository, 'save')
        .mockResolvedValue(mockEntities as any);

      const moviesData = [
        mockCreateMovieData,
        { ...mockCreateMovieData, episodeId: 5 },
      ];
      const result = await repository.createMany(moviesData);

      expect(movieRepository.create).toHaveBeenCalled();
      expect(movieRepository.save).toHaveBeenCalledWith(mockEntities);
      expect(result).toHaveLength(2);
    });
  });

  describe('updateMany', () => {
    it('should update multiple movies', async () => {
      // Mock the repository.update method to return updated movies
      const updateSpy = jest
        .spyOn(repository, 'update')
        .mockResolvedValueOnce(
          new Movie({ ...mockCreateMovieData, id: 1, title: 'Updated 1' }),
        )
        .mockResolvedValueOnce(
          new Movie({ ...mockCreateMovieData, id: 2, title: 'Updated 2' }),
        );

      const updates = [
        { id: 1, data: { title: 'Updated 1' } },
        { id: 2, data: { title: 'Updated 2' } },
      ];

      const result = await repository.updateMany(updates);

      expect(updateSpy).toHaveBeenCalledWith(1, { title: 'Updated 1' });
      expect(updateSpy).toHaveBeenCalledWith(2, { title: 'Updated 2' });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Updated 1');
      expect(result[1].title).toBe('Updated 2');
    });
  });
});
