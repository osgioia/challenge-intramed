import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
import { CreateMovieDto } from './create-movie.dto';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  @ApiPropertyOptional({
    example: 'A New Hope',
    description: 'The title of the Star Wars movie',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiPropertyOptional({
    example: 4,
    description: 'The episode number in the Star Wars saga',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  episodeId?: number;

  @ApiPropertyOptional({
    example:
      'It is a period of civil war.\r\nRebel spaceships, striking\r\nfrom a hidden base, have won\r\ntheir first victory against\r\nthe evil Galactic Empire.',
    description:
      'The opening crawl text displayed at the beginning of the movie',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  openingCrawl?: string;

  @ApiPropertyOptional({
    example: 'George Lucas',
    description: 'The director of the movie',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  director?: string;

  @ApiPropertyOptional({
    example: 'Gary Kurtz, Rick McCallum',
    description: 'The producer(s) of the movie',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  producer?: string;

  @ApiPropertyOptional({
    example: '1977-05-25',
    description: 'The release date of the movie in ISO format',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional({
    example: [
      'https://swapi.dev/api/people/1/',
      'https://swapi.dev/api/people/2/',
      'https://swapi.dev/api/people/3/',
    ],
    description: 'Array of character URLs from SWAPI',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  characters?: string[];

  @ApiPropertyOptional({
    example: [
      'https://swapi.dev/api/planets/1/',
      'https://swapi.dev/api/planets/2/',
    ],
    description: 'Array of planet URLs from SWAPI',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  planets?: string[];

  @ApiPropertyOptional({
    example: [
      'https://swapi.dev/api/starships/2/',
      'https://swapi.dev/api/starships/3/',
    ],
    description: 'Array of starship URLs from SWAPI',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  starships?: string[];

  @ApiPropertyOptional({
    example: [
      'https://swapi.dev/api/vehicles/4/',
      'https://swapi.dev/api/vehicles/6/',
    ],
    description: 'Array of vehicle URLs from SWAPI',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  vehicles?: string[];

  @ApiPropertyOptional({
    example: [
      'https://swapi.dev/api/species/1/',
      'https://swapi.dev/api/species/2/',
    ],
    description: 'Array of species URLs from SWAPI',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  species?: string[];

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
