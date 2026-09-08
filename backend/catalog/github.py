"""Bounded GitHub discovery. Conservative eligibility rules are intentionally inspectable."""
import argparse
from datetime import datetime, timedelta, timezone
import os

import httpx

from .db import connect, migrate
from .eligibility import exclusion_reason

DISCOVERY_POLICY = "stars-90-days-v1"


def eligible(repo):
    if repo.get("fork") or repo.get("is_template") or repo.get("disabled"):
        return False
    return exclusion_reason(repo.get("name"), repo.get("description"), repo.get("html_url")) is None


def persist(conn, repo):
    source_id = str(repo["id"])
    project = conn.execute(
        """INSERT INTO projects(canonical_key,name,description,publication_date)
        VALUES (%s,%s,%s,%s) ON CONFLICT(canonical_key) DO UPDATE SET
        name=excluded.name, description=excluded.description RETURNING id""",
        (f"github:{source_id}", repo["name"], repo["description"].strip(), repo.get("created_at")),
    ).fetchone()
    conn.execute(
        """INSERT INTO source_records(project_id,source,source_id,url,date_evidence,date_type)
        VALUES (%s,'github',%s,%s,%s,'repository-created fallback')
        ON CONFLICT(source,source_id) DO UPDATE SET url=excluded.url,
        date_evidence=excluded.date_evidence, available=true, observed_at=now()""",
        (project["id"], source_id, repo["html_url"], repo.get("created_at")),
    )
    conn.execute(
        """UPDATE projects SET publication_date=(SELECT min(date_evidence)
        FROM source_records WHERE project_id=%s) WHERE id=%s""",
        (project["id"], project["id"]),
    )
    reason = exclusion_reason(repo.get("name"), repo.get("description"), repo.get("html_url"))
    conn.execute("UPDATE projects SET eligible=%s, eligibility_reason=%s WHERE id=%s", (reason is None, reason, project["id"]))


def ingest(max_pages=2, restart=False, client=None):
    now = datetime.now(timezone.utc).date()
    with connect() as conn:
        # Serialize checkpoint advancement, including concurrent CLI invocations.
        conn.execute("SELECT pg_advisory_xact_lock(781421)")
        if restart:
            conn.execute("DELETE FROM discovery_checkpoint WHERE source='github'")
        conn.execute("DELETE FROM discovery_checkpoint WHERE source='github' AND discovery_policy<>%s", (DISCOVERY_POLICY,))
        conn.execute(
            """INSERT INTO discovery_checkpoint(source,window_start,window_end,discovery_policy)
            VALUES ('github',%s,%s,%s) ON CONFLICT DO NOTHING""", (now-timedelta(days=90), now, DISCOVERY_POLICY),
        )
        checkpoint = conn.execute("SELECT * FROM discovery_checkpoint WHERE source='github'").fetchone()
        if checkpoint["complete"]:
            return {"accepted": 0, "complete": True, "note": "Window finished; use --restart to refresh the rolling window."}
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "hackermind-local-discovery"}
        if os.getenv("GITHUB_TOKEN"):
            headers["Authorization"] = f"Bearer {os.environ['GITHUB_TOKEN']}"
        accepted = 0
        with httpx.Client(headers=headers, timeout=30) if client is None else client as api:
            for page in range(checkpoint["next_page"], min(11, checkpoint["next_page"]+max_pages)):
                response = api.get("https://api.github.com/search/repositories", params={
                    "q": f"created:{checkpoint['window_start']}..{checkpoint['window_end']} fork:false archived:false",
                    "sort": "stars", "order": "desc", "per_page": 100, "page": page,
                })
                response.raise_for_status()
                data = response.json()
                incomplete = bool(data.get("incomplete_results"))
                for repo in data["items"]:
                    if eligible(repo):
                        persist(conn, repo)
                        accepted += 1
                    else:
                        conn.execute("UPDATE projects SET eligible=false, eligibility_reason=%s WHERE canonical_key=%s", (exclusion_reason(repo.get("name"), repo.get("description"), repo.get("html_url")) or "Repository is a fork, template, or disabled", f"github:{repo['id']}"))
                complete = not incomplete and (len(data["items"]) < 100 or page*100 >= min(data["total_count"], 1000))
                note = f"Discovery prioritizes repositories created in the last 90 days by total stars (a trending proxy, not recent star growth). Partial GitHub search coverage: {data['total_count']} matches, at most 1,000 accessible per window. Changing star rankings may repeat or skip repositories. Eligibility uses metadata heuristics. Previously imported projects remain in the catalog."
                if incomplete:
                    note += " GitHub returned incomplete search results; available records were saved, but this page remains queued for retry."
                conn.execute("""UPDATE discovery_checkpoint SET next_page=%s,complete=%s,
                    last_success=now(),coverage_note=%s WHERE source='github'""", (page if incomplete else page+1, complete, note))
                if complete or incomplete:
                    break
        return {"accepted": accepted, "complete": complete, "note": note}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-pages", type=int, choices=range(1, 11), default=2)
    parser.add_argument("--restart", action="store_true")
    args = parser.parse_args()
    migrate()
    print(ingest(args.max_pages, args.restart))
