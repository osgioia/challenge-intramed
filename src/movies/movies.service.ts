import { Injectable, Logger } from '@nestjs/common';
import {
  Movie,
  FindAllMoviesOptions,
  PaginatedMovies,
  CreateMovieData,
  UpdateMovieData,
} from './domain/movie';
import { MovieNotFoundError, MovieDomainError, MovieId } from './domain/types';
import { MovieRepository } from './infrastructure/persistence/movie.repository';
import { SwapiService } from '../swapi/swapi.service';
import { mapSwapiFilmToMovie } from '../swapi/mappers/swapi-movie.mapper';
import { SwapiUnavailableException } from '../swapi/exceptions/swapi-unavailable.exception';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';
import { SyncResultDto, SyncStats, SyncError } from './dto/sync-result.dto';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly swapiService: SwapiService,
  ) {}

  async findAll(query: QueryMovieDto = {}): Promise<PaginatedMovies> {
    this.logger.log(`Finding all movies with query: ${JSON.stringify(query)}`);

    const options: FindAllMoviesOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
      search: query.search,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'DESC',
    };

    try {
      const result = await this.movieRepository.findAll(options);
      this.logger.log(
        `Found ${result.total} movies (page ${result.page}/${result.totalPages})`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to find movies: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: MovieId): Promise<Movie> {
    this.logger.log(`Finding movie by ID: ${id}`);

    try {
      const movie = await this.movieRepository.findById(id);

      if (!movie) {
        this.logger.warn(`Movie with ID ${id} not found`);
        throw new MovieNotFoundError(id, 'id');
      }

      this.logger.log(`Found movie: ${movie.title}`);
      return movie;
    } catch (error) {
      if (error instanceof MovieNotFoundError) {
        throw error;
      }

      this.logger.error(
        `Failed to find movie by ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    this.logger.log(`Creating new movie: ${createMovieDto.title}`);

    try {
      // Check for duplicate by title
      const existingByTitle = await this.movieRepository.findByTitle(
        createMovieDto.title,
      );
      if (existingByTitle) {
        this.logger.warn(
          `Movie with title "${createMovieDto.title}" already exists`,
        );
        throw new MovieDomainError(
          `A movie with title "${createMovieDto.title}" already exists`,
          'title',
          createMovieDto.title,
          'conflict',
        );
      }

      // Check for duplicate by episode ID
      const existingByEpisode = await this.movieRepository.findByEpisodeId(
        createMovieDto.episodeId,
      );
      if (existingByEpisode) {
        this.logger.warn(
          `Movie with episode ID ${createMovieDto.episodeId} already exists`,
        );
        throw new MovieDomainError(
          `A movie with episode ID ${createMovieDto.episodeId} already exists`,
          'episodeId',
          createMovieDto.episodeId,
          'conflict',
        );
      }

      // Check for duplicate by SWAPI URL if provided
      if (createMovieDto.swapiUrl) {
        const existingBySwapiUrl = await this.movieRepository.findBySwapiUrl(
          createMovieDto.swapiUrl,
        );
        if (existingBySwapiUrl) {
          this.logger.warn(
            `Movie with SWAPI URL "${createMovieDto.swapiUrl}" already exists`,
          );
          throw new MovieDomainError(
            `A movie with SWAPI URL "${createMovieDto.swapiUrl}" already exists`,
            'swapiUrl',
            createMovieDto.swapiUrl,
            'conflict',
          );
        }
      }

      const movieData: CreateMovieData = {
        title: createMovieDto.title,
        episodeId: createMovieDto.episodeId,
        openingCrawl: createMovieDto.openingCrawl,
        director: createMovieDto.director,
        producer: createMovieDto.producer,
        releaseDate: new Date(createMovieDto.releaseDate),
        characters: createMovieDto.characters,
        planets: createMovieDto.planets,
        starships: createMovieDto.starships,
        vehicles: createMovieDto.vehicles,
        species: createMovieDto.species,
        swapiUrl: createMovieDto.swapiUrl,
      };

      const movie = await this.movieRepository.create(movieData);
      this.logger.log(
        `Successfully created movie: ${movie.title} (ID: ${movie.id})`,
      );

      return movie;
    } catch (error) {
      if (error instanceof MovieDomainError) {
        throw error;
      }

      this.logger.error(
        `Failed to create movie "${createMovieDto.title}": ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async update(id: MovieId, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    this.logger.log(`Updating movie with ID: ${id}`);

    try {
      // Check if movie exists
      const existingMovie = await this.movieRepository.findById(id);
      if (!existingMovie) {
        this.logger.warn(`Movie with ID ${id} not found for update`);
        throw new MovieNotFoundError(id, 'id');
      }

      // Check for duplicate title if title is being updated
      if (
        updateMovieDto.title &&
        updateMovieDto.title !== existingMovie.title
      ) {
        const duplicateByTitle = await this.movieRepository.findByTitle(
          updateMovieDto.title,
        );
        if (duplicateByTitle && duplicateByTitle.id !== id) {
          this.logger.warn(
            `Another movie with title "${updateMovieDto.title}" already exists`,
          );
          throw new MovieDomainError(
            `A movie with title "${updateMovieDto.title}" already exists`,
            'title',
            updateMovieDto.title,
            'conflict',
          );
        }
      }

      // Check for duplicate episode ID if episode ID is being updated
      if (
        updateMovieDto.episodeId &&
        updateMovieDto.episodeId !== existingMovie.episodeId
      ) {
        const duplicateByEpisode = await this.movieRepository.findByEpisodeId(
          updateMovieDto.episodeId,
        );
        if (duplicateByEpisode && duplicateByEpisode.id !== id) {
          this.logger.warn(
            `Another movie with episode ID ${updateMovieDto.episodeId} already exists`,
          );
          throw new MovieDomainError(
            `A movie with episode ID ${updateMovieDto.episodeId} already exists`,
            'episodeId',
            updateMovieDto.episodeId,
            'conflict',
          );
        }
      }

      // Check for duplicate SWAPI URL if SWAPI URL is being updated
      if (
        updateMovieDto.swapiUrl &&
        updateMovieDto.swapiUrl !== existingMovie.swapiUrl
      ) {
        const duplicateBySwapiUrl = await this.movieRepository.findBySwapiUrl(
          updateMovieDto.swapiUrl,
        );
        if (duplicateBySwapiUrl && duplicateBySwapiUrl.id !== id) {
          this.logger.warn(
            `Another movie with SWAPI URL "${updateMovieDto.swapiUrl}" already exists`,
          );
          throw new MovieDomainError(
            `A movie with SWAPI URL "${updateMovieDto.swapiUrl}" already exists`,
            'swapiUrl',
            updateMovieDto.swapiUrl,
            'conflict',
          );
        }
      }

      const updateData: UpdateMovieData = {};

      if (updateMovieDto.title !== undefined) {
        updateData.title = updateMovieDto.title;
      }
      if (updateMovieDto.episodeId !== undefined) {
        updateData.episodeId = updateMovieDto.episodeId;
      }
      if (updateMovieDto.openingCrawl !== undefined) {
        updateData.openingCrawl = updateMovieDto.openingCrawl;
      }
      if (updateMovieDto.director !== undefined) {
        updateData.director = updateMovieDto.director;
      }
      if (updateMovieDto.producer !== undefined) {
        updateData.producer = updateMovieDto.producer;
      }
      if (updateMovieDto.releaseDate !== undefined) {
        updateData.releaseDate = new Date(updateMovieDto.releaseDate);
      }
      if (updateMovieDto.characters !== undefined) {
        updateData.characters = updateMovieDto.characters;
      }
      if (updateMovieDto.planets !== undefined) {
        updateData.planets = updateMovieDto.planets;
      }
      if (updateMovieDto.starships !== undefined) {
        updateData.starships = updateMovieDto.starships;
      }
      if (updateMovieDto.vehicles !== undefined) {
        updateData.vehicles = updateMovieDto.vehicles;
      }
      if (updateMovieDto.species !== undefined) {
        updateData.species = updateMovieDto.species;
      }
      if (updateMovieDto.swapiUrl !== undefined) {
        updateData.swapiUrl = updateMovieDto.swapiUrl;
      }

      const updatedMovie = await this.movieRepository.update(id, updateData);

      if (!updatedMovie) {
        this.logger.error(
          `Failed to update movie with ID ${id} - movie not found after update`,
        );
        throw new MovieNotFoundError(id, 'id');
      }

      this.logger.log(
        `Successfully updated movie: ${updatedMovie.title} (ID: ${id})`,
      );
      return updatedMovie;
    } catch (error) {
      if (
        error instanceof MovieNotFoundError ||
        error instanceof MovieDomainError
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update movie with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async remove(id: MovieId): Promise<void> {
    this.logger.log(`Removing movie with ID: ${id}`);

    try {
      // Check if movie exists
      const existingMovie = await this.movieRepository.findById(id);
      if (!existingMovie) {
        this.logger.warn(`Movie with ID ${id} not found for deletion`);
        throw new MovieNotFoundError(id, 'id');
      }

      await this.movieRepository.remove(id);
      this.logger.log(
        `Successfully removed movie: ${existingMovie.title} (ID: ${id})`,
      );
    } catch (error) {
      if (error instanceof MovieNotFoundError) {
        throw error;
      }

      this.logger.error(
        `Failed to remove movie with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async syncWithSwapi(): Promise<SyncResultDto> {
    const startedAt = new Date();
    this.logger.log('Starting SWAPI synchronization process');

    const stats: SyncStats = {
      created: 0,
      updated: 0,
      failed: 0,
      total: 0,
    };

    const errors: SyncError[] = [];

    try {
      // Fetch all films from SWAPI
      this.logger.log('Fetching films from SWAPI...');
      const swapiFilms = await this.swapiService.getAllFilms();
      stats.total = swapiFilms.length;

      this.logger.log(`Fetched ${swapiFilms.length} films from SWAPI`);

      // Process each film
      for (const swapiFilm of swapiFilms) {
        try {
          // Map SWAPI data to our domain format
          const movieData = mapSwapiFilmToMovie(swapiFilm);

          // Check if movie already exists (by SWAPI URL first, then by episode ID)
          let existingMovie: Movie | null = null;

          if (movieData.swapiUrl) {
            existingMovie = await this.movieRepository.findBySwapiUrl(
              movieData.swapiUrl,
            );
          }

          if (!existingMovie) {
            existingMovie = await this.movieRepository.findByEpisodeId(
              movieData.episodeId,
            );
          }

          if (existingMovie) {
            // Update existing movie
            await this.updateMovieFromSwapi(existingMovie, movieData);
            stats.updated++;
            this.logger.log(
              `Updated existing movie: ${movieData.title} (Episode ${movieData.episodeId})`,
            );
          } else {
            // Create new movie
            await this.createMovieFromSwapi(movieData);
            stats.created++;
            this.logger.log(
              `Created new movie: ${movieData.title} (Episode ${movieData.episodeId})`,
            );
          }
        } catch (error) {
          stats.failed++;
          const syncError: SyncError = {
            title: swapiFilm.title || undefined,
            episodeId: swapiFilm.episode_id || undefined,
            error: error.message,
          };
          errors.push(syncError);

          const errorMessage = `Failed to sync movie "${swapiFilm.title || 'Unknown'}" (Episode ${swapiFilm.episode_id || 'Unknown'}): ${error.message}`;
          this.logger.error(errorMessage, error.stack);
        }
      }

      const completedAt = new Date();
      this.logger.log(
        `SWAPI synchronization completed. Created: ${stats.created}, Updated: ${stats.updated}, Failed: ${stats.failed}. Duration: ${completedAt.getTime() - startedAt.getTime()}ms`,
      );

      // Return success result with any errors that occurred during processing
      return SyncResultDto.success(
        stats,
        startedAt,
        completedAt,
        errors.length > 0 ? errors : undefined,
      );
    } catch (error) {
      if (error instanceof SwapiUnavailableException) {
        this.logger.error(
          `SWAPI synchronization failed: ${error.message}`,
          error.stack,
        );
        const syncError: SyncError = {
          error: `SWAPI unavailable: ${error.message}`,
        };
        return SyncResultDto.failure(error.message, startedAt, stats, [
          syncError,
        ]);
      }

      this.logger.error(
        `Unexpected error during SWAPI synchronization: ${error.message}`,
        error.stack,
      );
      const syncError: SyncError = {
        error: `Synchronization error: ${error.message}`,
      };
      return SyncResultDto.failure(error.message, startedAt, stats, [
        syncError,
      ]);
    }
  }

  private async updateMovieFromSwapi(
    existingMovie: Movie,
    swapiMovieData: CreateMovieData,
  ): Promise<Movie> {
    const updateData: UpdateMovieData = {
      title: swapiMovieData.title,
      episodeId: swapiMovieData.episodeId,
      openingCrawl: swapiMovieData.openingCrawl,
      director: swapiMovieData.director,
      producer: swapiMovieData.producer,
      releaseDate: swapiMovieData.releaseDate,
      characters: swapiMovieData.characters,
      planets: swapiMovieData.planets,
      starships: swapiMovieData.starships,
      vehicles: swapiMovieData.vehicles,
      species: swapiMovieData.species,
      swapiUrl: swapiMovieData.swapiUrl,
    };

    const updatedMovie = await this.movieRepository.update(
      existingMovie.id!,
      updateData,
    );

    if (!updatedMovie) {
      throw new Error(`Failed to update movie with ID ${existingMovie.id}`);
    }

    return updatedMovie;
  }

  private async createMovieFromSwapi(
    swapiMovieData: CreateMovieData,
  ): Promise<Movie> {
    // For SWAPI sync, we don't need to check for duplicates since we already did that
    // in the sync method. We directly create the movie.
    return await this.movieRepository.create(swapiMovieData);
  }
}
