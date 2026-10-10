import { SwapiFilmPropertiesDto } from '../../src/swapi/dto/swapi-film.dto';

/**
 * Builds a SWAPI film (swapi.tech response shape) with sane defaults.
 */
export function buildSwapiFilmProperties(
  overrides: Partial<SwapiFilmPropertiesDto> = {},
): SwapiFilmPropertiesDto {
  return {
    title: 'A New Hope',
    episode_id: 4,
    opening_crawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz, Rick McCallum',
    release_date: '1977-05-25',
    characters: ['https://www.swapi.tech/api/people/1/'],
    planets: ['https://www.swapi.tech/api/planets/1/'],
    starships: ['https://www.swapi.tech/api/starships/2/'],
    vehicles: ['https://www.swapi.tech/api/vehicles/4/'],
    species: ['https://www.swapi.tech/api/species/1/'],
    created: '2014-12-10T14:23:31.880000Z',
    edited: '2014-12-20T19:49:45.256000Z',
    url: 'https://www.swapi.tech/api/films/1/',
    ...overrides,
  };
}

/**
 * Extracts the SWAPI UID from a film URL such as
 * "https://www.swapi.tech/api/films/1/" -> "1".
 */
export function swapiUidFromUrl(url: string): string {
  const segments = url.replace(/\/+$/, '').split('/');

  return segments[segments.length - 1];
}

/**
 * Builds the response of GET /films (list endpoint) exactly like swapi.tech.
 */
export function buildSwapiFilmsListResponse(films: SwapiFilmPropertiesDto[]): {
  message: string;
  total_records: number;
  total_pages: number;
  previous: null;
  next: null;
  results: { uid: string; name: string; url: string }[];
} {
  return {
    message: 'ok',
    total_records: films.length,
    total_pages: 1,
    previous: null,
    next: null,
    results: films.map((film) => ({
      uid: swapiUidFromUrl(film.url),
      name: film.title,
      url: film.url,
    })),
  };
}

/**
 * Builds the response of GET /films/:uid (detail endpoint) exactly like
 * swapi.tech.
 */
export function buildSwapiFilmResponse(film: SwapiFilmPropertiesDto): {
  message: string;
  result: {
    uid: string;
    description: string;
    properties: SwapiFilmPropertiesDto;
  };
} {
  return {
    message: 'ok',
    result: {
      uid: swapiUidFromUrl(film.url),
      description: 'A Star Wars film',
      properties: film,
    },
  };
}
