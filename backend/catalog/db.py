import os
from pathlib import Path

import psycopg
from psycopg.rows import dict_row


def connect():
    return psycopg.connect(
        os.environ.get("DATABASE_URL", "postgresql://hackermind:local-development-only@127.0.0.1:54329/hackermind"),
        row_factory=dict_row,
    )


def migrate():
    with connect() as conn:
        conn.execute(Path(__file__).with_name("schema.sql").read_text())


if __name__ == "__main__":
    migrate()
