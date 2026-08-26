"""
db.py — SQLite setup + CSV seed loader for the NAMASTE terminology micro-service.

Run standalone to (re)build the database from the mock CSV:
    python -m app.db
"""

import csv
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "namaste.db"
CSV_PATH = BASE_DIR / "data" / "namaste_ayurveda_mock.csv"

SCHEMA = """
CREATE TABLE IF NOT EXISTS namaste_terms (
    namaste_code            TEXT PRIMARY KEY,
    term_sanskrit           TEXT NOT NULL,
    term_english            TEXT NOT NULL,
    definition              TEXT NOT NULL,
    icd11_tm2_mapped_code   TEXT,            -- NULL/blank = unmapped
    demo_case_type          TEXT,
    mapping_source          TEXT DEFAULT 'seed',   -- 'seed' | 'engine' | 'clinician_confirmed'
    confidence_score        REAL,
    needs_review            INTEGER DEFAULT 0
);
"""


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(reset: bool = False) -> None:
    """Create the DB and seed it from the CSV. Set reset=True to wipe and reload."""
    conn = get_connection()
    cur = conn.cursor()

    if reset:
        cur.execute("DROP TABLE IF EXISTS namaste_terms")

    cur.executescript(SCHEMA)

    # Only seed if empty, so re-imports (e.g. app restarts) don't duplicate/overwrite
    # confirmed engine mappings written during a session.
    cur.execute("SELECT COUNT(*) FROM namaste_terms")
    count = cur.fetchone()[0]

    if count == 0:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = [
                (
                    row["namaste_code"].strip(),
                    row["term_sanskrit"].strip(),
                    row["term_english"].strip(),
                    row["definition"].strip(),
                    (row["icd11_tm2_mapped_code"].strip() or None),
                    row["demo_case_type"].strip(),
                )
                for row in reader
            ]
        cur.executemany(
            """INSERT INTO namaste_terms
               (namaste_code, term_sanskrit, term_english, definition,
                icd11_tm2_mapped_code, demo_case_type)
               VALUES (?, ?, ?, ?, ?, ?)""",
            rows,
        )
        conn.commit()
        print(f"Seeded {len(rows)} rows into {DB_PATH}")
    else:
        print(f"DB already has {count} rows — skipping seed (use reset=True to reload)")

    conn.close()


if __name__ == "__main__":
    init_db(reset=True)
