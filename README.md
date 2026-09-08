# Hackermind

Phase 1 ticket #1: browse real GitHub projects locally. The production slice uses Next.js/TypeScript, FastAPI, and PostgreSQL with pgvector. The graph is a later slice; Sigma.js is selected in the spec. The separate `prototype/` is fictional UI exploration.

## Run locally

Requires Docker Compose, Python 3.12+, uv, Node 20.9+, and pnpm.

```sh
docker compose up -d --wait db
cd backend
uv sync
uv run python -m catalog.github --max-pages 1
uv run uvicorn catalog.api:app --host 127.0.0.1 --port 8000
```

In another terminal:

```sh
cd web
pnpm install
pnpm dev
```

Open http://localhost:3000. No sign-in is required. Select a card to inspect its source and publication evidence; Escape or Close returns focus to the card without resetting the feed. Switch dark/light themes in the header. Image-less projects are fully supported.

The database runs on localhost:54329 using the development-only credentials in `compose.yaml`; its named volume persists across restarts. `DATABASE_URL` overrides the backend connection. `API_URL` overrides the Next.js server-side proxy destination (default http://127.0.0.1:8000). Stop the database with `docker compose stop db`; this retains data.

## GitHub credentials and discovery boundaries

Public GitHub search works without a token but has lower rate limits. Optionally export `GITHUB_TOKEN` in the backend terminal using a token authorized to read public repositories. Never place it in frontend variables or commit it. No paid services are required.

`uv run python -m catalog.github --max-pages 2` retrieves at most two pages of 100 repositories. A persistent checkpoint fixes the rolling 90-day creation-date window and resumes at the next page. `--restart` starts a new window from page one without deleting projects or source records. Repeated repositories update metadata idempotently using GitHub's stable repository ID. Each batch commits records and its checkpoint together; failures roll back that batch, retaining earlier batches. Changing the discovery policy automatically restarts pagination without deleting imported projects. The Recently Added feed still orders the combined catalog by publication date. Refresh scheduling is a later ticket.

Discovery searches all domains without popularity thresholds, excluding forks and archived repositories. GitHub search exposes at most 1,000 results per query. Discovery ranks repositories created within that window by total stars, descending, as an initial trending proxy. This measures popularity among new repositories, not recent star growth or GitHub’s Trending ranking ([GitHub search documentation](https://docs.github.com/en/rest/search/search#search-repositories)). Star rankings can change, so pagination may repeat or skip records; this is a bounded partial sample, not exhaustive coverage. Incomplete search responses retain usable records and a coverage warning while leaving that page queued for retry. HTTP/rate-limit failures roll back the batch without advancing the checkpoint. Retry later or restart the rolling window. Repository creation is retained as a labeled publication fallback; modification/ingestion timestamps never become publication dates. Unknown, future, and older dates are excluded from the recent feed.

Eligibility uses shared name/description/link rules plus repository flags: it rejects unusable metadata, profiles, forks, templates, reading collections, tutorials, starter templates, and standalone model/dataset/asset records. Run `uv run python -m catalog.eligibility` to recheck existing records without deleting evidence; see [the reviewed sample](docs/eligibility-review.md). It is a conservative heuristic with false positives and negatives, not semantic classification or a guarantee that all repositories are eligible builds. Automatic classification and its quality review are later tickets. Domains, problem spaces, and technologies remain unassigned in this slice.

## Verify

```sh
cd backend
uv run pytest
```

Integration tests use a temporary PostgreSQL schema and cover repeat persistence, date ordering/exclusions, API details, eligibility, checkpoint continuation, and failed-batch retry. They require the running local database and never truncate the catalog.

```sh
cd web
pnpm check
pnpm build
pnpm exec playwright install chromium
node scripts/browser-check.mjs
```

The browser check requires both servers and a populated catalog. It checks real feed/detail navigation, keyboard focus and scroll restoration, pagination when available, themes, mobile sizing, error retry, and empty state. Set `BASE_URL` for another frontend port and `CHROMIUM_PATH` to use an existing Chromium executable.

For a real-data demo, run one GitHub page, inspect the feed and date evidence, then rerun with `--restart --max-pages 1`. Existing GitHub IDs should retain one canonical project and one source record; newly encountered IDs may increase counts because search order changes.

Verified locally on September 8, 2026: four PostgreSQL integration tests, the production build with TypeScript checks, and the browser check passed. Two real GitHub batches accepted 22 and 18 repositories, leaving 40 unique projects and 40 unique source records. Both responses reported incomplete results, and the page remained queued for retry with that warning visible in the collection details. Sampling also exposed low-information and profile repositories passing the metadata heuristic; eligibility quality still needs improvement before treating this as a curated catalog.

## Classification work in progress

The shared classification path and space-browsing UI are implemented. Hosted provider configuration and real-model validation are pending; see [implementation status](docs/classification-implementation.md). No production classifications are assigned yet.
