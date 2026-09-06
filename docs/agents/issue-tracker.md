# Issue tracker: GitHub

Track implementation work in myr124/hackermind using the gh CLI.

- Read issue bodies, comments, and labels before working on tickets.
- Publish one GitHub issue per approved ticket, blockers first.
- Use native issue dependencies for blocking edges. If unavailable,
  list blocking issue numbers in the issue body.
- Use --body-file for multiline issue bodies.
- Tickets produced by to-tickets receive ready-for-agent.
- A ticket can start when all its blockers are closed.
- Preserve parent issues unless explicitly instructed otherwise.

PRs as a request surface: no.
