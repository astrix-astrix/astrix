# Astrix TS

Monorepo boilerplate for Astrix:

- `api/`: Fastify API with Knex, Postgres, Redis, and unit/integration/e2e tests.
- `sdk/`: publishable TypeScript SDK for npm.
- `app/`: SvelteKit app with Vitest and Playwright tests.

## Requirements

- Node.js 24.17.0 LTS
- npm
- Docker and Docker Compose

## Setup

```sh
cp .env.example .env
npm install
```

Update `.env` for your local credentials. Compose reads database and cache values from `.env`; secrets are not hardcoded into `docker-compose.yml`.

## Development

Start the gateway, Postgres, Redis, API, SDK watcher, and admin app:

```sh
npm run dev
```

`npm run dev` first removes stale containers from this Compose project, then
recreates the local stack. Named PostgreSQL and Redis volumes are preserved.

The local gateway exposes the same single origin as production:

- `http://127.0.0.1:8333/*` routes to the API.
- `http://127.0.0.1:8333/admin/*` routes to the SvelteKit admin app.

In production, one Astrix process serves both the API and the compiled admin SPA.
Local development keeps separate watcher containers behind Caddy for HMR.
PostgreSQL and Redis remain internal in production; the local stack publishes
them for host-run migrations and tests.

Run package dev servers without Compose:

```sh
npm run dev:api
npm run dev:app
```

## Tests

```sh
npm run test:unit
npm run test:integration
npm run test:e2e
```

Integration and e2e commands start the required Compose services first.

## Build and Quality

```sh
npm run build
npm run lint
npm run format:check
```

## Docker Image

Build the single production image locally:

```sh
npm run docker:build
```

Run that image with PostgreSQL and Redis:

```sh
npm run docker:up
```

For a locally built image, `npm run docker:up` performs the same stale-container
cleanup before starting the production stack.

To tag an image for a registry, set `ASTRIX_IMAGE` before building:

```sh
ASTRIX_IMAGE=ghcr.io/your-org/astrix:0.1.0 npm run docker:build
docker push ghcr.io/your-org/astrix:0.1.0
```

Consumers only need `docker-compose.yml`, an environment file, and the published
image. The production container exposes the API and `/admin` on port `8333`.

### Runtime configuration

The image is configured when the container starts. It does not contain database,
cache, origin, or logging configuration. The application accepts:

| Variable        | Required | Default                 | Purpose                                               |
| --------------- | -------- | ----------------------- | ----------------------------------------------------- |
| `DATABASE_URL`  | yes      | —                       | PostgreSQL connection URL                             |
| `REDIS_URL`     | yes      | —                       | Redis connection URL                                  |
| `CORS_ORIGIN`   | no       | `http://127.0.0.1:8333` | Allowed browser origin                                |
| `API_LOG_LEVEL` | no       | `info`                  | Fastify log level                                     |
| `API_HOST`      | no       | `0.0.0.0`               | Container listen address                              |
| `API_PORT`      | no       | `3000`                  | Container listen port; production Compose sets `8333` |

These are server-side variables. Secrets are never included in the compiled admin
application. Compose supplies PostgreSQL and Redis URLs for its bundled services;
other platforms can inject URLs for managed services directly into the container.

### Traefik

The core production Compose file does not publish a host port. For local production
testing, `npm run docker:up` adds `docker-compose.publish.yml` and publishes port
`8333`.

For a host with an existing Traefik Docker network, configure `.env`:

```dotenv
ASTRIX_IMAGE=ghcr.io/your-org/astrix:0.1.0
ASTRIX_HOST=astrix.example.com
TRAEFIK_NETWORK=traefik
TRAEFIK_ENTRYPOINT=websecure
TRAEFIK_CERT_RESOLVER=letsencrypt
CORS_ORIGIN=https://astrix.example.com
```

Then deploy without publishing the application port:

```sh
docker compose --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.traefik.yml \
  up -d
```

The external network named by `TRAEFIK_NETWORK` must already exist and Traefik
must be attached to it. The overlay routes the configured hostname to Astrix's
internal port `8333`; TLS certificates remain Traefik's responsibility.

## Database

```sh
npm --workspace @astrix/api run db:migrate
npm --workspace @astrix/api run db:rollback
```

## Releases

Changesets are configured for package versioning:

```sh
npm run changeset
npm run version
```

Releases are created manually on GitHub. After committing the version changes, create and push a `vX.Y.Z` tag for the
SDK version, then create the matching GitHub Release using the generated changelog entry as its description. Astrix
packages are not published to npm or another package registry.

Add a prominent compatibility notice to a changeset with:

```md
::: notice
Existing clients must update their configuration before upgrading.
:::

Changed the SDK configuration format.
```

Commit messages can be checked with:

```sh
npm run commitlint
```
