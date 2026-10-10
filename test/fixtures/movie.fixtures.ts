import { randomUUID } from 'node:crypto';

export interface MovieCreatePayload {
  title: string;
  episodeId: number;
  openingCrawl: string;
  director: string;
  producer: string;
  releaseDate: string;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  swapiUrl?: string;
}

export interface MovieResponse extends MovieCreatePayload {
  id: number | string;
  createdAt: string;
  updatedAt: string;
}

// Sequential counter so episode IDs never collide across tests in one run.
let episodeIdSequence = 10000;

function nextEpisodeId(): number {
  episodeIdSequence += 1;

  return episodeIdSequence;
}

/**
 * Builds a valid create payload. Title, episode ID and SWAPI URL are unique
 * per call, so tests never collide with movies created by other tests.
 */
export function buildCreateMoviePayload(
  overrides: Partial<MovieCreatePayload> = {},
): MovieCreatePayload {
  const unique = randomUUID();

  return {
    title: `Test Movie ${unique}`,
    episodeId: nextEpisodeId(),
    openingCrawl: 'A long time ago in a galaxy far, far away...',
    director: 'Test Director',
    producer: 'Test Producer',
    releaseDate: '1977-05-25',
    characters: ['https://swapi.dev/api/people/1/'],
    planets: ['https://swapi.dev/api/planets/1/'],
    starships: ['https://swapi.dev/api/starships/2/'],
    vehicles: ['https://swapi.dev/api/vehicles/4/'],
    species: ['https://swapi.dev/api/species/1/'],
    swapiUrl: `https://swapi.dev/api/films/e2e-${unique}/`,
    ...overrides,
  };
}

/**
 * Builds a valid partial update payload with a fresh unique title so update
 * tests never trip the duplicated-title business rule unintentionally.
 */
export function buildUpdateMoviePayload(
  overrides: Partial<MovieCreatePayload> = {},
): Partial<MovieCreatePayload> {
  return {
    title: `Updated Test Movie ${randomUUID()}`,
    director: 'Updated Test Director',
    ...overrides,
  };
}
