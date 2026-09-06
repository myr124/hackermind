# Graph and project layout — throwaway UI prototype

Question: how should a graph-centered Problem Spaces and a separate project-card Recently Added support exploration and ideation?

Current relationship-layout experiment:

- Problem spaces are the graph's main nodes; domains become color and filter metadata rather than central hubs.
- Replace fixed domain compartments with a layout influenced by connections. Centers emerge from connectivity rather than prescribed domain positions or a forced circular arrangement.
- Hand-authored suggested connections explain a specific shared challenge or transferable approach. A small number appear in the overview, use distinct lines, and exert weaker attraction than established relationships.
- Selecting a space reveals its own projects and explanations for its suggested connections. Following a suggestion selects the destination space and shows that space's projects; it does not merge memberships or broaden the original results.

Implemented in `graph-cards/graph.js` with 20 hand-authored suggestions in the large sample. Solid lines represent subcategory relationships or shared catalog projects; dashed cyan lines represent suggestions. The suggestion toggle removes both their lines and their influence on layout. Domain filtering limits spaces and projects without creating domain nodes. Node size still represents recent prominence. Overlapping labels are hidden until hover/focus or until zoom provides room. This reversible exploration is recorded here rather than as an architectural commitment.

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

Drag a node to reposition it and its attached edges; drag empty canvas to pan. Scroll or use a trackpad to zoom around the pointer. Below 1.6×, spaces are collapsed; at 1.6× subcategories appear; at 2.6× project diamonds appear with actual membership edges. Clicking a diamond opens the existing project details. Zooming out folds detail away; existing anchors and cached child positions stay fixed. Expand subcategories manually overrides the first threshold. Domain, older-space, suggestion visibility, or mobile-breakpoint changes rebuild the layout. Hover or keyboard-focus a node to highlight its direct neighbors and preview relationship types; click or press Enter to select. Dragging does not select a node. Suggested links retain their dashed cyan appearance during highlighting. These are catalog projects (fictional sample data), not newly fetched real-world projects.

All projects, dates, and source assignments are fictional fixtures. The reference date is September 5, 2026. Counts derive from those fixtures. Search is keyword matching, not semantic retrieval. Saves live in memory; there is no account, database, ingestion, or production implementation. No external assets or packages are required.

Mobile uses the same problem-space graph with a portrait viewport, domain filtering, zoom, and label decluttering. Selecting a space exposes its suggestions in a scrollable panel.

Each view switch logs the relevant state to the browser console. `prototypeState()` returns the same snapshot. The redundant bottom legend and floating view switcher have been removed; use the main navigation.

Verdict pending visual review. Keep the full prototype as a primary source on a `prototype/graph-cards` branch once a direction is chosen, and link its verdict from the implementation issue. Rewrite validated behavior for production rather than promoting this throwaway implementation directly.

Current visual direction: Signal, based on the supplied cybernetic interface design board. Near-black (#000b0b) surfaces, warm-yellow (#ffdf38) primary actions, cyan (#00e5ff) secondary signals, cool gray text, angular borders, corner marks, and a subtle dot grid replace Gruvbox. Red (#ff2e2e) is reserved for warnings. Shared styling lives in graph-cards/signal.css; both views, the detail drawer, and fictional project illustrations use the new palette. Light mode uses cool whites with darker accessible accents. The image-led masonry layout remains the Recently Added direction.
