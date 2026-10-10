import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiServiceUnavailableResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { MoviesService } from './movies.service';
import { MovieDto } from './dto/movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';
import { PaginatedMoviesDto } from './dto/paginated-movies.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { SyncResultDto } from './dto/sync-result.dto';
import {
  forbiddenErrorResponse,
  movieConflictErrorResponse,
  movieNotFoundErrorResponse,
  movieValidationFailedErrorResponse,
  swapiUnavailableErrorResponse,
  unauthorizedErrorResponse,
  validationErrorResponse,
} from './dto/error-examples';
import { MovieNotFoundError, MovieDomainError } from './domain/types';
import { MovieNotFoundException } from './exceptions/movie-not-found.exception';
import { MovieConflictException } from './exceptions/movie-conflict.exception';
import { MovieValidationException } from './exceptions/movie-validation.exception';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Movies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'movies',
  version: '1',
})
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all movies',
    description:
      'Retrieve a paginated list of all movies. Accessible to authenticated users with any role.',
  })
  @ApiOkResponse({
    type: PaginatedMoviesDto,
    description: 'Paginated list of movies retrieved successfully',
  })
  @ApiUnauthorizedResponse(unauthorizedErrorResponse)
  async findAll(@Query() query: QueryMovieDto): Promise<PaginatedMoviesDto> {
    const paginatedMovies = await this.moviesService.findAll(query);
    return PaginatedMoviesDto.fromDomain(paginatedMovies);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get movie by ID',
    description:
      'Retrieve detailed information about a specific movie by its ID. Accessible to authenticated users with any role.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Unique identifier of the movie',
    example: 1,
  })
  @ApiOkResponse({
    type: MovieDto,
    description: 'Movie details retrieved successfully',
  })
  @ApiNotFoundResponse(movieNotFoundErrorResponse)
  @ApiUnauthorizedResponse(unauthorizedErrorResponse)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MovieDto> {
    try {
      const movie = await this.moviesService.findById(id);
      return MovieDto.fromDomain(movie);
    } catch (error) {
      if (error instanceof MovieNotFoundError) {
        throw new MovieNotFoundException(id);
      }
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleEnum.admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Create new movie (Admin only)',
    description:
      'Create a new movie in the system. Only accessible to administrators.',
  })
  @ApiCreatedResponse({
    type: MovieDto,
    description: 'Movie created successfully',
  })
  @ApiBadRequestResponse(movieValidationFailedErrorResponse)
  @ApiConflictResponse(movieConflictErrorResponse)
  @ApiUnprocessableEntityResponse(validationErrorResponse)
  @ApiUnauthorizedResponse(unauthorizedErrorResponse)
  @ApiForbiddenResponse(forbiddenErrorResponse)
  async create(@Body() createMovieDto: CreateMovieDto): Promise<MovieDto> {
    try {
      const movie = await this.moviesService.create(createMovieDto);
      return MovieDto.fromDomain(movie);
    } catch (error) {
      if (error instanceof MovieDomainError) {
        throw this.translateDomainError(error);
      }
      throw error;
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleEnum.admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Update movie (Admin only)',
    description:
      'Update an existing movie in the system. Only accessible to administrators.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Unique identifier of the movie to update',
    example: 1,
  })
  @ApiOkResponse({
    type: MovieDto,
    description: 'Movie updated successfully',
  })
  @ApiBadRequestResponse(movieValidationFailedErrorResponse)
  @ApiNotFoundResponse(movieNotFoundErrorResponse)
  @ApiConflictResponse(movieConflictErrorResponse)
  @ApiUnprocessableEntityResponse(validationErrorResponse)
  @ApiUnauthorizedResponse(unauthorizedErrorResponse)
  @ApiForbiddenResponse(forbiddenErrorResponse)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<MovieDto> {
    try {
      const movie = await this.moviesService.update(id, updateMovieDto);
      return MovieDto.fromDomain(movie);
    } catch (error) {
      if (error instanceof MovieNotFoundError) {
        throw new MovieNotFoundException(id);
      }
      if (error instanceof MovieDomainError) {
        throw this.translateDomainError(error);
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleEnum.admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Delete movie (Admin only)',
    description:
      'Delete a movie from the system. Only accessible to administrators.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Unique identifier of the movie to delete',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Movie deleted successfully',
  })
  @ApiNotFoundResponse(movieNotFoundErrorResponse)
  @ApiUnauthorizedResponse(unauthorizedErrorResponse)
  @ApiForbiddenResponse(forbiddenErrorResponse)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      await this.moviesService.remove(id);
    } catch (error) {
      if (error instanceof MovieNotFoundError) {
        throw new MovieNotFoundException(id);
      }
      throw error;
    }
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleEnum.admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Synchronize movies with SWAPI (Admin only)',
    description:
      "Synchronize the local movie database with the Star Wars API (SWAPI). This will fetch all movies from SWAPI, create new ones that don't exist locally, and update existing ones. Only accessible to administrators.",
  })
  @ApiOkResponse({
    type: SyncResultDto,
    description: 'Synchronization completed successfully',
  })
  @ApiServiceUnavailableResponse(swapiUnavailableErrorResponse)
  @ApiUnauthorizedResponse(unauthorizedErrorResponse)
  @ApiForbiddenResponse(forbiddenErrorResponse)
  // The synchronization hits SWAPI once per film, so it gets a much stricter
  // rate limit than the global one (5 requests per minute per IP).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async syncWithSwapi(): Promise<SyncResultDto> {
    // SWAPI failures surface as SwapiUnavailableException and are handled
    // by the global exception filter (503 response).
    return this.moviesService.syncWithSwapi();
  }

  /**
   * Maps domain errors to their HTTP counterparts: business rule violations
   * (duplicated movies) become 409 conflicts while data validation failures
   * become 400 bad requests.
   */
  private translateDomainError(error: MovieDomainError): Error {
    if (error.kind === 'conflict') {
      return new MovieConflictException(error.message, error.field);
    }

    return new MovieValidationException(error.message, [
      {
        field: error.field ?? 'unknown',
        message: error.message,
        value: error.value,
      },
    ]);
  }
}
