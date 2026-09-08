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
def projects(offset: int = Query(0, ge=0), limit: int = Query(24, ge=1, le=100)):
    now = datetime.now(timezone.utc)
    with connect() as conn:
        rows = conn.execute("""SELECT p.* FROM projects p
            WHERE eligible AND publication_date BETWEEN %s AND %s
            AND EXISTS (SELECT 1 FROM source_records s WHERE s.project_id=p.id AND s.available)
            ORDER BY publication_date DESC, id DESC LIMIT %s OFFSET %s""",
            (now-timedelta(days=90), now, limit+1, offset)).fetchall()
        status = conn.execute("SELECT last_success,coverage_note FROM discovery_checkpoint WHERE source='github'").fetchone()
    return {"items": rows[:limit], "next_offset": offset+limit if len(rows)>limit else None, "source_status": status}


@app.get("/projects/{project_id}")
def detail(project_id: int):
    with connect() as conn:
        project = conn.execute("SELECT * FROM projects WHERE id=%s", (project_id,)).fetchone()
        if not project:
            raise HTTPException(404, "Project not found")
        project["sources"] = conn.execute("SELECT source,url,date_evidence,date_type,available FROM source_records WHERE project_id=%s", (project_id,)).fetchall()
    return {**project, "domains": [], "spaces": [], "technologies": []}
