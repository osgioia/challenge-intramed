import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MovieDto } from './movie.dto';
import { PaginatedMovies } from '../domain/movie';

export class PaginatedMoviesDto {
  @ApiProperty({
    description: 'Array of movies for the current page',
    type: [MovieDto],
  })
  @Expose()
  @Type(() => MovieDto)
  data: MovieDto[];

  @ApiProperty({
    example: 100,
    description: 'Total number of movies in the database',
  })
  @Expose()
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  @Expose()
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
  })
  @Expose()
  limit: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of pages available',
  })
  @Expose()
  totalPages: number;

  @ApiProperty({
    example: true,
    description: 'Whether there is a next page available',
  })
  @Expose()
  hasNextPage: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether there is a previous page available',
  })
  @Expose()
  hasPreviousPage: boolean;

  constructor(data: Partial<PaginatedMoviesDto>) {
    if (data.data !== undefined) {
      this.data = data.data.map((movie) =>
        movie instanceof MovieDto ? movie : new MovieDto(movie),
      );
    }
    if (data.total !== undefined) this.total = data.total;
    if (data.page !== undefined) this.page = data.page;
    if (data.limit !== undefined) this.limit = data.limit;
    if (data.totalPages !== undefined) this.totalPages = data.totalPages;
    if (data.hasNextPage !== undefined) this.hasNextPage = data.hasNextPage;
    if (data.hasPreviousPage !== undefined)
      this.hasPreviousPage = data.hasPreviousPage;
  }

  static fromDomain(paginatedMovies: PaginatedMovies): PaginatedMoviesDto {
    return new PaginatedMoviesDto({
      data: paginatedMovies.data.map((movie) => MovieDto.fromDomain(movie)),
      total: paginatedMovies.total,
      page: paginatedMovies.page,
      limit: paginatedMovies.limit,
      totalPages: paginatedMovies.totalPages,
      hasNextPage: paginatedMovies.hasNextPage,
      hasPreviousPage: paginatedMovies.hasPreviousPage,
    });
  }
}
