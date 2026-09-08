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
