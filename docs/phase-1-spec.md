# Phase 1 — Dynamic project discovery

Status: agreed scope following the completed refinement interview. This document is the normative Phase 1 scope linked from SPEC.md; broader examples in SPEC.md describe the future product unless included here. Product behavior and visual direction are agreed; exact visual tokens and the engineering choices listed below remain implementation details.

## User and outcome

The first user is a developer looking for a side project, with interests but no concrete idea. A successful session produces a shortlist of real projects that helps them choose a direction to explore.

The catalog reveals domains and problem spaces emerging from projects across multiple sources. Operators do not choose a fixed list of domains. Recent prominence describes the catalog's observed publication volume, not comprehensive ecosystem activity or growth.

The first milestone runs locally end to end. Favor zero or minimal operating cost. Public deployment is a separate milestone, but browsing and private boards must already support distinct users.

## Core journey

1. Browse a graph led by broad problem spaces without signing in or completing an onboarding questionnaire.
2. Zoom to inspect specific problem spaces and projects, or select a space to browse its project cards.
3. Browse recently published projects or search using natural language and visible filters.
4. Open a project detail panel without losing graph or feed position.
5. Sign in when saving inspiration, create a private board, and save projects for later.

## Catalog and sources

Phase 1 includes all five connectors:

| Source | Content | Interface and date caveat |
|---|---|---|
| GitHub | Concrete software and hardware project repositories | Public REST API; repository creation is a labeled date fallback |
| Show HN | Project announcements, including projects without public code | Official HN API; story creation is an announcement date, not proof of original launch |
| itch.io | Games and interactive projects | Public game discovery RSS; validate feed date semantics before using dates |
| Hugging Face Spaces | AI applications and demos | Hub API; Space creation is a labeled repository-created fallback |
| Product Hunt | Launched products | GraphQL API; token access is a delivery prerequisite; retain post-date provenance |

Product Hunt is a required connector, not an optional omission if access is unavailable. Connector credentials and any local model requirements must be documented in setup instructions. A failed or unconfigured connector must be reported honestly, without preventing other sources from refreshing.

Include applications, tools, libraries, and hardware builds. Exclude tutorials, resource lists, starter templates, standalone asset packs, and model/dataset records that are not projects. A project needs a usable name, description, and source link to appear in discovery.

Initially target the previous 90 days wherever supported. Historical coverage may be partial. Do not impose selected-domain restrictions or popularity thresholds. For GitHub, prioritize repositories created within the previous 90 days by total stars descending as an initial trending proxy; this is popularity among new repositories, not recent star growth or the GitHub Trending ranking. Recently Added remains ordered by publication date. Use bounded daily batches; adapters must document their discovery boundaries and pagination/checkpoint behavior.

Refresh sources independently each day. Retain existing results during failures and retry later. Show connected sources and each source's last successful refresh. A source outage does not prove its projects were removed.

## Identity, dates, and updates

- One project may have several source records. Merge when records explicitly identify the same repository or canonical project URL; never merge based only on similar names or descriptions.
- Preserve source identifiers, URLs, date evidence, and availability independently from the canonical project.
- Use the earliest known reliable publication or announcement date across sources. Use repository creation only as a labeled fallback when publication or announcement evidence is unavailable.
- Never substitute ingestion time or last-modified time for publication. New source evidence may refine a date; routine metadata updates must not reset it.
- Unknown-date projects remain searchable and browsable in their spaces but do not appear in “Recently published” or contribute to recent prominence.
- Update changed metadata. Preserve saved references to unavailable projects and label unavailable sources. Exclude a project from discovery when no source remains available; retain it in saved boards.

## Classification and graph model

Use the definitions in [CONTEXT.md](../CONTEXT.md): domains are fields of application, problem spaces group related problems, and technologies describe methods or tools used.

Projects may belong to multiple domains, spaces, and technologies. Match existing names and definitions before creating a new space. A single project can establish a new space if no existing space fits. Leave uncertain classifications unassigned rather than inventing a confident assignment. Eligible unassigned projects can still appear in search and date-appropriate feeds.

Automatically assign domains and parent–subcategory relationships. A child must describe a narrower problem than its parent. Multiple parents are allowed; cycles are forbidden. Domains provide metadata, color, and filters rather than central grouping nodes. Technologies are filters, not nodes.

Use broad, need-based problem spaces as entry points, with more specific problem spaces underneath. For example, Giving and receiving care may contain Care coordination, Emotional support, and Supporting caregivers. These are illustrative names, not a fixed taxonomy or required number of categories.

Each space needs a plain-language matching criterion. Match a project when it meaningfully addresses that need; do not require a particular audience, technology, or interface unless intrinsic to the problem itself. Avoid making solution formats such as “boards,” “dashboards,” or “tools” the basis of subcategories. A project may match a broad space without matching a specific child. Preserve multiple justified memberships and a short explanation grounded in the project description; broader matching must not become unsupported assignment.

Membership in a subcategory implies membership in its ancestors for browsing and distinct-project counts. Draw the specific assignment without redundant direct ancestor links. Independent memberships remain explicit; never force a project into one exclusive branch to simplify the picture.

Space membership and prominence can change as project metadata and assignments change. Automatic space merging/splitting and operator or community correction tools are out of scope. Classification rules and reprocessing remain available as development mechanisms.

## Graph interaction

### Visual direction

Use the Signal visual direction explored in the prototype, with readable monospace typography. Accessibility, ease of use, and readability take priority over decorative styling.

- Default to near-black surfaces, cool neutral text, warm-yellow primary accents, and cyan secondary accents. Also provide a light theme with accessible corresponding colors. Both require readable contrast and visible keyboard focus.
- Use small ASCII accents in the wordmark and empty states. Navigation, buttons, and graph elements remain conventional interface controls. Decorative ASCII must not interfere with assistive reading or replace meaningful text.
- Use restrained node colors, thin subdued edges, and readable labels. Reserve strong emphasis for higher-level spaces, selection, and traced relationships.
- Highlight the selected node and its connections while dimming unrelated elements. Retain readable labels; use labels and selection outlines alongside color so color alone never conveys meaning.
- Keep project imagery within the Pinterest-like card feed. Exact color tokens, font family, spacing, and sizes are implementation details to validate against these requirements.

### Layout and behavior

- Render an interactive node graph inspired by Obsidian.
- Use a circular overall constellation of labeled space nodes and visually distinct project nodes. Constrain placement rather than cropping a rectangular layout into a circle. Relationships influence placement; domains do not impose compartments. The layout settles quickly rather than drifting continuously; support pan, zoom, and node dragging.
- Provide complementary Problem Spaces and Recently Added views on desktop and mobile. Problem Spaces is the main graph canvas; Recently Added is an image-led masonry feed. Selecting a space shows its name, matching criterion, and counts, with an action to browse matching projects. Preserve selection, query, filters, and exploration position between views.
- Size space nodes by the number of distinct catalog projects published in the last 90 days, including descendant spaces. Count a project once even when several paths lead to it. Apply the same distinct-project principle when ranking domains.
- Give visible nodes a minimum selectable size. Show total project counts on selection.
- Broad spaces have larger circles and stronger labels than their subcategories; size within each level still reflects recent prominence. Projects and their links are quieter in the overview. Increase subcategory and project prominence as the user zooms in, with label decluttering and hover/focus access to obscured labels. Exact sizes and zoom thresholds require visual validation.
- Do not use automatic taxonomy collapse or a manual expand/collapse control in the accepted interaction direction. Zoom changes visual prominence without repeatedly rebuilding the layout or changing memberships. Preserve node positions on selection and search. The 10,000-project scalability requirement in [the graph exploration decision](adr/0001-progressive-graph-exploration.md) remains: rendering budgets and progressive loading are unresolved engineering work, not a requirement to draw the entire catalog simultaneously. Its collapse-specific wording is superseded by this interaction direction; any bounded rendering must preserve discovery and explicit relationships.
- Hide spaces without recent publications from the default graph. Keep them searchable and provide “Show older spaces.” Do not describe absence of catalog evidence as real-world inactivity.
- Selecting a space highlights its parents and subcategories and filters cards to projects in that space and descendants. Provide a clear reset to all spaces.
- Solid edges communicate parent–subcategory structure or actual project membership. Projects with multiple memberships are the explicit bridges between spaces. Do not add redundant space-to-space edges merely because the spaces share a project. Hover, keyboard focus, and selection trace direct relationships and explain their type without highlighting the entire connected graph.
- Suggested connections are a separate, optional layer, off by default. If shown, use distinct dashed styling and explain the shared challenge or transferable approach. They establish neither membership nor hierarchy. Following a suggestion selects its destination rather than merging results. General similarity edges remain deferred; do not connect everything for visual cohesion.

## Feed, search, and details

Use a Pinterest-like card feed alongside graph exploration. The dedicated “Recently published” feed sorts by publication date descending and excludes unknown dates. Browsing a space uses the same ordering but places unknown-date projects last.

Natural-language search returns existing project cards ranked by relevance, not generated answers or ideas. Apply any selected space and active filters; show removable constraints. Filters match any selected value within a type and require matches across types. For example, Healthcare plus Python and Rust means Healthcare AND (Python OR Rust).

When constrained search is empty, offer an explicit “Search all projects” action. Never silently broaden the query or fabricate results. Do not promise that a matching project is feasible for a user's skills, hardware, or deadline.

Cards open a detail panel containing description, publication date and its provenance, domains, problem spaces, technologies, source links, and save action. Preserve the graph/feed position when opening and closing it. Images are optional; image-less projects remain eligible.

## Accounts and boards

Browsing requires no sign-in. Saving requires sign-in. Each user can create private boards with a required name and optional description, rename them, and delete them. A project may appear in multiple boards. Users can save and remove projects; saving the same project twice to one board must not create duplicates.

Deleting a board removes only that collection, not the catalog projects or other boards. Users cannot read or modify other users' private boards. Saved unavailable projects retain enough information to be recognized and show their source availability.

Public profiles, public boards, sharing, and collaboration are out of scope.

## Implementation boundaries

Retain Next.js with TypeScript for the frontend, FastAPI for the backend, and PostgreSQL with pgvector for metadata and semantic retrieval. Store domain memberships and parent relationships relationally; no separate graph database is required.

Separate source adapters, canonical project identity, classification, discovery queries, and private boards so each behavior can be validated independently. The existing illustrative Project schema in SPEC.md must be expanded to support multiple source records, date provenance, and availability. Trend scores and growth rates are not required Phase 1 fields.

Use Sigma.js for production graph rendering and interaction, with Graphology for the client-side graph model. Sigma renders with WebGL; graph layout algorithms are a separate concern ([official documentation](https://www.sigmajs.org/docs/)). Implement the agreed circular layout, hierarchy, explicit edge meanings, zoom prominence, and accessible keyboard exploration around those capabilities. Highcharts remains a throwaway prototype choice. Pin compatible package versions during implementation; library selection does not establish performance at the 10,000-project target.

Engineering choices still to specify during implementation include the layout algorithm and rendering budgets, authentication mechanism, classification/embedding models, batch limits, retry timing, and retrieval tuning. These must fit the agreed behavior and minimal-cost local milestone; they are not permission to omit required features. Credential-dependent work needs real access to complete end-to-end validation.

## Acceptance scenarios

1. Each of the five connectors ingests an eligible project through its real interface during integration validation. Repeating ingestion does not duplicate its source record.
2. A repository explicitly linked from another source becomes one project with both links and contributes once to counts. Similar names alone do not merge unrelated projects.
3. An old project ingested today does not gain a recent date. An unknown-date project remains searchable but does not increase recent prominence. A metadata refresh does not make an old project recent.
4. Projects create spaces beyond any initial examples; existing matching definitions are reused. Uncertain assignments remain empty. A proposed cycle is rejected.
5. A project assigned through two descendant paths contributes once to its ancestor count. A project aging outside the 90-day window ceases contributing to recent prominence.
6. Graph selection filters cards to the selected space and descendants; reset, hidden-space search, and “Show older spaces” work without losing catalog entries. A broad-only assignment remains browsable, and a project with multiple specific memberships contributes once to ancestor counts. Specific spaces sit beneath broad spaces, rather than flattening all project links onto broad hubs.
7. Semantic queries find relevant existing projects without exact keyword requirements. Selected constraints remain visible; empty results offer explicit broadening. Filter combinations follow the defined OR/AND rules.
8. A visitor can browse without authentication. Two signed-in users have isolated private boards; saving, removing, renaming, and deleting behave as specified.
9. One source failing leaves other refreshes and existing discovery functional. Confirmed unavailability preserves saved references; a temporary outage does not remove projects.
10. Review a fixed, documented sample of 50 projects, 10 from each source. At least 45 must have sensible problem-space assignments when judged against their source descriptions; unassigned projects do not count as successful assignments. Check eligibility, require no circular parent relationships, and review all spaces generated by the sample for obvious duplicate names. Record failures and improve systemic classification through rules and reprocessing. This is an initial release check, not an estimate of accuracy across the whole catalog.
11. Verify dark and light themes across graph, cards, detail panels, search, and boards. Check readable contrast, visible keyboard focus, and selection states that remain understandable without color. Graph discovery and project selection must be keyboard accessible; decorative ASCII must not obscure meaningful content. Verify that the circular layout settles without boundary pileup and that Problem Spaces and Recently Added preserve selection and exploration state on desktop and mobile.
12. Verify the broad → specific → project hierarchy at overview and close zoom. Lower levels become legible without collapse or layout resets; parent circles remain distinguishable and labels do not grow into overlapping blocks. Trace a multi-membership project and confirm all its direct connections remain discoverable without duplicate ancestor or shared-project edges. Suggested connections start hidden, show explanations when enabled, and do not change membership or counts.
13. Review matching criteria with examples that address the same need using different audiences, technologies, and interfaces. Confirm that valid broad-only matches are accepted, narrower assignments require supporting evidence, and solution-format categories are not generated unnecessarily. The hand-authored prototype fixtures do not establish classifier accuracy or production performance.

## Explicit non-goals and later phases

Phase 1 does not include trend scores, growth percentages, general similarity edges, automatic space splitting/merging, classification correction interfaces, personalized recommendations, idea generation, opportunity-gap detection, collaborative boards, or public deployment.

Preserve Phase 2 for trend analysis, richer clustering and relationships, and personalization. Preserve Phase 3 for the Idea Explorer, opportunity analysis, and personalized feasibility-oriented inspiration. Dynamic classification and the parent–subcategory graph are already Phase 1 responsibilities.

## Source references

- [GitHub search API](https://docs.github.com/en/rest/search/search)
- [Official HN API](https://github.com/HackerNews/API)
- [itch.io API and RSS documentation](https://itch.io/docs/api/overview.amp)
- [Hugging Face Hub API](https://huggingface.co/docs/hub/en/api)
- [Product Hunt API access](https://www.producthunt.com/v2/docs)

Source access and field semantics must be validated against real responses during connector implementation; catalog completeness is never assumed.
