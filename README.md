# Star Wars Movies Management API 🌌

REST API built with [NestJS](https://nestjs.com/) to manage a catalog of **Star Wars movies**. It provides full CRUD operations with pagination, search and sorting, JWT authentication with role-based authorization, and one-click synchronization with the public [Star Wars API (SWAPI)](https://swapi.tech/).

Interactive API documentation (Swagger UI): **<http://localhost:3001/docs>**

> Built on top of the [brocoders NestJS boilerplate](https://github.com/brocoders/nestjs-boilerplate) (TypeORM + PostgreSQL). Boilerplate-specific documentation lives in [`/docs`](/docs/readme.md).

## Features

- 🎬 Full CRUD for movies (`GET`, `POST`, `PATCH`, `DELETE`) with strict domain validation
- 🔍 Pagination, full-text search (title/director/producer) and sorting on the movie list
- 🔄 SWAPI synchronization (`POST /movies/sync`): creates missing movies and updates changed ones
- 🔐 JWT authentication (access + refresh tokens) with `admin` and `user` roles
- ⚠️ Consistent error responses with machine-readable `error` codes
- 🧪 294 unit tests + 49 e2e tests (e2e run against Dockerized Postgres with a mocked SWAPI)
- 📖 Full OpenAPI/Swagger documentation with request/response examples
- 🐳 Docker & docker-compose support, database migrations and seeding

## Tech stack

- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS 11
- **Database:** PostgreSQL + TypeORM (hexagonal architecture: repository pattern)
- **Auth:** Passport JWT (`@nestjs/jwt`, `@nestjs/passport`)
- **Validation:** class-validator + global `ValidationPipe`
- **Docs:** `@nestjs/swagger` (OpenAPI 3)
- **Testing:** Jest + Supertest

## Quick start (local development)

```bash
# 1. Copy the environment template and point DB hosts to localhost
cp env-example-relational .env
#    then edit .env: DATABASE_HOST=localhost, MAIL_HOST=maildev

# 2. Start Postgres, Adminer and MailDev
docker compose up -d postgres adminer maildev

# 3. Install dependencies
npm install

# 4. Run migrations and seed the database (admin + demo users)
npm run migration:run
npm run seed:run:relational

# 5. Start the app in watch mode
npm run start:dev
```

The API will be available at <http://localhost:3001> and Swagger UI at <http://localhost:3001/docs>.

### Full Docker run

```bash
cp env-example-relational .env
docker compose up -d
```

### Environment variables

The full template is in [`env-example-relational`](/env-example-relational). The most relevant ones:

| Variable | Description | Default |
| --- | --- | --- |
| `APP_PORT` | HTTP port of the API | `3001` |
| `API_PREFIX` | Global route prefix | `api` |
| `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME` | PostgreSQL connection settings | `postgres` / `5432` / `postgres` |
| `DATABASE_MAX_CONNECTIONS` | DB connection pool size | `100` |
| `AUTH_JWT_SECRET` | Secret used to sign JWT access tokens | — |
| `AUTH_JWT_TOKEN_EXPIRES_IN` | Access token TTL (e.g. `15m`) | — |
| `AUTH_REFRESH_SECRET` / `AUTH_REFRESH_TOKEN_EXPIRES_IN` | Refresh token secret and TTL | — |
| `SWAPI_BASE_URL` | Base URL of the Star Wars API used for synchronization | `https://swapi.tech/api` |
| `SWAPI_REQUEST_TIMEOUT` | Timeout (ms) for outgoing SWAPI requests | `5000` |
| `THROTTLER_TTL` | Rate-limiting window (seconds) | `60` |
| `THROTTLER_LIMIT` | Max requests per window per IP (global; `/movies/sync` is limited to 5/min) | `300` |

> ⚠️ For production, always set strong random values for all `AUTH_*_SECRET` variables (e.g. `openssl rand -hex 32`).
> Best practice: generate **distinct** secrets for `AUTH_JWT_SECRET`, `AUTH_REFRESH_SECRET`,
> `AUTH_FORGOT_SECRET` and `AUTH_CONFIRM_EMAIL_SECRET`.

## Deploy (Vercel + Supabase) — verified production setup

Live production deployment: **<https://challenge-intramed.vercel.app>**
(Swagger UI: `/docs`, raw OpenAPI: `/docs-json`)

### 1. Database (Supabase)

1. Create a Supabase project (PostgreSQL).
2. Enable the **connection pooler** (Supavisor, port `6543`, transaction mode).
3. Copy the pooler connection string:
   `postgresql://<user>.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`
4. **Rotate the database password after sharing it** (Supabase dashboard → Database → reset password).
5. Apply schema + seeds **from your machine** (never `synchronize` in prod):

```bash
DATABASE_URL='<pooler-url>' DATABASE_TYPE=postgres npm run migration:run
DATABASE_URL='<pooler-url>' DATABASE_TYPE=postgres npm run seed:run:relational
```

Seeded users: `admin@example.com` / `john.doe@example.com` (password: `secret`).
Seeded movies: 6 Star Wars films via `POST /api/v1/movies/sync`.

### 2. Vercel environment variables

```bash
vercel link

# Required (production)
vercel env add DATABASE_URL                      # Supabase pooler :6543
vercel env add DATABASE_SSL_ENABLED              # "true"
vercel env add DATABASE_REJECT_UNAUTHORIZED      # "false"
vercel env add DATABASE_MAX_CONNECTIONS          # "5"
vercel env add DATABASE_SYNCHRONIZE              # "false" (migrations run externally)
vercel env add AUTH_JWT_SECRET                   # random 32-byte hex
vercel env add AUTH_REFRESH_SECRET               # random 32-byte hex (≠ JWT)
vercel env add AUTH_JWT_TOKEN_EXPIRES_IN         # e.g. "15m"
vercel env add AUTH_REFRESH_TOKEN_EXPIRES_IN     # e.g. "30d"
vercel env add THROTTLER_TTL                     # "60"
vercel env add THROTTLER_LIMIT                   # "300"

# Optional (have safe defaults; only set to override)
# SWAPI_BASE_URL  (default https://www.swapi.tech/api — DO NOT set a quoted/garbled value)
# MAIL_*          (if unset/incorrect, register & forgot-password still return 204;
#                  emails are logged server-side instead of 500ing — see commit 9f176e2)
```

> ⚠️ `DATABASE_*` vars are consumed via `DATABASE_URL`; `DATABASE_TYPE=postgres` is
> injected automatically by `api/index.ts` on Vercel. `MAIL_*` placeholders are blank-safe.
> Do **not** store a literal `[SENSITIVE]` string in any variable (it breaks URL parsing).

### 3. Deploy

```bash
vercel --prod
```

The build compiles with `npm run build` (`nest build`, 60s timeout on the function).
The serverless entry (`api/index.ts`) boots Nest once per warm instance and reuses it.

### 4. Verify (smoke test)

```bash
BASE=https://challenge-intramed.vercel.app
BYPASS='<deployment-protection-bypass>'   # only needed while Deployment Protection is on

curl -H "x-vercel-protection-bypass: $BYPASS" $BASE/docs-json -o /dev/null -w '%{http_code}\n'  # 200
curl -s -X POST $BASE/api/v1/auth/email/login \
  -H "x-vercel-protection-bypass: $BYPASS" -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"secret"}'
```

All 24 endpoints were verified in production on 2026-10-13 (see § API reference below):
docs, auth (login/me/refresh/register/forgot/confirm/reset/logout/update/delete),
users (CRUD + pagination) and movies (full CRUD, search/sort/pagination, SWAPI sync,
plus 401/403/404/409/422 negative cases).

### Runtime notes & production fixes applied

- i18n loads with `watch: false` in production and an auto-detected nested path
  (`../src/i18n` in the serverless bundle); fixes `vI18nError: i18n path cannot be found`.
- `vercel.json`: `includeFiles: "src/i18n/**"` (string — the CLI rejects arrays).
- Throttler coerces invalid `THROTTLER_*` values to defaults (fixes `Invalid "limit"... got null`).
- SWAPI client supports the current swapi.tech envelope (`result[].properties`);
  sync performs 6 detail fetches and completes in ~0.4 s.
- Transactional emails (register, forgot-password) are best-effort: failures are logged
  and the request still returns `204` (fixes 500s when SMTP is unreachable).

## Authentication and authorization

All `/api/v1/movies*` endpoints require a **JWT access token** in the `Authorization: Bearer <token>` header. Registration and login are the only public endpoints.

Seeded users (from `npm run seed:run:relational`):

| Role | Email | Password |
| --- | --- | --- |
| `admin` | `admin@example.com` | `secret` |
| `user` | `john.doe@example.com` | `secret` |

### Auth endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/email/register` | Register a new user (requires email confirmation flow) |
| `POST` | `/api/v1/auth/email/login` | Login and obtain access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Exchange a refresh token for a new access token |
| `POST` | `/api/v1/auth/logout` | Invalidate the current session |
| `GET` | `/api/v1/auth/me` | Get the authenticated user's profile |

```bash
# Login
curl -s -X POST http://localhost:3001/api/v1/auth/email/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@example.com", "password": "secret"}'
# → { "token": "eyJ...", "refreshToken": "eyJ...", "tokenExpires": 1735689600000, "user": { ... } }
```

### Role matrix for movies

| Endpoint | `user` | `admin` |
| --- | --- | --- |
| `GET /movies`, `GET /movies/:id` | ✅ | ✅ |
| `POST /movies` | ❌ 403 | ✅ |
| `PATCH /movies/:id` | ❌ 403 | ✅ |
| `DELETE /movies/:id` | ❌ 403 | ✅ |
| `POST /movies/sync` | ❌ 403 | ✅ |

## API reference

All endpoints are versioned under `/api/v1`. The table below lists the movies API; the full list (auth, users) is available in Swagger UI.

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/movies` | any | Paginated movie list with optional search and sorting |
| `GET` | `/api/v1/movies/:id` | any | Movie details by ID |
| `POST` | `/api/v1/movies` | admin | Create a movie |
| `PATCH` | `/api/v1/movies/:id` | admin | Partially update a movie |
| `DELETE` | `/api/v1/movies/:id` | admin | Delete a movie |
| `POST` | `/api/v1/movies/sync` | admin | Synchronize movies from SWAPI |

### List query parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | number (≥ 1) | `1` | Page number |
| `limit` | number (1–100) | `10` | Items per page |
| `search` | string | — | Case-insensitive filter on `title`, `director` and `producer` |
| `sortBy` | `title` \| `episodeId` \| `releaseDate` \| `createdAt` | `createdAt` | Sort field |
| `sortOrder` | `ASC` \| `DESC` | `DESC` | Sort order |

### Examples

```bash
BASE=http://localhost:3001/api/v1
TOKEN=$(curl -s -X POST $BASE/auth/email/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"secret"}' | jq -r .token)

# List & search
curl -s "$BASE/movies?page=1&limit=5&search=hope&sortBy=episodeId&sortOrder=ASC" \
  -H "Authorization: Bearer $TOKEN"

# Get one movie
curl -s "$BASE/movies/1" -H "Authorization: Bearer $TOKEN"

# Create (admin only)
curl -s -X POST "$BASE/movies" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "A New Hope",
    "episodeId": 4,
    "openingCrawl": "It is a period of civil war...",
    "director": "George Lucas",
    "producer": "Gary Kurtz, Rick McCallum",
    "releaseDate": "1977-05-25",
    "characters": ["https://swapi.tech/api/people/1/"],
    "planets": ["https://swapi.tech/api/planets/1/"],
    "starships": ["https://swapi.tech/api/starships/2/"],
    "vehicles": ["https://swapi.tech/api/vehicles/4/"],
    "species": ["https://swapi.tech/api/species/1/"],
    "swapiUrl": "https://swapi.tech/api/films/1/"
  }'

# Partial update (admin only) — send only the fields to change
curl -s -X PATCH "$BASE/movies/1" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"producer": "Gary Kurtz"}'

# Delete (admin only)
curl -s -X DELETE "$BASE/movies/1" -H "Authorization: Bearer $TOKEN"

# Synchronize from SWAPI (admin only)
curl -s -X POST "$BASE/movies/sync" -H "Authorization: Bearer $TOKEN"
# → { "success": true, "message": "Synchronization completed successfully. Created: 7, Updated: 0",
#     "stats": { "created": 7, "updated": 0, "failed": 0, "total": 7 },
#     "startedAt": "...", "completedAt": "...", "durationMs": 842 }
```

## Error handling

All error responses follow a consistent shape produced by the global exception filter. Movie-specific errors include a machine-readable `error` code:

| Status | `error` code | When |
| --- | --- | --- |
| `400` | `movieValidationFailed` | Domain validation failure; body includes `validationErrors[]` |
| `401` | — | Missing/invalid JWT token: `{ "statusCode": 401, "message": "Unauthorized" }` |
| `403` | — | Non-admin accessing an admin endpoint: `{ "statusCode": 403, "message": "Forbidden" }` |
| `404` | `movieNotFound` | Movie ID does not exist |
| `409` | `movieAlreadyExists` | Duplicate `title`, `episodeId` or `swapiUrl` (see `field`) |
| `422` | — | DTO validation failed; body includes an `errors` object per field |
| `500` | `internalServerError` | Unexpected error (details are never exposed) |
| `503` | `swapiUnavailable` | SWAPI unreachable during `POST /movies/sync` |

```json
// Example: GET /api/v1/movies/999 → 404
{
  "status": 404,
  "error": "movieNotFound",
  "message": "Movie with ID 999 not found"
}

// Example: POST /api/v1/movies with a duplicated episodeId → 409
{
  "status": 409,
  "error": "movieAlreadyExists",
  "message": "Movie with episodeId 4 already exists",
  "field": "episodeId"
}
```

## Testing

```bash
# Unit tests (services, repositories, DTOs, exceptions)
npm test

# Unit tests with coverage (movies/swapi services target: 90%+)
npx jest --coverage

# E2E tests — full stack in Docker (Postgres + MailDev + mocked SWAPI)
npm run test:e2e:docker
```

The Docker e2e run builds the test image, waits for the API, runs migrations + seeds, executes the whole e2e suite (including SWAPI synchronization tests against an in-process mock of swapi.tech on port `3999`) and tears everything down.

## Troubleshooting

| Symptom | Solution |
| --- | --- |
| `ECONNREFUSED` on `localhost:5432` | Postgres is not running: `docker compose up -d postgres` |
| Migration fails with `function uuid_generate_v4() does not exist` | The `uuid-ossp` extension is missing; pull the latest migrations (it is created by `CreateUser1715028537217`) or run `CREATE EXTENSION "uuid-ossp";` manually in `psql` |
| `401 Unauthorized` on movie endpoints | Send the token as `Authorization: Bearer <token>` (login via `POST /api/v1/auth/email/login`) |
| `403 Forbidden` as admin | Confirm the token belongs to the seeded `admin@example.com` user; tokens carry the role assigned at login time |
| `503 swapiUnavailable` on sync | The app cannot reach `SWAPI_BASE_URL`; check outbound network or point it to a mock server |
| E2E sync tests are skipped | They only run when `SWAPI_BASE_URL=http://localhost:3999` is set (done automatically inside the Docker test environment) |
| Port `3001` already in use | Change `APP_PORT` in `.env` |
| Want a clean database | `npm run schema:drop && npm run migration:run && npm run seed:run:relational` |

## Project structure (movies feature)

```
src/
├── movies/
│   ├── domain/            # Movie entity, domain errors, repository port
│   ├── infrastructure/    # TypeORM entity, migration, relational repository
│   ├── dto/               # Request/response DTOs + Swagger examples
│   ├── exceptions/        # HTTP exceptions (404/409/400)
│   ├── movies.controller.ts
│   ├── movies.service.ts  # Business logic + SWAPI synchronization
│   └── movies.module.ts
├── swapi/                 # SWAPI HTTP client, DTOs, mappers, 503 exception
├── utils/filters/         # Global exception filter
test/
├── movies/                # E2E suite for the movies API
├── fixtures/              # Movie + SWAPI fixtures
└── helpers/               # Auth/login, movies and SWAPI mock helpers
```
## Deployment & serverless — Vercel

### Prerequisites

- GitHub repository **public** (the app uses GitHub Actions; the deploy workflow reads the repo as a public client).
- A [Supabase](https://supabase.com/) project with **PostgreSQL**: enable the connection pooler (port `6543`), set the **service role / anon JWT secret**, and note the `DATABASE_URL`.
- Vercel CLI: `npm i -g vercel`.

### Deploy

```bash
# 1) Link the project to Vercel (interactive; or `vercel link --project <id>`)
vercel link

# 2) Add every variable from env-example-relational (only the non-default ones are needed):
vercel env add APP_CORS_ORIGINS
vercel env add APP_NODE_ENV
vercel env add AUTH_JWT_SECRET
vercel env add AUTH_JWT_TOKEN_EXPIRES_IN
vercel env add AUTH_REFRESH_SECRET
vercel env add AUTH_REFRESH_TOKEN_EXPIRES_IN
vercel env add AUTH_UNIFORM_ERRORS
vercel env add BACKEND_DOMAIN
vercel env add FRONTEND_DOMAIN
vercel env add DATABASE_URL          # Supabase pooler: postgres://<user>:<pwd>@<host>:6543/postgres
vercel env add DATABASE_SYNCHRONIZE=false   # migrations run externally (Supabase dashboard / Docker)
vercel env add DATABASE_SSL_ENABLED=true
vercel env add DATABASE_REJECT_UNAUTHORIZED=false
vercel env add DATABASE_MAX_CONNECTIONS=5
vercel env add SWAPI_BASE_URL
vercel env add SWAPI_REQUEST_TIMEOUT
vercel env add THROTTLER_TTL
vercel env add THROTTLER_LIMIT
vercel env add MAIL_HOST MAIL_USER MAIL_PASSWORD MAIL_PORT MAIL_SECURE MAIL_IGNORE_TLS
vercel env add MAIL_DEFAULT_EMAIL MAIL_DEFAULT_NAME MAIL_CLIENT_PORT
vercel env add AUTH_FORGOT_SECRET AUTH_FORGOT_TOKEN_EXPIRES_IN                   AUTH_CONFIRM_EMAIL_SECRET AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN

# 3) Production build & deploy
vercel --prod
```

### Runtime notes

- `vercel.json` rewrites all traffic to `/api`, `maxDuration 60s`, `1024 MB` memory, `includeFiles: src/i18n/**`.
- `NODE_ENV=production` + `DATABASE_SYNCHRONIZE=false` + `DATABASE_URL` pointing at the Supabase **pooler** (port 6543, transaction mode). Migrations must be applied **before** first deploy.
- `/movies/sync` is capped at `limit: 5 / ttl: 60s` per IP; the API does not rely on memory connections that survive function cold starts.
- Swagger UI is served from the serverless entry at `GET /docs`; the raw OpenAPI spec at `GET /docs-json`. Add the deployed URL to the **Docs** section of the project README ("adjuntar link").
- Optional hardening applied (see commits): `watch: false` for `nestjs-i18n` in production, `bodyParser: false` + `vercel-http`, `tsconfig.build.json` excludes `api/`, `api/index.ts` exports the adapter for local serverless simulation.

---

[brocoders NestJS boilerplate](https://github.com/brocoders/nestjs-boilerplate). See [`/docs`](/docs/readme.md) for boilerplate internals (architecture, auth flows, mailing, i18n, CI).


