from datetime import datetime, timedelta, timezone
import os
import uuid

import httpx
import psycopg
import pytest
from fastapi.testclient import TestClient

from catalog.api import app
from catalog.db import connect, migrate
from catalog.github import eligible, ingest, persist


@pytest.fixture(autouse=True)
def isolated_schema(monkeypatch):
    # Dedicated temporary schema: never truncate the developer's catalog.
    schema = "test_" + uuid.uuid4().hex
    with connect() as conn:
        conn.execute(psycopg.sql.SQL("CREATE SCHEMA {}").format(psycopg.sql.Identifier(schema)))
    previous = os.environ.get("PGOPTIONS", "")
    monkeypatch.setenv("PGOPTIONS", f"-c search_path={schema},public")
    migrate()
    yield
    monkeypatch.setenv("PGOPTIONS", previous)
    with connect() as conn:
        conn.execute(psycopg.sql.SQL("DROP SCHEMA {} CASCADE").format(psycopg.sql.Identifier(schema)))


def repo(id=1, days=1, **extra):
    return {"id": id, "name": f"project-{id}", "description": "An application for recording field observations", "html_url": f"https://github.com/example/project-{id}", "created_at": (datetime.now(timezone.utc)-timedelta(days=days)).isoformat(), **extra}


def test_idempotence_dates_and_details():
    with connect() as conn:
        persist(conn, repo())
        persist(conn, repo(description="Updated description"))
        persist(conn, repo(id=2, days=120))
        persist(conn, repo(id=3, created_at=None))
        persist(conn, repo(id=4, days=2))
        assert conn.execute("SELECT count(*) AS n FROM projects").fetchone()["n"] == 4
        assert conn.execute("SELECT count(*) AS n FROM source_records").fetchone()["n"] == 4
    with TestClient(app) as client:
        feed = client.get("/projects?limit=1").json()
        assert [p["name"] for p in feed["items"]] == ["project-1"]
        assert feed["next_offset"] == 1
        assert [p["name"] for p in client.get("/projects?offset=1").json()["items"]] == ["project-4"]
        detail = client.get(f"/projects/{feed['items'][0]['id']}").json()
        assert detail["description"] == "Updated description"
        assert detail["sources"][0]["date_type"] == "repository-created fallback"
        assert detail["spaces"] == []
        assert client.get("/projects/999999").status_code == 404
        assert client.get("/projects?limit=1000").status_code == 422


def test_eligibility():
    assert eligible(repo())
    for bad in [repo(is_template=True), repo(fork=True), repo(description=None), repo(name="awesome-projects"), repo(description="A tutorial on Python"), repo(description="Starter template")]:
        assert not eligible(bad)


def test_checkpoint_resume_and_retry():
    calls = []
    def respond(request):
        page = int(request.url.params["page"])
        calls.append(page)
        assert "stars:" not in request.url.params["q"]
        assert request.url.params["sort"] == "stars"
        assert request.url.params["order"] == "desc"
        today = datetime.now(timezone.utc).date()
        assert f"created:{today-timedelta(days=90)}..{today}" in request.url.params["q"]
        return httpx.Response(200, json={"items": [repo(id=n) for n in range((page-1)*100, page*100)], "total_count": 300, "incomplete_results": False})
    ingest(1, client=httpx.Client(transport=httpx.MockTransport(respond)))
    ingest(1, client=httpx.Client(transport=httpx.MockTransport(respond)))
    assert calls == [1, 2]
    def fail(request):
        return httpx.Response(403, json={"message": "rate limit"})
    with pytest.raises(httpx.HTTPStatusError):
        ingest(1, client=httpx.Client(transport=httpx.MockTransport(fail)))
    with connect() as conn:
        assert conn.execute("SELECT next_page FROM discovery_checkpoint").fetchone()["next_page"] == 3
        assert conn.execute("SELECT count(*) AS n FROM projects").fetchone()["n"] == 200


def test_incomplete_search_saves_records_without_skipping_page():
    def partial(request):
        assert request.url.params["page"] == "1"
        return httpx.Response(200, json={"items": [repo()], "total_count": 5000, "incomplete_results": True})
    for _ in range(2):
        result = ingest(1, client=httpx.Client(transport=httpx.MockTransport(partial)))
        assert not result["complete"]
    with connect() as conn:
        checkpoint = conn.execute("SELECT * FROM discovery_checkpoint").fetchone()
        assert checkpoint["next_page"] == 1
        assert "incomplete" in checkpoint["coverage_note"]
        assert conn.execute("SELECT count(*) AS n FROM projects").fetchone()["n"] == 1


def test_changed_discovery_policy_restarts_pagination_preserving_projects():
    with connect() as conn:
        persist(conn, repo(id=99))
        conn.execute("""INSERT INTO discovery_checkpoint(source,window_start,window_end,next_page,complete)
            VALUES ('github',CURRENT_DATE-90,CURRENT_DATE,8,true)""")
    def respond(request):
        assert request.url.params["page"] == "1"
        assert request.url.params["sort"] == "stars"
        return httpx.Response(200, json={"items": [repo()], "total_count": 1})
    ingest(1, client=httpx.Client(transport=httpx.MockTransport(respond)))
    with connect() as conn:
        assert conn.execute("SELECT count(*) AS n FROM projects").fetchone()["n"] == 2
        assert conn.execute("SELECT discovery_policy FROM discovery_checkpoint").fetchone()["discovery_policy"] == "stars-90-days-v1"


def test_eligibility_recheck_preserves_sources_and_hides_exclusions():
    from catalog.eligibility import recheck
    with connect() as conn:
        persist(conn, repo())
        persist(conn, repo(id=2, description="Profile README"))
        conn.execute("UPDATE projects SET eligible=true")
    excluded = recheck()
    assert len(excluded) == 1
    with TestClient(app) as client:
        assert len(client.get("/projects").json()["items"]) == 1
        detail = client.get(f"/projects/{excluded[0]['id']}").json()
        assert not detail["eligible"]
        assert detail["sources"][0]["available"]
