# Graph and project layout — throwaway UI prototype

Question: how should a graph-centered Problem Spaces and a separate project-card Recently Added support exploration and ideation?

Run from the repository root:

```sh
python3 prototype/serve.py
```

Open http://localhost:8765/graph-cards/?variant=A.

- **A — Problem Spaces:** the graph is the main canvas, with lightweight search and a selected-space action to browse matching projects.
- **C — Recently Added:** a domain index and Pinterest-like masonry cards, with no graph.

Workbench was removed after review. The original graph-above-feed proposal has been replaced in this prototype by two complementary views. Selection, query, filters, and saves carry between them. Use the main navigation or the Problem Spaces's browse-projects action to switch views.

The floating bottom bar and left/right arrows outside text inputs also switch views. The URL retains the selected view. Selection, keyword search, technology filters, graph expansion, older spaces, pan/zoom, detail panels, theme switching, and session saves work. Press `/` for search and Escape to close details.

All projects, dates, and source assignments are fictional fixtures. The reference date is September 5, 2026. Counts derive from those fixtures. Search is keyword matching, not semantic retrieval. Saves live in memory; there is no account, database, ingestion, or production implementation. No external assets or packages are required.

On mobile, the graph initially shows domains and reveals the selected node's nearby spaces to keep labels readable. This is a prototype proposal for progressive disclosure, not a newly finalized product requirement.

The floating bar surfaces a state summary; each variant switch logs the full relevant state to the browser console. `prototypeState()` returns the same snapshot. `NODE_ENV=production` hides/disables the prototype switcher.

Verdict pending visual review. Keep the full prototype as a primary source on a `prototype/graph-cards` branch once a direction is chosen, and link its verdict from the implementation issue. Rewrite validated behavior for production rather than promoting this throwaway implementation directly.

Palette refinement: UI surfaces now use the classic Gruvbox medium-dark palette (#282828, #3c3836, #504945), cream foregrounds, and canonical bright accents. Light mode uses its light backgrounds and faded accents. Reference: https://github.com/morhetz/gruvbox/blob/master/colors/gruvbox.vim

Latest palette choice: Gruvbox hard dark (#1d2021 background, #282828 panels, #3c3836 raised surfaces). UI emphasis uses orange (#fe8019 dark / #af3a03 light), including active navigation, selected controls, and focus rings. Graph domain colors remain distinct.
