import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

import { APP_URL } from '../utils/constants';
import {
  AuthSession,
  loginAsAdmin,
  registerAndLoginAsUser,
} from '../helpers/auth.helper';
import {
  buildCreateMoviePayload,
  buildUpdateMoviePayload,
} from '../fixtures/movie.fixtures';
import { buildSwapiFilmProperties } from '../fixtures/swapi.fixtures';
import {
  createMovie,
  deleteAllMovies,
  getMoviesPage,
} from '../helpers/movies.helper';
import {
  MockSwapiServer,
  startMockSwapiServer,
} from '../helpers/swapi-mock.helper';

const MOVIES_ENDPOINT = '/api/v1/movies';
const MISSING_MOVIE_ID = 999999;

// The docker test environment (docker-compose.relational.test.yaml) points
// SWAPI_BASE_URL at an in-process mock server started by this suite. Outside
// that environment the synchronization tests are skipped.
const SWAPI_MOCK_BASE_URL = 'http://localhost:3999';
const SWAPI_MOCK_PORT = 3999;
const isMockSwapiConfigured =
  process.env.SWAPI_BASE_URL === SWAPI_MOCK_BASE_URL;
const syncIt = isMockSwapiConfigured ? it : it.skip;

describe('Movies API', () => {
  let adminSession: AuthSession;
  let userSession: AuthSession;
  let mockSwapi: MockSwapiServer | undefined;

  // Unique mocked films per run so synchronization never matches movies
  // persisted by a previous run of this suite.
  const runSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const runEpisodeBase = 100000 + Math.floor(Math.random() * 1000000);
  const syncFilmOne = buildSwapiFilmProperties({
    title: `E2E Sync Hope ${runSuffix}`,
    episode_id: runEpisodeBase + 1,
    url: `https://www.swapi.tech/api/films/e2e-${runSuffix}-1/`,
  });
  const syncFilmTwo = buildSwapiFilmProperties({
    title: `E2E Sync Empire ${runSuffix}`,
    episode_id: runEpisodeBase + 2,
    director: 'Irvin Kershner',
    url: `https://www.swapi.tech/api/films/e2e-${runSuffix}-2/`,
  });

  beforeAll(async () => {
    adminSession = await loginAsAdmin();
    userSession = await registerAndLoginAsUser('movies-e2e');

    if (isMockSwapiConfigured) {
      mockSwapi = await startMockSwapiServer({
        films: [syncFilmOne, syncFilmTwo],
        port: SWAPI_MOCK_PORT,
      });
    }
  });

  afterAll(async () => {
    if (adminSession) {
      await deleteAllMovies(adminSession.token);
    }

    if (mockSwapi) {
      await mockSwapi.close();
    }
  });

  describe('Authentication requirements', () => {
    it('should reject listing movies without a token', () =>
      request(APP_URL).get(MOVIES_ENDPOINT).expect(401));

    it('should reject retrieving a movie without a token', () =>
      request(APP_URL).get(`${MOVIES_ENDPOINT}/1`).expect(401));

    it('should reject creating a movie without a token', () =>
      request(APP_URL)
        .post(MOVIES_ENDPOINT)
        .send(buildCreateMoviePayload())
        .expect(401));

    it('should reject updating a movie without a token', () =>
      request(APP_URL)
        .patch(`${MOVIES_ENDPOINT}/1`)
        .send(buildUpdateMoviePayload())
        .expect(401));

    it('should reject deleting a movie without a token', () =>
      request(APP_URL).delete(`${MOVIES_ENDPOINT}/1`).expect(401));

    it('should reject SWAPI synchronization without a token', () =>
      request(APP_URL).post(`${MOVIES_ENDPOINT}/sync`).expect(401));
  });

  describe('Role-based authorization', () => {
    let movieId: number | string;

    beforeAll(async () => {
      const createdMovie = await createMovie(adminSession.token);
      movieId = createdMovie.id;
    });

    it('should allow regular users to list movies', () =>
      request(APP_URL)
        .get(MOVIES_ENDPOINT)
        .auth(userSession.token, { type: 'bearer' })
        .expect(200));

    it('should allow regular users to retrieve a movie by ID', () =>
      request(APP_URL)
        .get(`${MOVIES_ENDPOINT}/${movieId}`)
        .auth(userSession.token, { type: 'bearer' })
        .expect(200));

    it('should forbid regular users from creating movies', () =>
      request(APP_URL)
        .post(MOVIES_ENDPOINT)
        .auth(userSession.token, { type: 'bearer' })
        .send(buildCreateMoviePayload())
        .expect(403));

    it('should forbid regular users from updating movies', () =>
      request(APP_URL)
        .patch(`${MOVIES_ENDPOINT}/${movieId}`)
        .auth(userSession.token, { type: 'bearer' })
        .send(buildUpdateMoviePayload())
        .expect(403));

    it('should forbid regular users from deleting movies', () =>
      request(APP_URL)
        .delete(`${MOVIES_ENDPOINT}/${movieId}`)
        .auth(userSession.token, { type: 'bearer' })
        .expect(403));

    it('should forbid regular users from synchronizing with SWAPI', () =>
      request(APP_URL)
        .post(`${MOVIES_ENDPOINT}/sync`)
        .auth(userSession.token, { type: 'bearer' })
        .expect(403));
  });

  describe('Movie management by an administrator', () => {
    it('should create a new movie and return its data', async () => {
      const payload = buildCreateMoviePayload();

      const response = await request(APP_URL)
        .post(MOVIES_ENDPOINT)
        .auth(adminSession.token, { type: 'bearer' })
        .send(payload)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe(payload.title);
      expect(response.body.episodeId).toBe(payload.episodeId);
      expect(response.body.director).toBe(payload.director);
      expect(response.body.swapiUrl).toBe(payload.swapiUrl);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should retrieve the created movie by ID', async () => {
      const createdMovie = await createMovie(adminSession.token);

      const response = await request(APP_URL)
        .get(`${MOVIES_ENDPOINT}/${createdMovie.id}`)
        .auth(adminSession.token, { type: 'bearer' })
        .expect(200);

      expect(response.body.id).toBe(createdMovie.id);
      expect(response.body.title).toBe(createdMovie.title);
      expect(response.body.characters).toEqual(createdMovie.characters);
      expect(response.body.releaseDate).toBeDefined();
    });

    it('should list movies with pagination metadata', async () => {
      const response = await request(APP_URL)
        .get(`${MOVIES_ENDPOINT}?page=1&limit=5`)
        .auth(adminSession.token, { type: 'bearer' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body).toMatchObject({
        page: 1,
        limit: 5,
      });
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.totalPages).toBe('number');
      expect(typeof response.body.hasNextPage).toBe('boolean');
      expect(typeof response.body.hasPreviousPage).toBe('boolean');
    });

    it('should filter movies by search term', async () => {
      const createdMovie = await createMovie(adminSession.token);

      const response = await request(APP_URL)
        .get(
          `${MOVIES_ENDPOINT}?search=${encodeURIComponent(createdMovie.title)}`,
        )
        .auth(adminSession.token, { type: 'bearer' })
        .expect(200);

      const foundIds = response.body.data.map(
        (movie: { id: number | string }) => movie.id,
      );
      expect(foundIds).toContain(createdMovie.id);
    });

    it('should update an existing movie', async () => {
      const createdMovie = await createMovie(adminSession.token);
      const updatePayload = buildUpdateMoviePayload();

      const response = await request(APP_URL)
        .patch(`${MOVIES_ENDPOINT}/${createdMovie.id}`)
        .auth(adminSession.token, { type: 'bearer' })
        .send(updatePayload)
        .expect(200);

      expect(response.body.id).toBe(createdMovie.id);
      expect(response.body.title).toBe(updatePayload.title);
      expect(response.body.director).toBe(updatePayload.director);
    });

    it('should delete a movie and return no content', async () => {
      const createdMovie = await createMovie(adminSession.token);

      await request(APP_URL)
        .delete(`${MOVIES_ENDPOINT}/${createdMovie.id}`)
        .auth(adminSession.token, { type: 'bearer' })
        .expect(204);

      await request(APP_URL)
        .get(`${MOVIES_ENDPOINT}/${createdMovie.id}`)
        .auth(adminSession.token, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should return 404 when retrieving a missing movie', () =>
      request(APP_URL)
        .get(`${MOVIES_ENDPOINT}/${MISSING_MOVIE_ID}`)
        .auth(adminSession.token, { type: 'bearer' })
        .expect(404)
        .expect(({ body }) => {
          expect(body.error).toBe('movieNotFound');
          expect(body.message).toContain(`${MISSING_MOVIE_ID}`);
        }));

    it('should return 404 when updating a missing movie', () =>
      request(APP_URL)
        .patch(`${MOVIES_ENDPOINT}/${MISSING_MOVIE_ID}`)
        .auth(adminSession.token, { type: 'bearer' })
        .send(buildUpdateMoviePayload())
        .expect(404));

    it('should return 404 when deleting a missing movie', () =>
      request(APP_URL)
        .delete(`${MOVIES_ENDPOINT}/${MISSING_MOVIE_ID}`)
        .auth(adminSession.token, { type: 'bearer' })
        .expect(404));

    it('should return 409 when creating a movie with a duplicated title', async () => {
      const createdMovie = await createMovie(adminSession.token);

      await request(APP_URL)
        .post(MOVIES_ENDPOINT)
        .auth(adminSession.token, { type: 'bearer' })
        .send(
          buildCreateMoviePayload({
            title: createdMovie.title,
            episodeId: createdMovie.episodeId + 1000,
            swapiUrl: `${createdMovie.swapiUrl}-copy/`,
          }),
        )
        .expect(409)
        .expect(({ body }) => {
          expect(body.error).toBe('movieAlreadyExists');
          expect(body.field).toBe('title');
        });
    });

    it('should return 409 when creating a movie with a duplicated episode ID', async () => {
      const createdMovie = await createMovie(adminSession.token);

      await request(APP_URL)
        .post(MOVIES_ENDPOINT)
        .auth(adminSession.token, { type: 'bearer' })
        .send(
          buildCreateMoviePayload({
            episodeId: createdMovie.episodeId,
            swapiUrl: `${createdMovie.swapiUrl}-copy/`,
          }),
        )
        .expect(409)
        .expect(({ body }) => {
          expect(body.error).toBe('movieAlreadyExists');
          expect(body.field).toBe('episodeId');
        });
    });

    it('should return 409 when creating a movie with a duplicated SWAPI URL', async () => {
      const createdMovie = await createMovie(adminSession.token);

      await request(APP_URL)
        .post(MOVIES_ENDPOINT)
        .auth(adminSession.token, { type: 'bearer' })
        .send(
          buildCreateMoviePayload({
            swapiUrl: createdMovie.swapiUrl,
          }),
        )
        .expect(409)
        .expect(({ body }) => {
          expect(body.error).toBe('movieAlreadyExists');
          expect(body.field).toBe('swapiUrl');
        });
    });

    it('should return 422 when creating a movie with an invalid payload', () =>
      request(APP_URL)
        .post(MOVIES_ENDPOINT)
        .auth(adminSession.token, { type: 'bearer' })
        .send({ title: '', episodeId: 0 })
        .expect(422));

    it('should return 400 when the movie ID is not a number', () =>
      request(APP_URL)
        .get(`${MOVIES_ENDPOINT}/not-a-number`)
        .auth(adminSession.token, { type: 'bearer' })
        .expect(400));

    it('should return 422 when pagination parameters are invalid', () =>
      request(APP_URL)
        .get(`${MOVIES_ENDPOINT}?page=0`)
        .auth(adminSession.token, { type: 'bearer' })
        .expect(422));
  });

  describe('SWAPI synchronization with a mocked external API', () => {
    syncIt(
      'should synchronize movies created from the mocked SWAPI',
      async () => {
        const response = await request(APP_URL)
          .post(`${MOVIES_ENDPOINT}/sync`)
          .auth(adminSession.token, { type: 'bearer' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.stats.total).toBe(2);
        expect(response.body.stats.created).toBe(2);
        expect(response.body.stats.updated).toBe(0);
        expect(response.body.stats.failed).toBe(0);

        const { data } = await getMoviesPage(adminSession.token);
        const titles = data.map((movie) => movie.title);
        expect(titles).toContain(syncFilmOne.title);
        expect(titles).toContain(syncFilmTwo.title);
      },
    );

    syncIt(
      'should update already synchronized movies on subsequent runs',
      async () => {
        const response = await request(APP_URL)
          .post(`${MOVIES_ENDPOINT}/sync`)
          .auth(adminSession.token, { type: 'bearer' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.stats.total).toBe(2);
        expect(response.body.stats.created).toBe(0);
        expect(response.body.stats.updated).toBe(2);
        expect(response.body.stats.failed).toBe(0);
      },
    );
  });
});
