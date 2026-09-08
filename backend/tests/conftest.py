import os
import uuid
import psycopg
import pytest
from catalog.db import connect, migrate


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

