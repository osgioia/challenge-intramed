import http from 'node:http';
import type { AddressInfo } from 'node:net';

import {
  buildSwapiFilmsListResponse,
  buildSwapiFilmResponse,
  swapiUidFromUrl,
} from '../fixtures/swapi.fixtures';
import { SwapiFilmPropertiesDto } from '../../src/swapi/dto/swapi-film.dto';

export interface MockSwapiServer {
  baseUrl: string;
  close: () => Promise<void>;
}

/**
 * Starts a lightweight in-process HTTP server that mimics the SWAPI
 * (swapi.tech) endpoints used by SwapiService: GET /films and GET /films/:uid.
 *
 * The e2e suite runs in the same container as the API (see
 * `npm run test:e2e:docker`), where SWAPI_BASE_URL points at this mock.
 */
export async function startMockSwapiServer(options: {
  films: SwapiFilmPropertiesDto[];
  port: number;
}): Promise<MockSwapiServer> {
  const { films, port } = options;

  const server = http.createServer((req, res) => {
    const url = (req.url ?? '').split('?')[0];

    res.setHeader('Content-Type', 'application/json');

    if (url === '/films') {
      res.end(JSON.stringify(buildSwapiFilmsListResponse(films)));

      return;
    }

    const detailMatch = url.match(/^\/films\/([^/]+)$/);

    if (detailMatch) {
      const uid = detailMatch[1];
      const film = films.find((entry) => swapiUidFromUrl(entry.url) === uid);

      if (!film) {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: 'not found' }));

        return;
      }

      res.end(JSON.stringify(buildSwapiFilmResponse(film)));

      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'not found' }));
  });

  await new Promise<void>((resolve) => {
    server.listen(port, '127.0.0.1', resolve);
  });

  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
