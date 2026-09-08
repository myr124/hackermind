# Classification implementation status

Ticket #6 uses a hosted model, as requested. Provider, model, endpoint, and environment-variable name for credentials are pending. No hosted requests have been made and no production assignments have been fabricated.

The provider-independent path lives in `backend/catalog/classification.py`. A provider adapter supplies `generate(messages) -> dict` to `classify_batch`; responses conform to `Classification`. Each eligible, available canonical project goes through the same path irrespective of source. A bounded batch processes 20 projects by default.

The prompt supplies the existing vocabulary and requires reuse of matching names and definitions before creating a new term. Domains, spaces, and technologies remain distinct. Space definitions are need-based matching criteria, with broad matches permitted and no incidental audience/interface/technology requirements. New terms can emerge from a single project. No predefined category list is seeded.

Assignments below 0.8 reported confidence remain empty. Accepted assignments require an exact metadata quote and explanation. Confidence and quotes are validation aids, not proof of semantic correctness: real hosted results still require review. Normalized duplicate names reuse one term per kind and preserve its existing definition; semantic synonym detection relies on the model seeing existing definitions. Large-vocabulary retrieval is not yet implemented.

Classification replaces a project's assignments atomically. Failed responses preserve previously committed work. Metadata hashes and rules/model versions allow development reprocessing while skipping unchanged projects. GitHub metadata changes remove stale assignments; reprocessing sees the changed hash. Ineligible records are excluded before model calls. Model requests receive only the project name/description and catalog definitions, never source credentials.

`GET /spaces` and `GET /projects?space_id=…` support conventional browsing; details show assignments, definitions, explanations and quotes. Space browsing includes older and unknown-date projects, with unknown dates last. These are direct-assignment counts; descendant hierarchy and counts belong to #7.

Verification so far: 32 backend tests pass and the production frontend build passes. Tests cover definition reuse, new terms, uncertainty, distinct kinds, evidence rejection, rollback, reprocessing, changed metadata, eligibility, and space browsing/date behavior. Browser checks cover real feed/detail behavior plus an isolated classified-space fixture. Real hosted classification and review are still required before closing #6.
