"""Source-independent, inspectable catalog eligibility checks."""
import re
from urllib.parse import urlparse


def exclusion_reason(name, description, url):
    name, description = (name or "").strip(), (description or "").strip()
    if not name or not description or urlparse(url or "").scheme not in {"http", "https"} or not urlparse(url or "").netloc:
        return "Missing usable name, description, or source link"
    normalized = lambda text: re.sub(r"[\W_]+", "", text.casefold())
    if normalized(name) == normalized(description) or re.fullmatch(r"https?://\S+", description):
        return "Description supplies no information about the build"
    text = description.casefold()
    if re.search(r"\b(profile readme|my github profile|personal portfolio|portfolio website)\b", text):
        return "Personal profile or portfolio"
    if name.casefold().startswith("awesome-") or re.search(
        r"^(?:a |an |the )?(?:(?:curated|single) )?(?:list|collection|archive) of .*(?:resources|links|tutorials|writeups)", text
    ):
        return "Resource list or reading collection"
    if re.search(r"^(?:a |an |the )?(?:\w+ )?(?:tutorial|course|starter template|boilerplate)\b", text):
        return "Tutorial, course, or starter template"
    if re.search(r"\b(anthology|field guide|learning resources)\b|从零入门指南|使用指南|知识框架", text):
        return "Reading or learning material"
    if re.search(r"\b(?:is a |is an |a )pretrained .*model\b", text) and not re.search(r"\b(app|tool|engine|library|inference)\b", text):
        return "Standalone model record"
    if re.search(r"^(?:a |an )?(?:standalone )?(?:dataset|asset pack)\b", text):
        return "Standalone dataset or asset pack"
    return None


def recheck():
    from .db import connect, migrate
    migrate()
    excluded = []
    with connect() as conn:
        for project in conn.execute("SELECT * FROM projects ORDER BY id").fetchall():
            sources = conn.execute("SELECT url FROM source_records WHERE project_id=%s", (project["id"],)).fetchall()
            reasons = [exclusion_reason(project["name"], project["description"], s["url"]) for s in sources]
            reason = next((r for r in reasons if r), None) if all(reasons) else None
            conn.execute("UPDATE projects SET eligible=%s, eligibility_reason=%s WHERE id=%s", (reason is None, reason, project["id"]))
            if reason:
                excluded.append({"id": project["id"], "name": project["name"], "reason": reason})
    return excluded


if __name__ == "__main__":
    import json
    print(json.dumps(recheck(), ensure_ascii=False, indent=2))
