"""Bounded rendering payload; full browsing remains available through catalog endpoints."""
from .spaces import REACH, list_spaces

SPACE_BUDGET = 200
PROJECT_BUDGET = 400


def graph_payload(conn, focus=None):
    spaces = list_spaces(conn)
    priority = set()
    if focus:
        priority = {r["descendant"] for r in conn.execute(REACH + "SELECT descendant FROM reach WHERE ancestor=%s UNION SELECT ancestor FROM reach WHERE descendant=%s", (focus,focus))}
    spaces.sort(key=lambda s: (s["id"] != focus, s["id"] not in priority, -s["recent_count"], -s["total_count"], s["id"]))
    visible = spaces[:SPACE_BUDGET]
    ids = [s["id"] for s in visible]
    projects = conn.execute("""SELECT DISTINCT p.* FROM projects p JOIN project_terms pt ON pt.project_id=p.id
        WHERE pt.term_id=ANY(%s) AND p.eligible
        AND EXISTS(SELECT 1 FROM source_records s WHERE s.project_id=p.id AND s.available)
        ORDER BY p.publication_date DESC NULLS LAST,p.id DESC LIMIT %s""", (ids,PROJECT_BUDGET+1)).fetchall()
    more_projects = len(projects)>PROJECT_BUDGET
    projects = projects[:PROJECT_BUDGET]
    pids = [p["id"] for p in projects]
    project_domains, project_technologies, space_technologies = {}, {}, {}
    for row in conn.execute("SELECT pt.project_id,pt.term_id,t.kind FROM project_terms pt JOIN terms t ON t.id=pt.term_id WHERE pt.project_id=ANY(%s) AND t.kind IN ('domain','technology')", (pids,)):
        target = project_domains if row["kind"] == "domain" else project_technologies
        target.setdefault(row["project_id"], []).append(row["term_id"])
    for row in conn.execute(REACH + """SELECT DISTINCT r.ancestor,tech.term_id FROM reach r
        JOIN project_terms member ON member.term_id=r.descendant
        JOIN projects p ON p.id=member.project_id AND p.eligible
        JOIN project_terms tech ON tech.project_id=p.id
        JOIN terms t ON t.id=tech.term_id AND t.kind='technology'
        WHERE r.ancestor=ANY(%s) AND EXISTS(SELECT 1 FROM source_records s WHERE s.project_id=p.id AND s.available)""", (ids,)):
        space_technologies.setdefault(row["ancestor"], []).append(row["term_id"])
    technology_ids = sorted({t for values in space_technologies.values() for t in values})
    technologies = conn.execute("SELECT id,name FROM terms WHERE id=ANY(%s) ORDER BY name", (technology_ids,)).fetchall()
    membership = conn.execute(REACH + """SELECT pt.project_id,pt.term_id,pt.explanation FROM project_terms pt
        WHERE pt.project_id=ANY(%s) AND pt.term_id=ANY(%s)
        AND NOT EXISTS(SELECT 1 FROM project_terms deeper JOIN reach r ON r.descendant=deeper.term_id
            WHERE deeper.project_id=pt.project_id AND r.ancestor=pt.term_id AND r.descendant<>r.ancestor
            AND deeper.term_id=ANY(%s))""", (pids,ids,ids)).fetchall()
    nodes = [{"id":f"s:{s['id']}","kind":"space","entity_id":s["id"],"label":s["name"],"description":s["definition"],"recent":s["recent_count"],"total":s["total_count"],"parents":[f"s:{i}" for i in s["parent_ids"]],"domains":s["domain_ids"],"technologies":space_technologies.get(s["id"],[])} for s in visible]
    nodes += [{"id":f"p:{p['id']}","kind":"project","entity_id":p["id"],"label":p["name"],"description":p["description"],"recent":0,"total":0,"parents":[],"domains":project_domains.get(p["id"],[]),"technologies":project_technologies.get(p["id"],[])} for p in projects]
    edges = [{"source":f"s:{e['parent_id']}","target":f"s:{e['child_id']}","kind":"subcategory","explanation":e["explanation"]} for e in conn.execute("SELECT * FROM space_edges WHERE parent_id=ANY(%s) AND child_id=ANY(%s)", (ids,ids))]
    edges += [{"source":f"s:{m['term_id']}","target":f"p:{m['project_id']}","kind":"membership","explanation":m["explanation"]} for m in membership]
    return {"technologies":technologies,"nodes":nodes,"edges":edges,"bounded":len(spaces)>SPACE_BUDGET or more_projects,"total_spaces":len(spaces),"space_budget":SPACE_BUDGET,"project_budget":PROJECT_BUDGET}
