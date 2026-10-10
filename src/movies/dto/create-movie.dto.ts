import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  IsArray,
  IsUrl,
  IsOptional,
  IsDateString,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({
    example: 'A New Hope',
    description: 'The title of the Star Wars movie',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({
    example: 4,
    description: 'The episode number in the Star Wars saga',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  episodeId: number;

  @ApiProperty({
    example:
      'It is a period of civil war.\r\nRebel spaceships, striking\r\nfrom a hidden base, have won\r\ntheir first victory against\r\nthe evil Galactic Empire.',
    description:
      'The opening crawl text displayed at the beginning of the movie',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  openingCrawl: string;

  @ApiProperty({
    example: 'George Lucas',
    description: 'The director of the movie',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  director: string;

  @ApiProperty({
    example: 'Gary Kurtz, Rick McCallum',
    description: 'The producer(s) of the movie',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  producer: string;

  @ApiProperty({
    example: '1977-05-25',
    description: 'The release date of the movie in ISO format',
    type: String,
  })
  @IsDateString()
  releaseDate: string;

  @ApiProperty({
    example: [
      'https://swapi.dev/api/people/1/',
      'https://swapi.dev/api/people/2/',
      'https://swapi.dev/api/people/3/',
    ],
    description: 'Array of character URLs from SWAPI',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  characters: string[];

  @ApiProperty({
    example: [
      'https://swapi.dev/api/planets/1/',
      'https://swapi.dev/api/planets/2/',
    ],
    description: 'Array of planet URLs from SWAPI',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  planets: string[];

  @ApiProperty({
    example: [
      'https://swapi.dev/api/starships/2/',
      'https://swapi.dev/api/starships/3/',
    ],
    description: 'Array of starship URLs from SWAPI',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  starships: string[];

  @ApiProperty({
    example: [
      'https://swapi.dev/api/vehicles/4/',
      'https://swapi.dev/api/vehicles/6/',
    ],
    description: 'Array of vehicle URLs from SWAPI',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  vehicles: string[];

  @ApiProperty({
    example: [
      'https://swapi.dev/api/species/1/',
      'https://swapi.dev/api/species/2/',
    ],
    description: 'Array of species URLs from SWAPI',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  species: string[];

  @ApiPropertyOptional({
    example: 'https://swapi.dev/api/films/1/',
    description: 'The SWAPI URL for this movie',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  swapiUrl?: string;
}
