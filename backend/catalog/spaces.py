"""Hierarchy-aware discovery queries; counts always reflect current availability and time."""
from datetime import datetime, timedelta, timezone

REACH = """WITH RECURSIVE reach(ancestor,descendant) AS (
    SELECT id,id FROM terms WHERE kind='space'
    UNION SELECT r.ancestor,e.child_id FROM reach r JOIN space_edges e ON e.parent_id=r.descendant
) """


def list_spaces(conn, now=None):
    now = now or datetime.now(timezone.utc)
    return conn.execute(REACH + """SELECT t.*,count(DISTINCT p.id) AS total_count,
        count(DISTINCT p.id) FILTER (WHERE p.publication_date BETWEEN %s AND %s) AS recent_count,
        ARRAY(SELECT parent_id FROM space_edges WHERE child_id=t.id ORDER BY parent_id) AS parent_ids,
        ARRAY(SELECT child_id FROM space_edges WHERE parent_id=t.id ORDER BY child_id) AS child_ids,
        ARRAY(SELECT DISTINCT dt.term_id FROM reach dr JOIN project_terms dp ON dp.term_id=dr.descendant
              JOIN projects project ON project.id=dp.project_id AND project.eligible
              JOIN project_terms dt ON dt.project_id=project.id JOIN terms domain ON domain.id=dt.term_id AND domain.kind='domain'
              WHERE dr.ancestor=t.id AND EXISTS(SELECT 1 FROM source_records s WHERE s.project_id=project.id AND s.available)
              ORDER BY dt.term_id) AS domain_ids
        FROM terms t JOIN reach r ON r.ancestor=t.id
        LEFT JOIN project_terms pt ON pt.term_id=r.descendant
        LEFT JOIN projects p ON p.id=pt.project_id AND p.eligible
            AND EXISTS(SELECT 1 FROM source_records s WHERE s.project_id=p.id AND s.available)
        WHERE t.kind='space' GROUP BY t.id HAVING count(DISTINCT p.id)>0
        ORDER BY recent_count DESC,total_count DESC,t.name""", (now-timedelta(days=90), now)).fetchall()


def list_domains(conn, now=None):
    now = now or datetime.now(timezone.utc)
    return conn.execute("""SELECT t.id,t.name,t.definition,count(DISTINCT p.id) AS total_count,
        count(DISTINCT p.id) FILTER (WHERE p.publication_date BETWEEN %s AND %s) AS recent_count
        FROM terms t JOIN project_terms pt ON pt.term_id=t.id JOIN projects p ON p.id=pt.project_id
        WHERE t.kind='domain' AND p.eligible AND EXISTS(SELECT 1 FROM source_records s WHERE s.project_id=p.id AND s.available)
        GROUP BY t.id ORDER BY recent_count DESC,total_count DESC,t.name""", (now-timedelta(days=90), now)).fetchall()
