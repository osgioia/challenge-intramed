import { IsString, IsNumber, IsArray, IsDateString } from 'class-validator';

export class SwapiFilmPropertiesDto {
  @IsString()
  title: string;

  @IsNumber()
  episode_id: number;

  @IsString()
  opening_crawl: string;

  @IsString()
  director: string;

  @IsString()
  producer: string;

  @IsDateString()
  release_date: string;

  @IsArray()
  @IsString({ each: true })
  characters: string[];

  @IsArray()
  @IsString({ each: true })
  planets: string[];

  @IsArray()
  @IsString({ each: true })
  starships: string[];

  @IsArray()
  @IsString({ each: true })
  vehicles: string[];

  @IsArray()
  @IsString({ each: true })
  species: string[];

  @IsDateString()
  created: string;

  @IsDateString()
  edited: string;

  @IsString()
  url: string;
}

export class SwapiFilmDto {
  result: {
    properties: SwapiFilmPropertiesDto;
    description: string;
    _id: string;
    uid: string;
    __v: number;
  };
  message: string;
}

export class SwapiFilmsListDto {
  message: string;
  total_records?: number;
  total_pages?: number;
  previous?: string | null;
  next?: string | null;
  results?: Array<{
    uid: string;
    name: string;
    url: string;
  }>;
  result?: Array<{
    uid: string | number;
    name?: string;
    description?: string;
    properties: SwapiFilmPropertiesDto;
  }>;
}
