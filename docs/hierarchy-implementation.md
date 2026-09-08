# Hierarchy and recent prominence

The hierarchy pipeline proposes broader, need-based parents from existing classified spaces. Existing names/definitions are reused; narrower spaces and direct project assignments are preserved. Relationships carry explanations and model provenance. No fixed root taxonomy is seeded, and no automatic space merging or splitting occurs.

```sh
cd backend
uv run --env-file .env python -m catalog.hierarchy
```

For a free alternative when Super has provider failures:

```sh
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free uv run --env-file .env python -m catalog.hierarchy
```

Ultra returns schema-shaped function arguments, which are validated as data; no model-selected tool executes. All requests retain zero prompt/completion price caps. The hierarchy call currently accepts at most 100 spaces per review. Larger catalogs need a partitioned proposal workflow before running this command; it fails explicitly rather than silently truncating input.

Each proposal is committed atomically. A database trigger rejects non-space endpoints, self-links, and cycles. Multiple parents are supported. Existing links are upserted; this command does not remove relationships or redefine existing spaces. Changed definitions during generation reject the proposal. Low-confidence links remain absent.

`GET /spaces` exposes parents, children, inherited domain memberships, total counts, and recent counts. Recursive reachability uses distinct ancestor/descendant pairs; projects reached through multiple assignments or paths count once. Selecting a broad space browses its descendants plus direct broad-only assignments. Unknown publication dates appear last in space browsing and do not contribute to recent counts. Recent counts use the current 90-day window at query time; no ingestion is needed to age out a project. Ineligible and unavailable projects do not count. `GET /domains` ranks distinct project counts with both recent and total values.

The UI exposes broader/narrower navigation, matching criteria, recent/total counts, and domain coverage. These are observed catalog counts, not growth or complete ecosystem activity.

Tests cover diamond ancestry, broad-only membership, multiple domains, cycle rejection, unknown dates, aging, availability changes, assignment changes, generated-parent reuse, and API descendant browsing. Live provider review and browser verification are recorded below once complete.

## Live review — September 8, 2026

Nemotron Super returned persistent 502 gateway failures. The explicitly free Ultra endpoint successfully generated seven links, spanning five broader spaces and seven existing specific spaces:

- Software development → Writing code; Writing documentation; Identifying and fixing security vulnerabilities.
- Document format conversion → Converting documents to Markdown.
- Data visualization → Visualizing geospatial data.
- Digital content editing → Removing watermarks from content.
- Text extraction from visual sources → Extracting text from images.

Reviewed the parent matching criteria and explanations against child definitions. The software parent counts four distinct projects across its three children; Writing code has two. The other four parents each have one distinct project. Broader labels remain candidates for refinement in #14; this is a small local catalog, not evidence of ecosystem-wide taxonomy quality.

The backend suite passes 44 tests and the production frontend build passes. The existing classification provider remains Super; the successful hierarchy run records Ultra as its provenance.

Live browser checks also pass for parent → child → parent navigation, descendant cards/detail evidence, and reset, alongside keyboard focus/scroll restoration, themes, mobile sizing, pagination, error retry and empty states.
