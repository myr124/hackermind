from datetime import datetime, timedelta, timezone
import psycopg
import pytest
from fastapi.testclient import TestClient
from catalog.api import app
from catalog.db import connect
from catalog.github import persist
from catalog.hierarchy import store_hierarchy
from catalog.spaces import list_spaces, list_domains
from test_discovery import repo


def term(conn, name, kind="space"):
    return conn.execute("INSERT INTO terms(kind,name,definition,normalized_name) VALUES (%s,%s,%s,%s) RETURNING id", (kind,name,"Help people address " + name,name.lower())).fetchone()["id"]


def edge(conn, parent, child):
    conn.execute("INSERT INTO space_edges VALUES (%s,%s,'A narrower related need','test')", (parent,child))


def membership(conn, project, space):
    conn.execute("INSERT INTO project_terms VALUES (%s,%s,'Test membership','observations')", (project,space))


def test_diamond_counts_broad_only_unknown_dates_and_aging():
    now = datetime.now(timezone.utc)
    with connect() as c:
        root,left,right,leaf = [term(c,n) for n in ["Care","Coordination","Support","Care planning"]]
        for parent,child in [(root,left),(root,right),(left,leaf),(right,leaf)]: edge(c,parent,child)
        for n,date in [(1,now-timedelta(days=89)),(2,None),(3,now-timedelta(days=100)),(4,now-timedelta(days=2))]:
            persist(c,repo(id=n,created_at=date))
        projects = c.execute("SELECT id FROM projects ORDER BY id").fetchall()
        for p in projects[:3]: membership(c,p["id"],leaf)
        membership(c,projects[0]["id"],left)
        membership(c,projects[3]["id"],root)
        a,b = term(c,"Health","domain"),term(c,"Community","domain")
        for d in [a,b]: membership(c,projects[0]["id"],d)
        spaces = {s["id"]:s for s in list_spaces(c,now)}
        assert spaces[root]["total_count"] == 4
        assert spaces[root]["recent_count"] == 2
        assert spaces[leaf]["total_count"] == 3
        assert spaces[root]["domain_ids"] == [a,b]
        assert all(d["recent_count"] == 1 for d in list_domains(c,now))
        assert {s["id"]:s for s in list_spaces(c,now+timedelta(days=2))}[root]["recent_count"] == 1
    with TestClient(app) as client:
        feed = client.get(f"/projects?space_id={root}").json()["items"]
        assert len(feed) == 4 and feed[-1]["publication_date"] is None
        assert len({p["id"] for p in feed}) == 4
    with connect() as c:
        c.execute("UPDATE source_records SET available=false WHERE project_id=%s", (projects[0]["id"],))
        assert {s["id"]:s for s in list_spaces(c,now)}[root]["recent_count"] == 1
        c.execute("DELETE FROM project_terms WHERE project_id=%s", (projects[3]["id"],))
        assert {s["id"]:s for s in list_spaces(c,now)}[root]["total_count"] == 2


def test_cycles_and_nonspace_edges_are_rejected():
    with connect() as c:
        a,b,d = term(c,"Parent"),term(c,"Child"),term(c,"Domain","domain")
        edge(c,a,b)
        for parent,child in [(b,a),(a,a),(d,b)]:
            with pytest.raises(psycopg.Error), c.transaction(): edge(c,parent,child)


def test_generated_parent_reuse_and_uncertain_links():
    with connect() as c:
        child = term(c,"Converting documents to Markdown")
        children={child:c.execute("SELECT * FROM terms WHERE id=%s",(child,)).fetchone()}
        result={"links":[{"child_id":child,"parent_name":"Converting documents","parent_definition":"Help people change documents between formats.","explanation":"Markdown conversion is one kind of document conversion.","confidence":.95}]}
        assert store_hierarchy(c,result,children,"test") == 1
        assert store_hierarchy(c,result,children,"test") == 1
        assert c.execute("SELECT count(*) AS n FROM space_edges").fetchone()["n"] == 1
        result["links"][0]["confidence"] = .2
        assert store_hierarchy(c,result,children,"test") == 0
