import {
  Movie,
  FindAllMoviesOptions,
  PaginatedMovies,
  CreateMovieData,
  UpdateMovieData,
} from '../../domain/movie';

export abstract class MovieRepository {
  abstract create(data: CreateMovieData): Promise<Movie>;

  abstract findAll(options?: FindAllMoviesOptions): Promise<PaginatedMovies>;

  abstract findById(id: Movie['id']): Promise<Movie | null>;

  abstract update(
    id: Movie['id'],
    payload: UpdateMovieData,
  ): Promise<Movie | null>;

  abstract remove(id: Movie['id']): Promise<void>;

  abstract findBySwapiUrl(url: string): Promise<Movie | null>;

  abstract findByTitle(title: string): Promise<Movie | null>;

  abstract findByEpisodeId(episodeId: number): Promise<Movie | null>;

  abstract exists(id: Movie['id']): Promise<boolean>;

  abstract count(): Promise<number>;

  abstract createMany(movies: CreateMovieData[]): Promise<Movie[]>;

  abstract updateMany(
    updates: Array<{ id: Movie['id']; data: UpdateMovieData }>,
  ): Promise<Movie[]>;
}
