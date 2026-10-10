import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Movie } from '../domain/movie';

export class MovieDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the movie',
  })
  @Expose()
  id: number | string;

  @ApiProperty({
    example: 'A New Hope',
    description: 'Title of the movie',
  })
  @Expose()
  title: string;

  @ApiProperty({
    example: 4,
    description: 'Episode number in the Star Wars saga',
  })
  @Expose()
  episodeId: number;

  @ApiProperty({
    example:
      'It is a period of civil war.\r\nRebel spaceships, striking\r\nfrom a hidden base, have won\r\ntheir first victory against\r\nthe evil Galactic Empire.',
    description:
      'Opening crawl text that appears at the beginning of the movie',
  })
  @Expose()
  openingCrawl: string;

  @ApiProperty({
    example: 'George Lucas',
    description: 'Director of the movie',
  })
  @Expose()
  director: string;

  @ApiProperty({
    example: 'Gary Kurtz, Rick McCallum',
    description: 'Producer(s) of the movie',
  })
  @Expose()
  producer: string;

  @ApiProperty({
    example: '1977-05-25T00:00:00.000Z',
    description: 'Release date of the movie',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  releaseDate: string;

  @ApiProperty({
    example: [
      'https://www.swapi.tech/api/people/1/',
      'https://www.swapi.tech/api/people/2/',
    ],
    description: 'Array of character URLs from SWAPI',
    type: [String],
  })
  @Expose()
  characters: string[];

  @ApiProperty({
    example: [
      'https://www.swapi.tech/api/planets/1/',
      'https://www.swapi.tech/api/planets/2/',
    ],
    description: 'Array of planet URLs from SWAPI',
    type: [String],
  })
  @Expose()
  planets: string[];

  @ApiProperty({
    example: [
      'https://www.swapi.tech/api/starships/2/',
      'https://www.swapi.tech/api/starships/3/',
    ],
    description: 'Array of starship URLs from SWAPI',
    type: [String],
  })
  @Expose()
  starships: string[];

  @ApiProperty({
    example: [
      'https://www.swapi.tech/api/vehicles/4/',
      'https://www.swapi.tech/api/vehicles/6/',
    ],
    description: 'Array of vehicle URLs from SWAPI',
    type: [String],
  })
  @Expose()
  vehicles: string[];

  @ApiProperty({
    example: [
      'https://www.swapi.tech/api/species/1/',
      'https://www.swapi.tech/api/species/2/',
    ],
    description: 'Array of species URLs from SWAPI',
    type: [String],
  })
  @Expose()
  species: string[];

  @ApiPropertyOptional({
    example: 'https://www.swapi.tech/api/films/1/',
    description: 'Original SWAPI URL for this movie',
  })
  @Expose()
  swapiUrl?: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Timestamp when the movie record was created',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  createdAt: string;

  @ApiProperty({
    example: '2023-01-01T12:00:00.000Z',
    description: 'Timestamp when the movie record was last updated',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  updatedAt: string;

  constructor(movie: Partial<Movie>) {
    if (movie.id !== undefined) this.id = movie.id;
    if (movie.title !== undefined) this.title = movie.title;
    if (movie.episodeId !== undefined) this.episodeId = movie.episodeId;
    if (movie.openingCrawl !== undefined)
      this.openingCrawl = movie.openingCrawl;
    if (movie.director !== undefined) this.director = movie.director;
    if (movie.producer !== undefined) this.producer = movie.producer;
    if (movie.releaseDate !== undefined) {
      this.releaseDate =
        movie.releaseDate instanceof Date
          ? movie.releaseDate.toISOString()
          : String(movie.releaseDate);
    }
    if (movie.characters !== undefined) this.characters = [...movie.characters];
    if (movie.planets !== undefined) this.planets = [...movie.planets];
    if (movie.starships !== undefined) this.starships = [...movie.starships];
    if (movie.vehicles !== undefined) this.vehicles = [...movie.vehicles];
    if (movie.species !== undefined) this.species = [...movie.species];
    if (movie.swapiUrl !== undefined) this.swapiUrl = movie.swapiUrl;
    if (movie.createdAt !== undefined) {
      this.createdAt =
        movie.createdAt instanceof Date
          ? movie.createdAt.toISOString()
          : String(movie.createdAt);
    }
    if (movie.updatedAt !== undefined) {
      this.updatedAt =
        movie.updatedAt instanceof Date
          ? movie.updatedAt.toISOString()
          : String(movie.updatedAt);
    }
  }

  static fromDomain(movie: Movie): MovieDto {
    return new MovieDto({
      id: movie.id,
      title: movie.title,
      episodeId: movie.episodeId,
      openingCrawl: movie.openingCrawl,
      director: movie.director,
      producer: movie.producer,
      releaseDate: movie.releaseDate,
      characters: movie.characters,
      planets: movie.planets,
      starships: movie.starships,
      vehicles: movie.vehicles,
      species: movie.species,
      swapiUrl: movie.swapiUrl,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    });
  }
}
