export type MovieSortField =
  | 'title'
  | 'episodeId'
  | 'releaseDate'
  | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';
export type MovieId = number | string;

export interface MovieSearchCriteria {
  title?: string;
  director?: string;
  episodeId?: number;
  releaseYear?: number;
}

export interface SyncResult {
  totalFetched: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

export interface SyncStatistics extends SyncResult {
  startTime: Date;
  endTime: Date;
  duration: number;
}

export enum MovieSyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface MovieValidationError {
  field: string;
  message: string;
  value?: any;
}

export type MovieDomainErrorKind = 'validation' | 'conflict';

export class MovieDomainError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any,
    /**
     * Distinguishes data validation failures from business rule violations
     * (duplicated movies), so each one can map to a different HTTP status.
     */
    public readonly kind: MovieDomainErrorKind = 'validation',
  ) {
    super(message);
    this.name = 'MovieDomainError';
  }
}

export class MovieNotFoundError extends Error {
  constructor(
    public readonly id: MovieId,
    public readonly searchBy: 'id' | 'title' | 'episodeId' | 'swapiUrl' = 'id',
  ) {
    super(`Movie not found by ${searchBy}: ${id}`);
    this.name = 'MovieNotFoundError';
  }
}

export class MovieValidationException extends Error {
  constructor(
    message: string,
    public readonly validationErrors: MovieValidationError[],
  ) {
    super(message);
    this.name = 'MovieValidationException';
  }
}
