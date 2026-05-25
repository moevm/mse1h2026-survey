# GitHub Actions

This repository uses `.github/workflows/ci.yml` as the main quality gate for pull requests and pushes to `main`.

## What CI Checks

The workflow is split into independent jobs so failures show the broken area quickly:

- `Repository hygiene`
  - validates `docker-compose.yaml`;
  - creates CI-only env files from `env/*.example`;
  - rejects unresolved merge conflict markers;
  - rejects generated frontend/report artifacts.
- `Backend migrations`
  - installs backend dependencies;
  - verifies that Alembic has exactly one head revision;
  - applies all migrations to a fresh PostgreSQL database.
- `Backend tests and coverage`
  - compiles backend modules;
  - runs pytest against PostgreSQL;
  - writes JUnit and coverage XML reports;
  - enforces minimum backend coverage.
- `Frontend lint, tests and build`
  - installs frontend dependencies with `npm ci`;
  - runs ESLint;
  - runs frontend unit tests;
  - builds the production bundle.
- `Docker build`
  - builds all compose images after backend and frontend checks pass.

## Required Local Checks

Before opening or updating a PR, run the same core checks locally:

```bash
python -m pytest backend -q
cd frontend
npm run lint
npm test
npm run build
```

If Docker is available, also run:

```bash
docker compose -f docker-compose.yaml config --quiet
docker compose -f docker-compose.yaml build
```

## Env Files In CI

Real env files are intentionally not committed. CI creates these files from examples before compose validation and docker builds:

- `env/pgsql.env`
- `env/pgsql_test.env`
- `env/pgadmin.env`

Keep the corresponding `.example` files up to date when compose variables change.

## Coverage

Backend coverage is generated as `backend/coverage.xml` and uploaded as the `backend-coverage` artifact. Test results are uploaded as `backend-test-results`.

Generated coverage files, Vite cache files, and HTML reports are ignored by git.

## When CI Fails

- Migration failures usually mean there are multiple Alembic heads or a migration cannot run on an empty database.
- Backend test failures should be reproduced with `python -m pytest backend -q`.
- Frontend failures should be reproduced from `frontend/` with `npm run lint`, `npm test`, or `npm run build`.
- Compose failures usually mean a referenced env example file or mounted path is missing.
