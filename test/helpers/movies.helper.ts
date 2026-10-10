import request from 'supertest';

import { APP_URL } from '../utils/constants';
import {
  MovieCreatePayload,
  MovieResponse,
  buildCreateMoviePayload,
} from '../fixtures/movie.fixtures';

const MOVIES_ENDPOINT = '/api/v1/movies';

/**
 * Creates a movie through the API and returns the stored movie.
 */
export async function createMovie(
  adminToken: string,
  overrides: Partial<MovieCreatePayload> = {},
): Promise<MovieResponse> {
  const payload = buildCreateMoviePayload(overrides);

  const response = await request(APP_URL)
    .post(MOVIES_ENDPOINT)
    .auth(adminToken, { type: 'bearer' })
    .send(payload);

  if (response.status !== 201) {
    throw new Error(
      `Movie creation failed: HTTP ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  return response.body as MovieResponse;
}

/**
 * Fetches a single page of movies using the admin session.
 */
export async function getMoviesPage(
  adminToken: string,
  page = 1,
  limit = 100,
): Promise<{ data: MovieResponse[]; total: number }> {
  const response = await request(APP_URL)
    .get(`${MOVIES_ENDPOINT}?page=${page}&limit=${limit}`)
    .auth(adminToken, { type: 'bearer' });

  if (response.status !== 200) {
    throw new Error(
      `Movie listing failed: HTTP ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  return response.body;
}

/**
 * Test teardown utility: removes every movie through the public API so the
 * database is left clean between e2e runs.
 */
export async function deleteAllMovies(adminToken: string): Promise<number> {
  let deleted = 0;

  // Each iteration deletes the current first page; guard against loops.
  for (let attempt = 0; attempt < 50; attempt++) {
    const { data } = await getMoviesPage(adminToken, 1, 100);

    if (data.length === 0) {
      break;
    }

    for (const movie of data) {
      const response = await request(APP_URL)
        .delete(`${MOVIES_ENDPOINT}/${movie.id}`)
        .auth(adminToken, { type: 'bearer' });

      if (response.status !== 204 && response.status !== 404) {
        throw new Error(
          `Movie deletion failed for ID ${movie.id}: HTTP ${response.status} ${JSON.stringify(response.body)}`,
        );
      }

      deleted++;
    }
  }

  return deleted;
}
