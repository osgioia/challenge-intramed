import { ApiResponseOptions } from '@nestjs/swagger';

/**
 * Shared OpenAPI response definitions for the movies API error payloads.
 *
 * Every example mirrors the exact body produced by `AllExceptionsFilter`
 * (domain errors) or the global `ValidationPipe` configuration (DTO
 * validation), so the Swagger documentation always matches what clients
 * receive at runtime.
 */

/** 401 — thrown by `AuthGuard('jwt')` when the JWT token is missing or invalid. */
export const unauthorizedErrorResponse: ApiResponseOptions = {
  description: 'Missing or invalid JWT access token',
  schema: {
    example: {
      statusCode: 401,
      message: 'Unauthorized',
    },
  },
};

/** 403 — thrown by `RolesGuard` when the user lacks the required role. */
export const forbiddenErrorResponse: ApiResponseOptions = {
  description: 'Administrator role is required to access this endpoint',
  schema: {
    example: {
      statusCode: 403,
      message: 'Forbidden',
    },
  },
};

/** 404 — movie ID does not exist (`MovieNotFoundException`). */
export const movieNotFoundErrorResponse: ApiResponseOptions = {
  description: 'Movie with the specified ID was not found',
  schema: {
    example: {
      status: 404,
      error: 'movieNotFound',
      message: 'Movie with ID 999 not found',
    },
  },
};

/** 409 — duplicated title, episode ID or SWAPI URL (`MovieConflictException`). */
export const movieConflictErrorResponse: ApiResponseOptions = {
  description:
    "Business rule violation: a movie with the same title, episodeId or swapiUrl already exists. The `field` indicates which one (one of: 'title', 'episodeId', 'swapiUrl').",
  schema: {
    example: {
      status: 409,
      error: 'movieAlreadyExists',
      message: 'Movie with episodeId 4 already exists',
      field: 'episodeId',
    },
  },
};

/** 400 — domain validation failure (`MovieValidationException`). */
export const movieValidationFailedErrorResponse: ApiResponseOptions = {
  description: 'Movie data violates domain validation rules',
  schema: {
    example: {
      status: 400,
      error: 'movieValidationFailed',
      message: 'Movie data is invalid',
      validationErrors: [
        {
          field: 'releaseDate',
          message: 'releaseDate is required',
          value: undefined,
        },
      ],
    },
  },
};

/** 422 — global `ValidationPipe` rejection of an invalid DTO payload. */
export const validationErrorResponse: ApiResponseOptions = {
  description: 'Request payload failed DTO validation',
  schema: {
    example: {
      status: 422,
      errors: {
        title: 'title should not be empty',
        episodeId: 'episodeId must not be less than 1',
      },
    },
  },
};

/** 503 — SWAPI is unreachable (`SwapiUnavailableException`). */
export const swapiUnavailableErrorResponse: ApiResponseOptions = {
  description: 'The Star Wars API (SWAPI) is currently unavailable',
  schema: {
    example: {
      status: 503,
      error: 'swapiUnavailable',
      message: 'Star Wars API is currently unavailable',
    },
  },
};
