# GitHub eligibility review — September 8, 2026

Reviewed the names and descriptions of all 94 records from the fresh, star-ranked GitHub batch. Refined source-independent metadata rules and added a development recheck command:

```sh
cd backend
uv run python -m catalog.eligibility
```

Recheck marks excluded projects ineligible for discovery, retaining their canonical identity, source availability, and evidence. It does not delete source records or conflate ineligibility with source disappearance.

| Record | Reason |
|---|---|
| Codex-Dream-Skin | Description repeats the name |
| openGym | Description is only a URL |
| exploitarium | Archive of research writeups and proof-of-concept material |
| FDE-the-Guidance-Book-of-Forward-Deployed-Engineer | Reading guide |
| investing-for-beginners | Learning material |
| codex-orange-book | Usage guide |
| harness-engineering | Anthology and field guide |
| tabfm | Standalone pretrained-model record |

The recheck leaves 86 eligible records and preserves all 94 source records. Representative inclusions include anydoc (document conversion), genoffice (office application), canvas-ui (component library), Claude-of-Duty (game), and h3.c (inference engine). Reusable executable agent skills and inference engines remain builds; mentioning tutorials, curated resources, or pretrained models does not alone make a tool ineligible.

Verification: 26 backend tests pass. Coverage includes representative applications/libraries/hardware, multilingual descriptions, tutorial-making tools, profiles, missing descriptions, lists, tutorials, starter templates, standalone assets/datasets/models, and reprocessing through the feed/detail API while retaining source evidence.

This completes the initial eligibility refinement for ticket #1, not a guarantee of perfect catalog eligibility. Terse descriptions remain ambiguous (for example Kimi-K3 and firstmate), and rules cannot infer every project's contents. Classification must leave unsupported assignments empty. The fixed cross-source quality evaluation belongs to ticket #14.
