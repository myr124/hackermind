CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS projects (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    canonical_key text NOT NULL UNIQUE,
    name text NOT NULL,
    description text NOT NULL,
    publication_date timestamptz
);
CREATE TABLE IF NOT EXISTS source_records (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id bigint NOT NULL REFERENCES projects(id),
    source text NOT NULL,
    source_id text NOT NULL,
    url text NOT NULL,
    date_evidence timestamptz,
    date_type text NOT NULL,
    available boolean NOT NULL DEFAULT true,
    observed_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(source, source_id)
);
CREATE INDEX IF NOT EXISTS projects_publication ON projects(publication_date DESC, id DESC);
CREATE TABLE IF NOT EXISTS discovery_checkpoint (
    source text PRIMARY KEY,
    window_start date NOT NULL,
    window_end date NOT NULL,
    next_page integer NOT NULL DEFAULT 1,
    complete boolean NOT NULL DEFAULT false,
    last_success timestamptz,
    coverage_note text NOT NULL DEFAULT ''
);
ALTER TABLE discovery_checkpoint ADD COLUMN IF NOT EXISTS discovery_policy text NOT NULL DEFAULT 'updated-v1';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS eligible boolean NOT NULL DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS eligibility_reason text;
CREATE TABLE IF NOT EXISTS terms (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind text NOT NULL CHECK (kind IN ('domain','space','technology')),
    name text NOT NULL,
    definition text NOT NULL,
    normalized_name text NOT NULL,
    UNIQUE(kind, normalized_name)
);
CREATE TABLE IF NOT EXISTS project_terms (
    project_id bigint NOT NULL REFERENCES projects(id),
    term_id bigint NOT NULL REFERENCES terms(id),
    explanation text NOT NULL,
    evidence text NOT NULL,
    PRIMARY KEY(project_id,term_id)
);
CREATE TABLE IF NOT EXISTS classification_runs (
    project_id bigint PRIMARY KEY REFERENCES projects(id),
    input_hash text NOT NULL,
    rules_version text NOT NULL,
    model text NOT NULL,
    classified_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS space_edges (
    parent_id bigint NOT NULL REFERENCES terms(id),
    child_id bigint NOT NULL REFERENCES terms(id),
    explanation text NOT NULL,
    model text NOT NULL,
    PRIMARY KEY(parent_id,child_id),
    CHECK(parent_id<>child_id)
);
CREATE OR REPLACE FUNCTION validate_space_edge() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(current_schema()),781423);
    IF (SELECT kind FROM terms WHERE id=NEW.parent_id) IS DISTINCT FROM 'space'
       OR (SELECT kind FROM terms WHERE id=NEW.child_id) IS DISTINCT FROM 'space' THEN
        RAISE EXCEPTION 'Hierarchy endpoints must be problem spaces';
    END IF;
    IF EXISTS (WITH RECURSIVE descendants(id) AS (
        SELECT NEW.child_id UNION SELECT e.child_id FROM space_edges e JOIN descendants d ON e.parent_id=d.id
    ) SELECT 1 FROM descendants WHERE id=NEW.parent_id) THEN
        RAISE EXCEPTION 'Problem-space hierarchy cannot contain a cycle';
    END IF;
    RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER validate_space_edge BEFORE INSERT OR UPDATE ON space_edges
    FOR EACH ROW EXECUTE FUNCTION validate_space_edge();
