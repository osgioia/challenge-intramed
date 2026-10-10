import { plainToInstance, ClassConstructor } from 'class-transformer';
import { Movie, PaginatedMovies } from '../domain/movie';
import { MovieDto } from './movie.dto';
import { PaginatedMoviesDto } from './paginated-movies.dto';
import { SyncResultDto, SyncStats, SyncError } from './sync-result.dto';

export class ResponseTransformer {
  /**
   * Transform a single Movie domain entity to MovieDto
   */
  static toMovieDto(movie: Movie): MovieDto {
    return MovieDto.fromDomain(movie);
  }

  /**
   * Transform an array of Movie domain entities to MovieDto array
   */
  static toMovieDtoArray(movies: Movie[]): MovieDto[] {
    return movies.map((movie) => MovieDto.fromDomain(movie));
  }

  /**
   * Transform PaginatedMovies domain object to PaginatedMoviesDto
   */
  static toPaginatedMoviesDto(
    paginatedMovies: PaginatedMovies,
  ): PaginatedMoviesDto {
    return PaginatedMoviesDto.fromDomain(paginatedMovies);
  }

  /**
   * Transform sync result data to SyncResultDto
   */
  static toSyncResultDto(
    success: boolean,
    stats: SyncStats,
    startedAt: Date,
    completedAt: Date,
    errors?: SyncError[],
  ): SyncResultDto {
    if (success) {
      return SyncResultDto.success(stats, startedAt, completedAt, errors);
    } else {
      const errorMessage =
        errors && errors.length > 0
          ? errors[0].error
          : 'Unknown synchronization error';
      return SyncResultDto.failure(errorMessage, startedAt, stats, errors);
    }
  }

  /**
   * Generic method to transform any object to DTO using class-transformer
   */
  static toDto<T, K>(DtoClass: ClassConstructor<T>, data: K | K[]): T | T[] {
    return plainToInstance(DtoClass, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  /**
   * Transform Movie entity data to DTO with proper date serialization
   */
  static serializeMovieResponse(movie: Movie): Record<string, any> {
    return {
      id: movie.id,
      title: movie.title,
      episodeId: movie.episodeId,
      openingCrawl: movie.openingCrawl,
      director: movie.director,
      producer: movie.producer,
      releaseDate: movie.releaseDate?.toISOString(),
      characters: movie.characters,
      planets: movie.planets,
      starships: movie.starships,
      vehicles: movie.vehicles,
      species: movie.species,
      swapiUrl: movie.swapiUrl,
      createdAt: movie.createdAt?.toISOString(),
      updatedAt: movie.updatedAt?.toISOString(),
    };
  }

  /**
   * Transform paginated response with proper serialization
   */
  static serializePaginatedResponse(
    paginatedMovies: PaginatedMovies,
  ): Record<string, any> {
    return {
      data: paginatedMovies.data.map((movie) =>
        this.serializeMovieResponse(movie),
      ),
      total: paginatedMovies.total,
      page: paginatedMovies.page,
      limit: paginatedMovies.limit,
      totalPages: paginatedMovies.totalPages,
      hasNextPage: paginatedMovies.hasNextPage,
      hasPreviousPage: paginatedMovies.hasPreviousPage,
    };
  }
}
