# Classification implementation status

Ticket #6 uses OpenRouter with `nvidia/nemotron-3-super-120b-a12b:free`. The live model catalog on September 8, 2026 lists zero prompt/completion pricing and structured-output support. Credentials and real hosted validation remain pending; no production assignments have been fabricated.

The provider-independent path lives in `backend/catalog/classification.py`. A provider adapter supplies `generate(messages) -> dict` to `classify_batch`; responses conform to `Classification`. Each eligible, available canonical project goes through the same path irrespective of source. A bounded batch processes 20 projects by default.

The prompt supplies the existing vocabulary and requires reuse of matching names and definitions before creating a new term. Domains, spaces, and technologies remain distinct. Space definitions are need-based matching criteria, with broad matches permitted and no incidental audience/interface/technology requirements. New terms can emerge from a single project. No predefined category list is seeded.

Assignments below 0.8 reported confidence remain empty. Accepted assignments require an exact metadata quote and explanation. Confidence and quotes are validation aids, not proof of semantic correctness: real hosted results still require review. Normalized duplicate names reuse one term per kind and preserve its existing definition; semantic synonym detection relies on the model seeing existing definitions. Large-vocabulary retrieval is not yet implemented.

Classification replaces a project's assignments atomically. Failed responses preserve previously committed work. Metadata hashes and rules/model versions allow development reprocessing while skipping unchanged projects. GitHub metadata changes remove stale assignments; reprocessing sees the changed hash. Ineligible records are excluded before model calls. Model requests receive only the project name/description and catalog definitions, never source credentials.

`GET /spaces` and `GET /projects?space_id=…` support conventional browsing; details show assignments, definitions, explanations and quotes. Space browsing includes older and unknown-date projects, with unknown dates last. These are direct-assignment counts; descendant hierarchy and counts belong to #7.

Verification so far: 32 backend tests pass and the production frontend build passes. Tests cover definition reuse, new terms, uncertainty, distinct kinds, evidence rejection, rollback, reprocessing, changed metadata, eligibility, and space browsing/date behavior. Browser checks cover real feed/detail behavior plus an isolated classified-space fixture. Real hosted classification and review are still required before closing #6.

## Hosted setup

Set `OPENROUTER_API_KEY` in the backend environment or in the ignored `backend/.env` file. Do not commit it. Optionally set `OPENROUTER_MODEL` to another explicitly free Nemotron model with structured-output support.

```sh
cd backend
uv run --env-file .env python -m catalog.openrouter --limit 5
```

If the key is already exported, omit `--env-file .env`. Repeating the command skips unchanged completed projects; `--reprocess` reevaluates a bounded batch. The adapter requires schema-compatible providers, caps accepted prompt/completion prices at zero, and uses no paid model fallback. Each project uses one request. Calls are spaced at least 3.1 seconds apart; rate-limit, provider, malformed JSON, and truncated-response errors stop the batch, preserving completed projects for resumption.

Free accounts currently receive 50 requests/day; higher free-model quotas depend on purchased credits. This limits how quickly the catalog can be classified, without requiring a purchase for the initial review. See [OpenRouter FAQ](https://openrouter.ai/docs/faq), [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection), and [model catalog](https://openrouter.ai/api/v1/models). Availability and quotas can change.

Adapter verification brings the suite to 38 passing tests, including free-model selection, structured requests, and refusal to accept failed or incomplete provider responses. No authenticated call has been made yet.
