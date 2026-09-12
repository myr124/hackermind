from time import perf_counter
from fastapi.testclient import TestClient
from catalog.api import app
from catalog.db import connect
from catalog.graph import graph_payload, PROJECT_BUDGET, SPACE_BUDGET
from catalog.github import persist
from test_hierarchy import term, edge, membership
from test_discovery import repo


def test_graph_preserves_bridges_without_redundant_ancestor_edges():
    with connect() as c:
        root,child,other = [term(c,n) for n in ["Broad need","Specific need","Independent need"]]
        edge(c,root,child)
        persist(c,repo())
        p=c.execute("SELECT id FROM projects").fetchone()["id"]
        for s in [root,child,other]:membership(c,p,s)
        data=graph_payload(c)
        links={(e["source"],e["target"],e["kind"]) for e in data["edges"]}
        assert links == {(f"s:{root}",f"s:{child}","subcategory"),(f"s:{child}",f"p:{p}","membership"),(f"s:{other}",f"p:{p}","membership")}
        assert len([n for n in data["nodes"] if n["kind"]=="project"])==1
        c.execute("UPDATE source_records SET available=false")
        assert graph_payload(c)["nodes"]==[]


def test_graph_filter_metadata_inherits_spaces_but_not_unrelated_projects():
    with connect() as c:
        root, child = term(c,"Broad"), term(c,"Specific")
        edge(c,root,child)
        persist(c,repo())
        p=c.execute("SELECT id FROM projects").fetchone()["id"]
        membership(c,p,child)
        ids={}
        for kind in ["domain","technology"]:
            ids[kind]=c.execute("INSERT INTO terms(kind,name,normalized_name,definition) VALUES(%s,%s,%s,'Criterion') RETURNING id",(kind,kind,kind)).fetchone()["id"]
            membership(c,p,ids[kind])
        data=graph_payload(c)
        assert {n["kind"] for n in data["nodes"]} == {"space","project"}
        for node in data["nodes"]:
            assert node["domains"] == [ids["domain"]]
            assert node["technologies"] == [ids["technology"]]
        assert data["technologies"] == [{"id":ids["technology"],"name":"technology"}]


def test_ten_thousand_projects_remain_browsable_with_bounded_graph():
    with connect() as c:
        s=term(c,"Recording observations")
        c.execute("""INSERT INTO projects(canonical_key,name,description,publication_date)
            SELECT 'scale:'||n,'Project '||n,'Record field observations',now()-interval '1 day'
            FROM generate_series(1,10000) n""")
        c.execute("""INSERT INTO source_records(project_id,source,source_id,url,date_evidence,date_type)
            SELECT id,'fixture',id::text,'https://example.com/'||id,publication_date,'fixture' FROM projects""")
        c.execute("INSERT INTO project_terms SELECT id,%s,'Records observations','observations' FROM projects",(s,))
        started=perf_counter();data=graph_payload(c);elapsed=perf_counter()-started
        assert data["bounded"]
        assert len([n for n in data["nodes"] if n["kind"]=="project"])==PROJECT_BUDGET
        assert data["nodes"][0]["total"]==10000
        assert elapsed<5, f"Bounded graph query took {elapsed:.2f}s"
        print(f"10,000-project graph query: {elapsed:.3f}s; {len(data['nodes'])} nodes")
    with TestClient(app) as client:
        last=client.get(f"/projects?space_id={s}&offset=9900&limit=100").json()
        assert len(last["items"])==100 and last["next_offset"] is None


def test_focus_can_load_a_space_outside_initial_budget():
    with connect() as c:
        persist(c,repo())
        p=c.execute("SELECT id FROM projects").fetchone()["id"]
        for n in range(SPACE_BUDGET+1):
            last=term(c,f"Space {n}");membership(c,p,last)
        initial=graph_payload(c)
        assert f"s:{last}" not in {n["id"] for n in initial["nodes"]}
        focused=graph_payload(c,last)
        assert focused["bounded"] and f"s:{last}" in {n["id"] for n in focused["nodes"]}
