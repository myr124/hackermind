import pytest
from fastapi.testclient import TestClient
from catalog.api import app
from catalog.classification import classify_batch, store_classification
from catalog.db import connect
from catalog.github import persist
from test_discovery import repo


def assignment(**extra):
    return {"kind": "space", "name": "Recording observations", "definition": "Help people capture and retain observations.", "explanation": "This application records field observations.", "evidence": "recording field observations", "confidence": .95, **extra}


def test_reuse_new_space_and_uncertainty():
    with connect() as conn:
        persist(conn, repo())
        persist(conn, repo(id=2))
        persist(conn, repo(id=3))
    calls = []
    def generate(messages):
        calls.append(messages)
        if len(calls) == 3:
            return {"assignments": [assignment(name="Uncertain need", confidence=.4)]}
        return {"assignments": [assignment(name="Recording observations" if len(calls) == 1 else "RECORDING OBSERVATIONS")]}
    assert classify_batch(generate, "test-model") == 3
    assert "Recording observations" in calls[1][1]["content"]
    assert classify_batch(generate, "test-model") == 0
    with connect() as conn:
        assert conn.execute("SELECT count(*) AS n FROM terms").fetchone()["n"] == 1
        assert conn.execute("SELECT count(*) AS n FROM project_terms").fetchone()["n"] == 2
        assert conn.execute("SELECT count(*) AS n FROM classification_runs").fetchone()["n"] == 3


def test_reprocessing_and_distinct_kinds():
    with connect() as conn:
        persist(conn, repo())
    def generate(_):
        return {"assignments": [assignment(), assignment(kind="domain", name="Field research"), assignment(kind="technology", name="Observation recording")]}
    classify_batch(generate, "test-model")
    with connect() as conn:
        assert conn.execute("SELECT count(DISTINCT kind) AS n FROM terms").fetchone()["n"] == 3
    classify_batch(lambda _: {"assignments": []}, "test-model", reprocess=True)
    with connect() as conn:
        assert conn.execute("SELECT count(*) AS n FROM project_terms").fetchone()["n"] == 0


def test_invalid_evidence_does_not_replace_existing_assignments():
    with connect() as conn:
        persist(conn, repo())
    classify_batch(lambda _: {"assignments": [assignment()]}, "test-model")
    with pytest.raises(ValueError, match="evidence"):
        classify_batch(lambda _: {"assignments": [assignment(evidence="invented healthcare functionality")]}, "test-model", reprocess=True)
    with connect() as conn:
        assert conn.execute("SELECT count(*) AS n FROM project_terms").fetchone()["n"] == 1


def test_ineligible_and_changed_projects_are_not_classified():
    with connect() as conn:
        persist(conn, repo(description="Profile README"))
    assert classify_batch(lambda _: pytest.fail("Ineligible project reached model"), "test-model") == 0
    with connect() as conn:
        persist(conn, repo())
        before = conn.execute("SELECT * FROM projects").fetchone()
        conn.execute("UPDATE projects SET description='Changed metadata'")
        with pytest.raises(ValueError, match="changed"):
            store_classification(conn, before, {"assignments": [assignment()]}, "test-model")


def test_space_browsing_and_detail_assignments_include_unknown_dates():
    with connect() as conn:
        persist(conn, repo())
        persist(conn, repo(id=2, created_at=None))
        persist(conn, repo(id=3, days=120))
    classify_batch(lambda _: {"assignments": [assignment()]}, "test-model")
    with TestClient(app) as client:
        space = client.get("/spaces").json()[0]
        assert space["total_count"] == 3
        feed = client.get(f"/projects?space_id={space['id']}").json()
        assert [p["name"] for p in feed["items"]] == ["project-1", "project-3", "project-2"]
        assert len(client.get("/projects").json()["items"]) == 1
        detail = client.get(f"/projects/{feed['items'][0]['id']}").json()
        assert detail["spaces"][0]["evidence"] == "recording field observations"
        assert client.get("/projects?space_id=999999").status_code == 404


def test_metadata_change_invalidates_assignments_and_schedules_reclassification():
    with connect() as conn:
        persist(conn, repo())
    classify_batch(lambda _: {"assignments": [assignment()]}, "test-model")
    with connect() as conn:
        persist(conn, repo(description="A library for rendering diagrams"))
        assert conn.execute("SELECT count(*) AS n FROM project_terms").fetchone()["n"] == 0
    assert classify_batch(lambda _: {"assignments": []}, "test-model") == 1
