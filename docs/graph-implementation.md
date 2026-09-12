# Discovery graph implementation

Ticket #8 implements the accepted constellation direction using pinned Sigma.js 3.0.3, Graphology 0.26.0, and the Sigma square-node program 3.0.0. The fictional Highcharts prototype remains separate. The normative behavior is in [the Phase 1 spec](phase-1-spec.md); its no-collapse decision supersedes ADR 0001's earlier reference to collapsed endpoints.

## Behavior

Problem Spaces is the initial view. Large circles represent broad spaces, smaller circles represent narrower spaces, and squares represent projects. Space sizes include distinct recent descendant counts. Zoom increases lower-level prominence and reveals labels without removing taxonomy nodes or restarting the layout. Hover and the keyboard node chooser expose labels that collision handling suppresses.

A deterministic, finite force layout starts roots around a circle and places related children/projects nearby, then constrains positions to a disk. It runs once per payload; no simulation runs while interacting. Pan, zoom, Fit, and mouse node dragging are supported. Arrow keys pan the focused canvas; +/− zoom. The accessible node chooser centers a node and offers selection without requiring precise pointer targeting. If WebGL fails, the node chooser and conventional space browser remain available.

Only hierarchy and actual membership edges are drawn. An ancestor membership is omitted when that project has a more specific visible assignment; independent memberships remain explicit bridges. Selecting a node traces its direct connections and lists their types and explanations. Spaces show criteria, recent/total counts, and an action to browse descendant projects. Reset clears space selection. Domain and technology selectors filter the loaded graph; they are metadata, never graph hubs. Domain color has a text legend; multiple-domain nodes use the selected domain or lowest-ID assignment, without implying exclusive membership. Counts describe the full matching catalog, not the filtered canvas.

The renderer stays mounted across Problem Spaces/Recently Added switches. Camera, dragged positions, graph filters, selected space, feed position, and project-detail return state are retained. Show older spaces reveals zero-recent spaces. Suggested connections are absent/off; no inferred similarity or shared-project space edges are manufactured. A future suggested layer must use dashed, explained edges and leave counts/memberships unchanged.

## Rendering boundaries

`GET /graph` returns at most 200 spaces and 400 projects, with explicit edges between loaded endpoints. Spaces prioritize recent then total counts; projects prioritize publication date. `GET /graph?space_id=…` prioritizes the requested space, its ancestors, and descendants within the same budgets. The conventional space browser can load a selected space outside the initial graph. Cached positions survive overlapping payloads. This is explicit focus loading, not taxonomy collapse or automatic camera-driven fetching.

`GET /spaces` and paginated `GET /projects?space_id=…` remain independent of rendering budgets. The bounded-view notice directs users to full catalog browsing; eligible unclassified projects remain in the feed. Natural-language retrieval and combined catalog-wide filter semantics belong to #9. Graph-local filters are retained when switching views but do not silently constrain the date feed.

These limits bound nodes rather than claiming exhaustive ecosystem coverage. Dense multi-membership graphs can contain more edges than the sparse performance fixture. Full physical-device profiling and broader catalog/classifier quality checks remain part of #14/#15.

## Verification — September 12, 2026

- 48 backend tests pass. Fixtures cover redundant ancestor suppression, independent membership bridges, inherited filter metadata, unavailable sources, loading outside the initial space budget, and the final page of a 10,000-project catalog. The bounded graph query took 36 ms locally and returned 401 nodes for that fixture.
- Production build and TypeScript checks pass.
- The deterministic 600-node layout fixture verifies finite disk-constrained coordinates, repeatability, no boundary pileup, and a two-second ceiling. The local run took 186 ms.
- Browser checks exercise the real classified graph, zoom without collapse, selection/reset, descendant cards and details, camera preservation, light/dark themes, keyboard exploration, mobile resizing, node dragging, and a 600-node fixture under 4× CPU throttling. The 600-node fixture became ready in 1.1 seconds. This is desktop Chromium simulation, not a physical midrange-phone measurement.

Run with the backend, frontend, and local database available:

```sh
cd backend
uv run pytest -q
cd ../web
pnpm build
# Native TypeScript loading requires Node 22.18+:
node scripts/graph-layout-check.mjs
BASE_URL=http://127.0.0.1:3001 CHROMIUM_PATH=/usr/bin/chromium node scripts/browser-check.mjs
BASE_URL=http://127.0.0.1:3001 CHROMIUM_PATH=/usr/bin/chromium node scripts/graph-browser-check.mjs
```

The real graph reflects the small hosted classification sample; it does not imply that every ingested repository has been classified. See [classification review](classification-review.md) and [hierarchy review](hierarchy-implementation.md).
