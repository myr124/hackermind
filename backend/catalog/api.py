from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Query

from .db import connect, migrate


@asynccontextmanager
async def lifespan(app):
    migrate()
    yield


app = FastAPI(title="Hackermind discovery", lifespan=lifespan)


@app.get("/projects")
def projects(offset: int = Query(0, ge=0), limit: int = Query(24, ge=1, le=100), space_id: int | None = Query(None, ge=1)):
    now = datetime.now(timezone.utc)
    with connect() as conn:
        if space_id is not None and not conn.execute("SELECT id FROM terms WHERE id=%s AND kind='space'", (space_id,)).fetchone():
            raise HTTPException(404, "Problem space not found")
        rows = conn.execute("""SELECT p.* FROM projects p
            WHERE eligible AND ((%s::bigint IS NULL AND publication_date BETWEEN %s AND %s)
                OR (%s::bigint IS NOT NULL AND (publication_date IS NULL OR publication_date<=%s)))
            AND EXISTS (SELECT 1 FROM source_records s WHERE s.project_id=p.id AND s.available)
            AND (%s::bigint IS NULL OR EXISTS (SELECT 1 FROM project_terms pt WHERE pt.project_id=p.id AND pt.term_id=%s))
            ORDER BY publication_date DESC NULLS LAST, id DESC LIMIT %s OFFSET %s""",
            (space_id, now-timedelta(days=90), now, space_id, now, space_id, space_id, limit+1, offset)).fetchall()
        status = conn.execute("SELECT last_success,coverage_note FROM discovery_checkpoint WHERE source='github'").fetchone()
    return {"items": rows[:limit], "next_offset": offset+limit if len(rows)>limit else None, "source_status": status}


@app.get("/spaces")
def spaces():
    with connect() as conn:
        return conn.execute("""SELECT t.*, count(DISTINCT p.id) AS total_count FROM terms t
            LEFT JOIN project_terms pt ON pt.term_id=t.id
            LEFT JOIN projects p ON p.id=pt.project_id AND p.eligible
                AND EXISTS (SELECT 1 FROM source_records s WHERE s.project_id=p.id AND s.available)
            WHERE t.kind='space' GROUP BY t.id HAVING count(DISTINCT p.id)>0 ORDER BY total_count DESC,t.name""").fetchall()


@app.get("/projects/{project_id}")
def detail(project_id: int):
    with connect() as conn:
        project = conn.execute("SELECT * FROM projects WHERE id=%s", (project_id,)).fetchone()
        if not project:
            raise HTTPException(404, "Project not found")
        project["sources"] = conn.execute("SELECT source,url,date_evidence,date_type,available FROM source_records WHERE project_id=%s", (project_id,)).fetchall()
        assignments = conn.execute("""SELECT t.id,t.kind,t.name,t.definition,pt.explanation,pt.evidence
            FROM project_terms pt JOIN terms t ON t.id=pt.term_id WHERE pt.project_id=%s ORDER BY t.kind,t.name""", (project_id,)).fetchall()
    return {**project, **{key: [term for term in assignments if term["kind"] == kind] for key, kind in [("domains", "domain"), ("spaces", "space"), ("technologies", "technology")]}}
