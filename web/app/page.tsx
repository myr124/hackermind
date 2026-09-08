"use client";
import { useEffect, useRef, useState } from "react";

type Project = { id: number; name: string; description: string; publication_date: string | null };
type Detail = Project & { sources: { source: string; url: string; date_evidence: string | null; date_type: string; available: boolean }[] };
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
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const request = useRef(0);

  async function load(offset = 0) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/projects?offset=${offset}`);
      if (!response.ok) throw new Error();
      const feed: Feed = await response.json();
      setItems(previous => offset ? [...previous, ...feed.items.filter(p => !previous.some(old => old.id === p.id))] : feed.items);
      setNext(feed.next_offset); setStatus(feed.source_status);
    } catch { setError("Could not load projects. Check that the discovery service is running, then retry."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);

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
      {status && <details><summary>About this collection</summary><p>{status.coverage_note}</p><p>GitHub repository creation is used as a publication-date fallback. Classification is not yet assigned.</p></details>}
      {error && <p role="alert">{error} <button onClick={() => load(items.length ? next ?? 0 : 0)}>Retry</button></p>}
      <section className="cards" aria-label="Recently published projects" aria-busy={busy}>
        {items.map(project => <article key={project.id}><button className="card" onClick={() => open(project)} aria-label={`View ${project.name}`}><span className="source">GitHub</span><h2>{project.name}</h2><p>{project.description}</p><footer><time dateTime={project.publication_date || undefined}>{date(project.publication_date)}</time><span>Repository-created fallback</span></footer></button></article>)}
      </section>
      {!busy && !error && !items.length && <p className="empty">No recent projects yet. Run the GitHub discovery batch to populate this collection.</p>}
      <p role="status">{busy ? "Loading projects…" : `${items.length} projects shown`}</p>
      {next !== null && <button disabled={busy} onClick={() => load(next)}>Load more projects</button>}
    </main>
    <dialog ref={dialog} onClose={closed} aria-labelledby="detail-title" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <div className="detail"><button className="close" autoFocus onClick={() => dialog.current?.close()}>Close ×</button><h2 id="detail-title">{detail?.name || "Project details"}</h2>
        {detailError ? <p role="alert">{detailError}</p> : !detail ? <p role="status">Loading project…</p> : <><p>{detail.description}</p><h3>Publication evidence</h3><p>{date(detail.publication_date)}</p>{detail.sources.map(source => <p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">View on GitHub ↗</a><br />{source.date_type}: {date(source.date_evidence)}{!source.available && " · Source unavailable"}</p>)}<p className="coverage">Problem spaces and technologies have not been assigned yet.</p></>}
      </div>
    </dialog>
  </div>;
}
