import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, FindOptionsWhere } from 'typeorm';
import {
  Movie,
  FindAllMoviesOptions,
  PaginatedMovies,
  CreateMovieData,
  UpdateMovieData,
} from '../../../../domain/movie';
import { MovieSortField } from '../../../../domain/types';
import { MovieRepository } from '../../movie.repository';
import { MovieEntity } from '../entities/movie.entity';
import { MovieMapper } from '../mappers/movie.mapper';

@Injectable()
export class MoviesRelationalRepository implements MovieRepository {
  constructor(
    @InjectRepository(MovieEntity)
    private readonly moviesRepository: Repository<MovieEntity>,
  ) {}

  async create(data: CreateMovieData): Promise<Movie> {
    const persistenceModel = MovieMapper.toPersistence(new Movie(data));
    const newEntity = await this.moviesRepository.save(
      this.moviesRepository.create(persistenceModel),
    );
    return MovieMapper.toDomain(newEntity);
  }

  async createMany(movies: CreateMovieData[]): Promise<Movie[]> {
    const persistenceModels = movies.map((data) =>
      MovieMapper.toPersistence(new Movie(data)),
    );

    const entities = await this.moviesRepository.save(
      this.moviesRepository.create(persistenceModels),
    );

    return MovieMapper.toDomainArray(entities);
  }

  async findAll(options: FindAllMoviesOptions = {}): Promise<PaginatedMovies> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const queryBuilder = this.moviesRepository.createQueryBuilder('movie');

    // Apply search filters
    if (search) {
      queryBuilder.andWhere(
        '(movie.title ILIKE :search OR movie.director ILIKE :search OR movie.producer ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    this.applySorting(queryBuilder, sortBy, sortOrder);

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const entities = await queryBuilder.getMany();
    const data = MovieMapper.toDomainArray(entities);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async findById(id: Movie['id']): Promise<Movie | null> {
    const entity = await this.moviesRepository.findOne({
      where: { id: id as number } as FindOptionsWhere<MovieEntity>,
    });

    return entity ? MovieMapper.toDomain(entity) : null;
  }

  async update(
    id: Movie['id'],
    payload: UpdateMovieData,
  ): Promise<Movie | null> {
    const entity = await this.moviesRepository.findOne({
      where: { id: id as number } as FindOptionsWhere<MovieEntity>,
    });

    if (!entity) {
      return null;
    }

    // Create a temporary Movie instance for validation
    const currentMovie = MovieMapper.toDomain(entity);
    currentMovie.update(payload);

    // Map back to persistence format
    const updatedEntity = MovieMapper.toPersistence(currentMovie);

    // Update the entity
    await this.moviesRepository.update(id as number, {
      title: updatedEntity.title,
      episodeId: updatedEntity.episodeId,
      openingCrawl: updatedEntity.openingCrawl,
      director: updatedEntity.director,
      producer: updatedEntity.producer,
      releaseDate: updatedEntity.releaseDate,
      characters: updatedEntity.characters,
      planets: updatedEntity.planets,
      starships: updatedEntity.starships,
      vehicles: updatedEntity.vehicles,
      species: updatedEntity.species,
      swapiUrl: updatedEntity.swapiUrl,
      updatedAt: new Date(),
    });

    // Return updated entity
    const refreshedEntity = await this.moviesRepository.findOne({
      where: { id: id as number } as FindOptionsWhere<MovieEntity>,
    });

    return refreshedEntity ? MovieMapper.toDomain(refreshedEntity) : null;
  }

  async updateMany(
    updates: Array<{ id: Movie['id']; data: UpdateMovieData }>,
  ): Promise<Movie[]> {
    const results: Movie[] = [];

    for (const update of updates) {
      const result = await this.update(update.id, update.data);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  async remove(id: Movie['id']): Promise<void> {
    await this.moviesRepository.delete(id as number);
  }

  async findBySwapiUrl(url: string): Promise<Movie | null> {
    const entity = await this.moviesRepository.findOne({
      where: { swapiUrl: url } as FindOptionsWhere<MovieEntity>,
    });

    return entity ? MovieMapper.toDomain(entity) : null;
  }

  async findByTitle(title: string): Promise<Movie | null> {
    const entity = await this.moviesRepository.findOne({
      where: { title } as FindOptionsWhere<MovieEntity>,
    });

    return entity ? MovieMapper.toDomain(entity) : null;
  }

  async findByEpisodeId(episodeId: number): Promise<Movie | null> {
    const entity = await this.moviesRepository.findOne({
      where: { episodeId } as FindOptionsWhere<MovieEntity>,
    });

    return entity ? MovieMapper.toDomain(entity) : null;
  }

  async exists(id: Movie['id']): Promise<boolean> {
    const count = await this.moviesRepository.count({
      where: { id: id as number } as FindOptionsWhere<MovieEntity>,
    });

    return count > 0;
  }

  async count(): Promise<number> {
    return this.moviesRepository.count();
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<MovieEntity>,
    sortBy: MovieSortField,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    const columnMap: Record<MovieSortField, string> = {
      title: 'movie.title',
      episodeId: 'movie.episodeId',
      releaseDate: 'movie.releaseDate',
      createdAt: 'movie.createdAt',
    };

    const column = columnMap[sortBy] || 'movie.createdAt';
    queryBuilder.orderBy(column, sortOrder);
  }
}
