"""
routes/valueset.py — autocomplete lookup, mirroring FHIR's
ValueSet/$expand?filter= pattern.

GET /ValueSet/$expand?filter=cold
"""

from fastapi import APIRouter, Query
from application.db import get_connection
from application.models import ValueSetMatch

router = APIRouter(tags=["ValueSet"])


@router.get("/ValueSet/$expand", response_model=list[ValueSetMatch])
def expand_valueset(filter: str = Query(..., min_length=1, description="Search text")):
    """
    Simple substring autocomplete over English term + Sanskrit term + definition.
    A production version would rank by relevance; this is deliberately simple
    for Step 2 — semantic ranking comes later via the retrieval module.
    """
    conn = get_connection()
    like = f"%{filter.lower()}%"
    rows = conn.execute(
        """SELECT namaste_code, term_english FROM namaste_terms
           WHERE lower(term_english) LIKE ?
              OR lower(term_sanskrit) LIKE ?
              OR lower(definition) LIKE ?
           ORDER BY namaste_code
           LIMIT 20""",
        (like, like, like),
    ).fetchall()
    conn.close()

    return [
        ValueSetMatch(code=r["namaste_code"], display=r["term_english"]) for r in rows
    ]
