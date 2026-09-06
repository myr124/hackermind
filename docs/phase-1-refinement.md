# Phase 1 refinement — completed

These are accepted interview decisions, consolidated into [the Phase 1 specification](phase-1-spec.md) and linked from SPEC.md. The user confirmed shared understanding after reviewing product behavior and visual direction. Phases 2–3 remain future vision.

## Accepted decisions

- Initial audience: a developer seeking their next side project, with interests but no concrete idea.
- Desired outcome: a shortlist of real projects that helps the developer choose a direction to explore.
- Ingest from multiple sources in Phase 1. The particular sources remain unresolved.
- Domains and problem spaces emerge from ingested projects rather than an operator-selected list of areas.
- Space membership and prominence can change as the catalog changes. Automatic splitting and merging of spaces are deferred.
- Phase 1 displays project counts and recent additions. Trend scores and change-over-time analysis remain future work.
- Recency is determined by project publication date, not ingestion date, to reflect when work was published. Label the feed “Recently published” and order by publication date.
- The homepage leads with an Obsidian-like node graph of problem spaces, representing prominence and subcategories. Projects appear as cards in a Pinterest-like recent-project feed.
- Match projects to existing problem spaces first; create a clearly named and described space when none fits, even if it initially contains one project.
- Classification error correction is outside Phase 1, including operator correction tools.
- Size graph nodes by distinct projects published in the last 90 days; show total project counts on selection. This measures recent volume, not growth.
- Graph edges mean parent–subcategory relationships. Multiple parents are allowed; general similarity edges are deferred.
- Selecting a space highlights its parents and subcategories and filters project cards to that space, including descendant spaces. Count each project once and provide a way back to all spaces.
- Use the earliest reliable public publication date across sources; repository creation is a labeled fallback when public publication date is unavailable.
- Projects without a usable date remain browsable within spaces but are excluded from “Recently published” and recent-prominence counts.
- Hide spaces with no publications in the last 90 days from the default graph; keep them searchable and offer a “Show older spaces” toggle. Visible nodes have a minimum selectable size.
- Domains are labeled grouping nodes above problem spaces. A space can belong to multiple domains. Technologies are filters, not graph nodes, in Phase 1.
- Browsing is public without sign-in. Sign-in is required to save projects to private boards. Sharing, collaboration, and public profiles are outside Phase 1.
- Natural-language search returns existing project cards with domain, problem-space, and technology filters. Generated ideas and conversational answers are deferred; search does not promise personal feasibility or deadline suitability.
- Initially show domains and their most prominent problem spaces; expand nodes to reveal deeper subcategories. Search can find spaces outside the current graph view.
- Project cards open a detail panel with description, publication date, domains, spaces, technologies, source links, and a save action, preserving the user's graph/feed position.
- A project can be saved to multiple private boards. Boards require a name and allow an optional description. Support creation, renaming, deletion, saving, and removal; deleting a board removes only that collection.
- Refresh sources daily and show the last successful refresh time. On source failure, preserve existing results and retry later.
- Phase 1 includes five sources: GitHub, Show HN, itch.io, Hugging Face Spaces, and Product Hunt. Product Hunt requires API access; this is a delivery dependency, not permission to silently omit it. Sources refresh independently so one unavailable source does not block the others.
- Interpret publication as earliest known publication or announcement, retaining source and date type. Label repository-created fallback dates and never substitute ingestion time for recency.
- Combine source records when they explicitly reference the same repository or canonical project URL. Preserve source links and count the project once. Similar names or descriptions alone are insufficient to merge projects.
- Partial catalog coverage is acceptable at launch. Show connected sources and last successful refresh per source. Describe recent counts as publications within this catalog, not comprehensive ecosystem activity; no recent entries does not prove a real-world space is inactive.
- Projects with a usable name, description, and source link remain searchable and eligible for feeds even when classification is uncertain. Leave uncertain fields unassigned; unassigned projects do not contribute to problem-space counts. Existing date requirements still apply to the recent feed.
- Assign domains and parent–subcategory relationships automatically, reusing existing names and definitions before creating new ones. Subcategories must describe narrower problems than their parents; prevent circular relationships.
- Search stays within the selected space and active filters. Show removable constraints and offer an explicit “Search all projects” action for empty results; never silently broaden the query.
- Refresh changed source metadata without resetting publication dates merely because content changed. Preserve saved references when projects disappear and mark unavailable sources. Exclude projects from discovery only when no available sources remain; temporary source outages do not establish project removal.
- Initially target the last 90 days wherever source interfaces support it, without chosen domain restrictions or popularity thresholds. Accept partial history and use bounded daily ingestion batches.
- Initially display the 10 most prominent domains with up to 5 leading problem spaces each. Offer “Show more” for remaining domains and spaces; display limits never limit search coverage.
- Order search by relevance and browsing feeds by publication date descending. In space browsing, put unknown-date projects after dated projects; exclude them from the dedicated “Recently published” feed.
- Filters use OR within a type and AND across types. For example, Python or Rust combined with Healthcare requires Healthcare and at least one of the two technologies. Make this behavior visible.
- Retain Next.js, FastAPI, and PostgreSQL with pgvector. Store graph relationships in PostgreSQL; no separate graph database is needed.
- Validate classification before launch against a fixed sample from all five sources, checking eligibility, assignments, duplicate space names, and parent relationships. Improve systemic issues through classification rules and reprocessing; user-facing correction tools remain out of scope.
- First delivery milestone is a complete locally runnable experience with all five connectors, graph, search, and private boards. Public deployment is a separate milestone.
- Classification release check: review 50 projects, 10 per source; at least 45 must have sensible problem-space assignments against source descriptions. Require no circular parent relationships and review generated spaces for obvious duplicate names. Record failures and improve through reprocessing; the sample does not establish catalog-wide accuracy.
- Keep domains, problem spaces, and technologies distinct. Projects may belong to multiple spaces.
- Include concrete software and hardware projects, including tools and libraries. Exclude tutorials, resource lists, and starter templates.
- The user is a student building this for personal ideation. Favor zero or minimal cost; do not pursue budget or spending decisions now.

## Visual refinement

- Accepted: labeled circular graph nodes, thin edges, related spaces clustered around domains, and a force-directed layout that settles quickly, with pan and zoom.
- Accepted: a large graph above the project feed on larger screens, with selected-space name and counts; separate Graph and Projects views on smaller screens.
- Accepted design direction: hacker-themed, Gruvbox-like aesthetic with monospace fonts. Accessibility, ease of use, and readability take priority.
- Dark theme by default, with warm charcoal surfaces, cream text, and muted earthy accents; provide a warm light theme. Both need readable contrast and visible keyboard focus.
- Small ASCII accents belong in the wordmark and empty states; keep navigation, buttons, and graph elements conventional and accessible.
- Use muted graph node colors and subdued edges. Highlight the selected node and connections, dim unrelated elements, and communicate meaning through labels and outlines as well as color.
- Exact palette tokens, font choice, spacing, and sizing remain implementation details within the agreed visual direction.

## Remaining engineering work

- Select graph library, authentication mechanism, classification/embedding models, and retrieval tuning.
- Implement and validate per-source field mappings, discovery boundaries, bounded batches, checkpoints, and retry timing.
- Obtain connector credentials, including Product Hunt access, and document local setup.
- Implement and run the acceptance scenarios in the Phase 1 specification.

These are implementation tasks; no implementation has been started during this interview.
