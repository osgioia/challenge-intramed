import { ConflictException, HttpStatus } from '@nestjs/common';

/**
 * HTTP exception (409) returned when a business rule prevents storing a
 * movie that duplicates an existing one (title, episode ID or SWAPI URL).
 */
export class MovieConflictException extends ConflictException {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super({
      status: HttpStatus.CONFLICT,
      error: 'movieAlreadyExists',
      message,
      field,
    });
  }
}
