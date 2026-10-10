import {
  MovieId,
  MovieDomainError,
  MovieValidationError as ValidationError,
  MovieSortField,
  SortOrder,
} from './types';

export class Movie {
  id?: MovieId;
  title: string;
  episodeId: number;
  openingCrawl: string;
  director: string;
  producer: string;
  releaseDate: Date;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  swapiUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: CreateMovieData) {
    this.validateConstructorData(data);

    this.title = data.title.trim();
    this.episodeId = data.episodeId;
    this.openingCrawl = data.openingCrawl.trim();
    this.director = data.director.trim();
    this.producer = data.producer.trim();
    this.releaseDate = new Date(data.releaseDate);
    this.characters = [...data.characters];
    this.planets = [...data.planets];
    this.starships = [...data.starships];
    this.vehicles = [...data.vehicles];
    this.species = [...data.species];
    this.swapiUrl = data.swapiUrl;
    this.id = data.id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  private validateConstructorData(data: CreateMovieData): void {
    const errors: ValidationError[] = [];

    // Title validation
    if (!data.title || data.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Movie title is required and cannot be empty',
        value: data.title,
      });
    } else if (data.title.trim().length > 255) {
      errors.push({
        field: 'title',
        message: 'Movie title cannot exceed 255 characters',
        value: data.title,
      });
    }

    // Episode ID validation
    if (!Number.isInteger(data.episodeId) || data.episodeId <= 0) {
      errors.push({
        field: 'episodeId',
        message: 'Episode ID must be a positive integer',
        value: data.episodeId,
      });
    }

    // Opening crawl validation
    if (!data.openingCrawl || data.openingCrawl.trim().length === 0) {
      errors.push({
        field: 'openingCrawl',
        message: 'Opening crawl is required and cannot be empty',
        value: data.openingCrawl,
      });
    }

    // Director validation
    if (!data.director || data.director.trim().length === 0) {
      errors.push({
        field: 'director',
        message: 'Director is required and cannot be empty',
        value: data.director,
      });
    } else if (data.director.trim().length > 255) {
      errors.push({
        field: 'director',
        message: 'Director name cannot exceed 255 characters',
        value: data.director,
      });
    }

    // Producer validation
    if (!data.producer || data.producer.trim().length === 0) {
      errors.push({
        field: 'producer',
        message: 'Producer is required and cannot be empty',
        value: data.producer,
      });
    } else if (data.producer.trim().length > 500) {
      errors.push({
        field: 'producer',
        message: 'Producer names cannot exceed 500 characters',
        value: data.producer,
      });
    }

    // Release date validation
    if (!data.releaseDate) {
      errors.push({
        field: 'releaseDate',
        message: 'Release date is required',
        value: data.releaseDate,
      });
    } else {
      try {
        const date = new Date(data.releaseDate);
        if (isNaN(date.getTime())) {
          errors.push({
            field: 'releaseDate',
            message: 'Release date must be a valid date',
            value: data.releaseDate,
          });
        }
      } catch {
        errors.push({
          field: 'releaseDate',
          message: 'Release date must be a valid date',
          value: data.releaseDate,
        });
      }
    }

    // Array validations
    this.validateArrayField(data.characters, 'characters', errors);
    this.validateArrayField(data.planets, 'planets', errors);
    this.validateArrayField(data.starships, 'starships', errors);
    this.validateArrayField(data.vehicles, 'vehicles', errors);
    this.validateArrayField(data.species, 'species', errors);

    // SWAPI URL validation
    if (data.swapiUrl && !this.isValidUrl(data.swapiUrl)) {
      errors.push({
        field: 'swapiUrl',
        message: 'SWAPI URL must be a valid URL format',
        value: data.swapiUrl,
      });
    }

    if (errors.length > 0) {
      throw new MovieDomainError(
        'Movie validation failed',
        errors[0].field,
        errors[0].value,
      );
    }
  }

  private validateArrayField(
    array: any,
    fieldName: string,
    errors: ValidationError[],
  ): void {
    if (!Array.isArray(array)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be an array`,
        value: array,
      });
      return;
    }

    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (typeof item !== 'string') {
        errors.push({
          field: `${fieldName}[${i}]`,
          message: `All ${fieldName} items must be strings`,
          value: item,
        });
      } else if (!this.isValidUrl(item)) {
        errors.push({
          field: `${fieldName}[${i}]`,
          message: `All ${fieldName} must be valid URL strings`,
          value: item,
        });
      }
    }
  }

  private isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }

  public update(updateData: Partial<UpdateMovieData>): void {
    const errors: ValidationError[] = [];

    if (updateData.title !== undefined) {
      if (!updateData.title || updateData.title.trim().length === 0) {
        errors.push({
          field: 'title',
          message: 'Movie title cannot be empty',
          value: updateData.title,
        });
      } else if (updateData.title.trim().length > 255) {
        errors.push({
          field: 'title',
          message: 'Movie title cannot exceed 255 characters',
          value: updateData.title,
        });
      }
    }

    if (updateData.episodeId !== undefined) {
      if (
        !Number.isInteger(updateData.episodeId) ||
        updateData.episodeId <= 0
      ) {
        errors.push({
          field: 'episodeId',
          message: 'Episode ID must be a positive integer',
          value: updateData.episodeId,
        });
      }
    }

    if (updateData.openingCrawl !== undefined) {
      if (
        !updateData.openingCrawl ||
        updateData.openingCrawl.trim().length === 0
      ) {
        errors.push({
          field: 'openingCrawl',
          message: 'Opening crawl cannot be empty',
          value: updateData.openingCrawl,
        });
      }
    }

    if (updateData.director !== undefined) {
      if (!updateData.director || updateData.director.trim().length === 0) {
        errors.push({
          field: 'director',
          message: 'Director cannot be empty',
          value: updateData.director,
        });
      } else if (updateData.director.trim().length > 255) {
        errors.push({
          field: 'director',
          message: 'Director name cannot exceed 255 characters',
          value: updateData.director,
        });
      }
    }

    if (updateData.producer !== undefined) {
      if (!updateData.producer || updateData.producer.trim().length === 0) {
        errors.push({
          field: 'producer',
          message: 'Producer cannot be empty',
          value: updateData.producer,
        });
      } else if (updateData.producer.trim().length > 500) {
        errors.push({
          field: 'producer',
          message: 'Producer names cannot exceed 500 characters',
          value: updateData.producer,
        });
      }
    }

    if (updateData.releaseDate !== undefined) {
      if (!updateData.releaseDate) {
        errors.push({
          field: 'releaseDate',
          message: 'Release date cannot be null',
          value: updateData.releaseDate,
        });
      } else {
        try {
          const date = new Date(updateData.releaseDate);
          if (isNaN(date.getTime())) {
            errors.push({
              field: 'releaseDate',
              message: 'Release date must be a valid date',
              value: updateData.releaseDate,
            });
          }
        } catch {
          errors.push({
            field: 'releaseDate',
            message: 'Release date must be a valid date',
            value: updateData.releaseDate,
          });
        }
      }
    }

    // Validate array updates
    if (updateData.characters !== undefined) {
      this.validateArrayField(updateData.characters, 'characters', errors);
    }
    if (updateData.planets !== undefined) {
      this.validateArrayField(updateData.planets, 'planets', errors);
    }
    if (updateData.starships !== undefined) {
      this.validateArrayField(updateData.starships, 'starships', errors);
    }
    if (updateData.vehicles !== undefined) {
      this.validateArrayField(updateData.vehicles, 'vehicles', errors);
    }
    if (updateData.species !== undefined) {
      this.validateArrayField(updateData.species, 'species', errors);
    }

    if (updateData.swapiUrl !== undefined) {
      if (updateData.swapiUrl && !this.isValidUrl(updateData.swapiUrl)) {
        errors.push({
          field: 'swapiUrl',
          message: 'SWAPI URL must be a valid URL format',
          value: updateData.swapiUrl,
        });
      }
    }

    if (errors.length > 0) {
      throw new MovieDomainError(
        'Movie update validation failed',
        errors[0].field,
        errors[0].value,
      );
    }

    // Apply updates if validation passes
    if (updateData.title !== undefined) {
      this.title = updateData.title.trim();
    }
    if (updateData.episodeId !== undefined) {
      this.episodeId = updateData.episodeId;
    }
    if (updateData.openingCrawl !== undefined) {
      this.openingCrawl = updateData.openingCrawl.trim();
    }
    if (updateData.director !== undefined) {
      this.director = updateData.director.trim();
    }
    if (updateData.producer !== undefined) {
      this.producer = updateData.producer.trim();
    }
    if (updateData.releaseDate !== undefined) {
      this.releaseDate = new Date(updateData.releaseDate);
    }
    if (updateData.characters !== undefined) {
      this.characters = [...updateData.characters];
    }
    if (updateData.planets !== undefined) {
      this.planets = [...updateData.planets];
    }
    if (updateData.starships !== undefined) {
      this.starships = [...updateData.starships];
    }
    if (updateData.vehicles !== undefined) {
      this.vehicles = [...updateData.vehicles];
    }
    if (updateData.species !== undefined) {
      this.species = [...updateData.species];
    }
    if (updateData.swapiUrl !== undefined) {
      this.swapiUrl = updateData.swapiUrl;
    }

    this.updatedAt = new Date();
  }

  public toJSON(): MovieJSON {
    return {
      id: this.id,
      title: this.title,
      episodeId: this.episodeId,
      openingCrawl: this.openingCrawl,
      director: this.director,
      producer: this.producer,
      releaseDate: this.releaseDate,
      characters: [...this.characters],
      planets: [...this.planets],
      starships: [...this.starships],
      vehicles: [...this.vehicles],
      species: [...this.species],
      swapiUrl: this.swapiUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(data: CreateMovieData): Movie {
    return new Movie(data);
  }

  public clone(): Movie {
    return new Movie({
      id: this.id,
      title: this.title,
      episodeId: this.episodeId,
      openingCrawl: this.openingCrawl,
      director: this.director,
      producer: this.producer,
      releaseDate: this.releaseDate,
      characters: this.characters,
      planets: this.planets,
      starships: this.starships,
      vehicles: this.vehicles,
      species: this.species,
      swapiUrl: this.swapiUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  public equals(other: Movie): boolean {
    return (
      this.id === other.id &&
      this.title === other.title &&
      this.episodeId === other.episodeId &&
      this.swapiUrl === other.swapiUrl
    );
  }
}

export interface CreateMovieData {
  id?: number | string;
  title: string;
  episodeId: number;
  openingCrawl: string;
  director: string;
  producer: string;
  releaseDate: Date | string;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  swapiUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateMovieData {
  title?: string;
  episodeId?: number;
  openingCrawl?: string;
  director?: string;
  producer?: string;
  releaseDate?: Date | string;
  characters?: string[];
  planets?: string[];
  starships?: string[];
  vehicles?: string[];
  species?: string[];
  swapiUrl?: string;
}

export interface MovieJSON {
  id?: number | string;
  title: string;
  episodeId: number;
  openingCrawl: string;
  director: string;
  producer: string;
  releaseDate: Date;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  swapiUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FindAllMoviesOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: MovieSortField;
  sortOrder?: SortOrder;
}

export interface PaginatedMovies {
  data: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
