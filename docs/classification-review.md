# Hosted classification review — September 8, 2026

Provider: OpenRouter. Model: `nvidia/nemotron-3-super-120b-a12b:free`. Inputs are real public GitHub project names/descriptions; results are stored through the shared classification path.

## Findings and systemic changes

Initial output included a space named “Lazy Development,” which copied marketing language instead of describing a need. Another pass interpreted “Everything is a Plugin” as interchangeable AI models. Both were unsupported. The prompt now requires plain-language activities, rejects claims inferred from brands or slogans, and leaves insufficient descriptions unassigned.

The model also inferred a plugin framework from a description that only said “extensible.” Technology labels now must occur in the project metadata; unsupported labels are left unassigned. This is deliberately conservative and may omit synonymous or expanded technology names.

Reprocessing versions the rules and supplies vocabulary already assigned under the current version. Earlier definitions are retained for identity/history but do not seed the revised vocabulary. Unused spaces are omitted from conventional browsing. No operator-specific assignment overrides were introduced.

Free-provider HTTP 502 failures occurred during the review. The adapter retries a transient 502/503/504 once, preserves each completed project, and stops on quota or persistent failures. Subsequent runs skip unchanged projects under the current rules/model. The CLI reports committed progress without printing credentials or raw provider errors.

## Reviewed results under need-based-v4

| Project | Reviewed result |
|---|---|
| deepseek-harness | Empty: slogan alone does not establish a need |
| ponytail | Software development domain; no invented “Lazy Development” space |
| grok-build | Writing code; reused Software development |
| Unlimited-OCR | Extracting text from images; explicit OCR technology |
| dsh-desktop | Software development; no speculative space from the plugin slogan |
| watermarks-remover | Removing watermarks from content |
| anydoc | Converting documents to Markdown; explicitly named Rust, Node.js, Python |
| gods-eye-view | Visualizing geospatial data |
| openwiki | Writing documentation; reused Software development |
| qm | No space; Software development domain is debatable given the terse description |
| opencodex | Reused Writing code; provider interoperability could be a more precise additional need |

The sample demonstrates real new-space creation, reuse, multilingual processing, explicit technologies, uncertain spaces left empty, and source-grounded explanations. A rejected OCR quote stopped a batch; a fresh inspected response passed the unchanged evidence validator and was saved through the normal persistence path.

Browser checks passed using real saved spaces: selecting a space loads its projects, detail panels show evidence, and reset restores the recent feed. The backend suite passes 40 tests, including persistence, reprocessing, invalid-evidence rejection, unnamed-technology omission, and transient-provider retry.

Remaining quality limitations: the model can still be overconfident about domains on sparse descriptions (qm); domain names such as Document conversion may be narrower than useful. The specific Markdown conversion space needs a broader parent in #7. These findings remain inputs to systemic prompt refinement and the fixed cross-source review in #14; this sample is not a catalog-wide accuracy estimate. No manual per-project classification overrides were used.
