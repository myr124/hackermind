"use client";
import { useEffect, useRef, useState } from "react";

type Project = { id: number; name: string; description: string; publication_date: string | null };
type Term = { id: number; name: string; definition: string; explanation?: string; evidence?: string; total_count?: number };
type Detail = Project & { domains: Term[]; spaces: Term[]; technologies: Term[]; sources: { source: string; url: string; date_evidence: string | null; date_type: string; available: boolean }[] };
type Feed = { items: Project[]; next_offset: number | null; source_status: { last_success: string; coverage_note: string } | null };
const date = (value: string | null) => value ? new Date(value).toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }) : "Unknown date";

export default function Discovery() {
  const [items, setItems] = useState<Project[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [status, setStatus] = useState<Feed["source_status"]>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [light, setLight] = useState(false);
  const [spaces, setSpaces] = useState<Term[]>([]);
  const [spaceId, setSpaceId] = useState<number | null>(null);
  const [spacesError, setSpacesError] = useState(false);
  const feedRequest = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const request = useRef(0);

  async function load(offset = 0) {
    const current = ++feedRequest.current;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/projects?offset=${offset}${spaceId ? `&space_id=${spaceId}` : ""}`);
      if (!response.ok) throw new Error();
      const feed: Feed = await response.json();
      if (current !== feedRequest.current) return;
      setItems(previous => offset ? [...previous, ...feed.items.filter(p => !previous.some(old => old.id === p.id))] : feed.items);
      setNext(feed.next_offset); setStatus(feed.source_status);
    } catch { if (current === feedRequest.current) setError("Could not load projects. Check that the discovery service is running, then retry."); }
    finally { if (current === feedRequest.current) setBusy(false); }
  }
  useEffect(() => { setItems([]); setNext(null); void load(); }, [spaceId]);
  useEffect(() => { fetch("/api/spaces").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setSpaces).catch(() => setSpacesError(true)); }, []);

  async function open(project: Project) {
    opener.current = document.activeElement as HTMLElement;
    const current = ++request.current;
    setDetail(null); setDetailError("");
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    try {
      const response = await fetch(`/api/projects/${project.id}`);
      if (!response.ok) throw new Error();
      const value: Detail = await response.json();
      if (current === request.current) setDetail(value);
    } catch { if (current === request.current) setDetailError("Could not load this project. Close and try again."); }
  }
  function closed() { request.current++; document.body.style.overflow = ""; opener.current?.focus({ preventScroll: true }); }
  return <div data-theme={light ? "light" : "dark"}>
    <header><a className="brand" href="/">&gt;_ HACKERMIND</a><span>Recently Added</span><button onClick={() => setLight(!light)}>{light ? "Dark" : "Light"} theme</button></header>
    <main>
      <h1>Find your next starting point.</h1>
      <p>Real projects, recently published. Follow something that sparks your curiosity.</p>
      <p className="coverage">GitHub · {status ? `Last refreshed ${date(status.last_success)}` : "No successful refresh yet"} · Partial catalog coverage</p>
      {status && <details><summary>About this collection</summary><p>{status.coverage_note}</p><p>GitHub repository creation is used as a publication-date fallback. Uncertain classifications remain unassigned.</p></details>}
      <section aria-label="Problem spaces" className="space-browser">
        <label htmlFor="space">Browse a problem space </label>
        <select id="space" value={spaceId ?? ""} onChange={e => setSpaceId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">All spaces · Recently Added</option>
          {spaces.map(space => <option key={space.id} value={space.id}>{space.name} ({space.total_count})</option>)}
        </select>
        {spacesError && <p>Problem spaces could not be loaded. Refresh to retry.</p>}
        {spaceId && <><p>{spaces.find(s => s.id === spaceId)?.definition}</p><button onClick={() => setSpaceId(null)}>Reset to all spaces</button></>}
      </section>
      {error && <p role="alert">{error} <button onClick={() => load(items.length ? next ?? 0 : 0)}>Retry</button></p>}
      <section className="cards" aria-label="Recently published projects" aria-busy={busy}>
        {items.map(project => <article key={project.id}><button className="card" onClick={() => open(project)} aria-label={`View ${project.name}`}><span className="source">GitHub</span><h2>{project.name}</h2><p>{project.description}</p><footer><time dateTime={project.publication_date || undefined}>{date(project.publication_date)}</time><span>Repository-created fallback</span></footer></button></article>)}
      </section>
      {!busy && !error && !items.length && <p className="empty">{spaceId ? "No available projects in this space." : "No recent projects yet. Run the GitHub discovery batch to populate this collection."}</p>}
      <p role="status">{busy ? "Loading projects…" : `${items.length} projects shown`}</p>
      {next !== null && <button disabled={busy} onClick={() => load(next)}>Load more projects</button>}
    </main>
    <dialog ref={dialog} onClose={closed} aria-labelledby="detail-title" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <div className="detail"><button className="close" autoFocus onClick={() => dialog.current?.close()}>Close ×</button><h2 id="detail-title">{detail?.name || "Project details"}</h2>
        {detailError ? <p role="alert">{detailError}</p> : !detail ? <p role="status">Loading project…</p> : <><p>{detail.description}</p><h3>Publication evidence</h3><p>{date(detail.publication_date)}</p>{detail.sources.map(source => <p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">View on GitHub ↗</a><br />{source.date_type}: {date(source.date_evidence)}{!source.available && " · Source unavailable"}</p>)}
          {(["domains", "spaces", "technologies"] as const).map(kind => <section key={kind}><h3>{kind === "spaces" ? "Problem spaces" : kind === "domains" ? "Domains" : "Technologies"}</h3>{detail[kind].length ? detail[kind].map(term => <div key={term.id}><p><strong>{term.name}</strong> — {term.definition}</p><p>{term.explanation}</p><blockquote>{term.evidence}</blockquote>{kind === "spaces" && <button onClick={() => { setSpaceId(term.id); dialog.current?.close(); }}>Browse {term.name}</button>}</div>) : <p className="coverage">Not assigned</p>}</section>)}
        </>}
      </div>
    </dialog>
  </div>;
}
