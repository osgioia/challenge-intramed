import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { MovieNotFoundException } from './movie-not-found.exception';
import { MovieConflictException } from './movie-conflict.exception';
import { MovieValidationException } from './movie-validation.exception';

describe('Movie exceptions', () => {
  describe('MovieNotFoundException', () => {
    it('should return HTTP 404 with a movieNotFound body', () => {
      const exception = new MovieNotFoundException(42);

      expect(exception).toBeInstanceOf(NotFoundException);
      expect(exception.getStatus()).toBe(404);
      expect(exception.getResponse()).toEqual({
        status: 404,
        error: 'movieNotFound',
        message: 'Movie with ID 42 not found',
      });
    });

    it('should expose the ID of the movie that was not found', () => {
      const exception = new MovieNotFoundException(42);

      expect(exception.movieId).toBe(42);
    });
  });

  describe('MovieConflictException', () => {
    it('should return HTTP 409 with a movieAlreadyExists body', () => {
      const message = 'A movie with title "A New Hope" already exists';
      const exception = new MovieConflictException(message, 'title');

      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception.getStatus()).toBe(409);
      expect(exception.getResponse()).toEqual({
        status: 409,
        error: 'movieAlreadyExists',
        message,
        field: 'title',
      });
    });

    it('should work without a conflicting field', () => {
      const exception = new MovieConflictException('Duplicate movie');

      expect(exception.getStatus()).toBe(409);
      expect(exception.getResponse()).toEqual(
        expect.objectContaining({
          status: 409,
          error: 'movieAlreadyExists',
          message: 'Duplicate movie',
        }),
      );
    });
  });

  describe('MovieValidationException', () => {
    it('should return HTTP 400 including the validation errors', () => {
      const validationErrors = [
        { field: 'title', message: 'title should not be empty', value: '' },
      ];
      const exception = new MovieValidationException(
        'Movie validation failed',
        validationErrors,
      );

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.getStatus()).toBe(400);
      expect(exception.getResponse()).toEqual({
        status: 400,
        error: 'movieValidationFailed',
        message: 'Movie validation failed',
        validationErrors,
      });
    });

    it('should default to an empty list of validation errors', () => {
      const exception = new MovieValidationException('Movie validation failed');

      expect(exception.getStatus()).toBe(400);
      expect(exception.validationErrors).toEqual([]);
    });
  });
});
