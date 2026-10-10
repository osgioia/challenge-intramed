import { HttpStatus, NotFoundException } from '@nestjs/common';
import { MovieId } from '../domain/types';

/**
 * HTTP exception (404) returned when a movie cannot be found.
 *
 * Extends NestJS `NotFoundException` so it keeps working with any code or
 * test that already expects that base class.
 */
export class MovieNotFoundException extends NotFoundException {
  constructor(public readonly movieId: MovieId) {
    super({
      status: HttpStatus.NOT_FOUND,
      error: 'movieNotFound',
      message: `Movie with ID ${movieId} not found`,
    });
  }
}
