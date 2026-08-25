"""
routes/codesystem.py — exposes the NAMASTE CodeSystem.

GET /CodeSystem            -> full FHIR-shaped CodeSystem resource
GET /CodeSystem/{code}     -> a single concept lookup
"""

from fastapi import APIRouter, HTTPException
from application.db import get_connection

router = APIRouter(tags=["CodeSystem"])


def _row_to_concept(row) -> dict:
    return {
        "code": row["namaste_code"],
        "display": row["term_english"],
        "definition": row["definition"],
        "designation": [{"language": "sa", "value": row["term_sanskrit"]}],
    }


@router.get("/CodeSystem")
def get_codesystem():
    """Returns the NAMASTE Ayurveda terms as a FHIR-shaped CodeSystem resource."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM namaste_terms ORDER BY namaste_code").fetchall()
    conn.close()

    return {
        "resourceType": "CodeSystem",
        "url": "https://namaste.ayush.gov.in/fhir/CodeSystem/ayurveda",
        "name": "NAMASTEAyurveda",
        "title": "NAMASTE Ayurveda Morbidity Codes",
        "status": "draft",
        "content": "complete",
        "count": len(rows),
        "concept": [_row_to_concept(r) for r in rows],
    }


@router.get("/CodeSystem/{code}")
def get_concept(code: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM namaste_terms WHERE namaste_code = ?", (code,)
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=404, detail=f"NAMASTE code '{code}' not found")

    return _row_to_concept(row)
