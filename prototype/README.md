# Graph and project layout — throwaway UI prototype

Question: how should a graph-centered Problem Spaces and a separate project-card Recently Added support exploration and ideation?

Accepted direction (September 8, 2026): the broad → specific → project hierarchy, inclusive matching criteria, explicit relationships, optional suggestions, circular presentation, zoom-based prominence without taxonomy collapse, and complementary graph/feed views are now recorded in [the normative Phase 1 spec](../docs/phase-1-spec.md#classification-and-graph-model). The notes below preserve the experiment history; the spec takes precedence. Highcharts, fixture category counts, force settings, and zoom thresholds remain prototype choices. Production rendering budgets and classification quality still need validation.

Hierarchy correction: broad spaces now contain the original need-based specific spaces (for example, Giving and receiving care → Care coordination → projects). Old interface-specific tool categories map into those specific spaces. Projects link to their specific memberships, with broad membership inherited through the hierarchy; duplicate direct broad links are not drawn. Subcategory labels become prominent at 1.5× zoom. This supersedes the flat 14-space experiment described below.

Latest experiment: 14 broad, need-based problem spaces replace the 93 narrow fixtures. `taxonomy.js` maps existing authored memberships to broader spaces and deduplicates them; this is not automated classification. Each space has an inclusive matching criterion shown on selection, without requiring a specific audience, technology, or interface. Multiple memberships remain intact. Projects are the explicit bridges between spaces; redundant shared-project space-to-space edges are removed. Suggested connections are off initially and can be enabled separately. This supersedes taxonomy counts and suggested-link defaults below.

Compare the original taxonomy with `?variant=A&taxonomy=legacy` (the same simplified edge policy applies). The default URL uses the broad taxonomy. This is a visual experiment, not a change to the production domain model.

Current experiment: collapsing is disabled. All subcategories and project nodes allowed by the domain and older-space filters appear immediately. Zoom changes only the camera; the expand/collapse control is removed. This temporarily supersedes the progressive-detail behavior described below.

Presentation experiment: the force layout is bounded by a disk, with children initially near their parents. Parent spaces have larger prominence circles and stronger labels. Subcategory labels appear at 1.5× and project labels at 2.4×; lower-level nodes stay present but subdued in the overview. Hover reveals the labels of direct neighbors. Project membership links are quieter until zoomed in. All 301 currently visible nodes remain present across zoom levels.

Current relationship-layout experiment:

- Problem spaces are the graph's main nodes; domains become color and filter metadata rather than central hubs.
- Replace fixed domain compartments with a layout influenced by connections. Centers emerge from connectivity rather than prescribed domain positions or a forced circular arrangement.
- Hand-authored suggested connections explain a specific shared challenge or transferable approach. A small number appear in the overview, use distinct lines, and exert weaker attraction than established relationships.
- Selecting a space reveals its own projects and explanations for its suggested connections. Following a suggestion selects the destination space and shows that space's projects; it does not merge memberships or broaden the original results.

Implemented in `graph-cards/graph.js` with Highcharts Network Graph and 20 hand-authored suggestions in the large sample. Solid lines represent subcategory relationships or shared catalog projects; dashed cyan lines represent suggestions. The suggestion toggle removes both their lines and their influence on layout. Domain filtering limits spaces and projects without creating domain nodes. Node size still represents recent prominence. Highcharts owns the force simulation and draggable nodes; the prototype adds background pan, zoom, and relationship previews around it. This reversible exploration is recorded here rather than as an architectural commitment.

Run from the repository root:

```sh
python3 prototype/serve.py
```

Open http://localhost:8765/graph-cards/?variant=A.

The default view loads 210 fictional projects across 12 domains and 93 problem spaces from `graph-cards/scale-data.js` plus the original fixtures. Compare the original 10-project sample at http://localhost:8765/graph-cards/?variant=A&dataset=small. The dataset choice carries between views. Expand subcategories and show older spaces to reveal the full graph; use zoom and drag to inspect dense clusters. Positions come from edge attraction, node repulsion, and weak common centering, without domain anchors. Distances are illustrative, not calibrated semantic similarity. This is a visual scale exercise, not a production performance benchmark.

- **A — Problem Spaces:** the graph is the main canvas, with lightweight search and a selected-space action to browse matching projects.
- **C — Recently Added:** a focused Pinterest-like image masonry feed, with no graph, sidebar, filter strip, or feed-heading chrome. Each tile keeps its title, description, and save action over the image.

Workbench was removed after review. The original graph-above-feed proposal has been replaced in this prototype by two complementary views. Selection, query, filters, and saves carry between them. Use the main navigation or the Problem Spaces's browse-projects action to switch views.

Use the top navigation to switch views. The URL retains the selected view. Selection, keyword search, graph expansion, older spaces, pan/zoom, detail panels, theme switching, and session saves work. Press `/` for search and Escape to close details.

Drag a node to reposition it and its attached edges; drag empty canvas to pan. Scroll or use a trackpad to zoom around the pointer. Below 1.6×, spaces are collapsed; at 1.6× subcategories appear; at 2.6× project diamonds appear with actual membership edges. Clicking a diamond opens the existing project details. Zooming out folds detail away. Expand subcategories manually overrides the first threshold. Domain, older-space, suggestion visibility, or mobile-breakpoint changes rebuild the force layout. Hover a node to highlight its direct neighbors and preview relationship types; click or use the chart’s keyboard navigation to select. Suggested links retain their dashed cyan appearance during highlighting. These are catalog projects (fictional sample data), not newly fetched real-world projects.

All projects, dates, and source assignments are fictional fixtures. The reference date is September 5, 2026. Counts derive from those fixtures. Search is keyword matching, not semantic retrieval. Saves live in memory; there is no account, database, ingestion, or production implementation. Highcharts, Network Graph, and Accessibility load from the official Highcharts CDN when the prototype page opens.

Mobile uses the same problem-space graph with a portrait viewport, domain filtering, zoom, and label decluttering. Selecting a space exposes its suggestions in a scrollable panel.

Each view switch logs the relevant state to the browser console. `prototypeState()` returns the same snapshot. The redundant bottom legend and floating view switcher have been removed; use the main navigation.

Verdict: the user accepted this direction for the spec. The prototype remains a working primary source in this workspace; branch and implementation-issue archival have not been performed. Rewrite validated behavior for production rather than promoting this throwaway implementation directly.

Current visual direction: Signal, based on the supplied cybernetic interface design board. Near-black (#000b0b) surfaces, warm-yellow (#ffdf38) primary actions, cyan (#00e5ff) secondary signals, cool gray text, angular borders, corner marks, and a subtle dot grid replace Gruvbox. Red (#ff2e2e) is reserved for warnings. Shared styling lives in graph-cards/signal.css; both views, the detail drawer, and fictional project illustrations use the new palette. Light mode uses cool whites with darker accessible accents. The image-led masonry layout remains the Recently Added direction.
