"""
main.py — FastAPI app entrypoint.

Run with:
    uvicorn app.main:app --reload --port 8000

Then visit http://localhost:8000/docs for interactive Swagger UI —
this alone is enough to demo Steps 1-3 live.
"""

from fastapi import FastAPI
from application.db import init_db
from application.routes import codesystem, valueset, translate

app = FastAPI(
    title="NAMASTE-ICD11 Terminology Micro-service (Prototype)",
    description=(
        "FHIR-shaped terminology micro-service prototype: NAMASTE Ayurveda "
        "CodeSystem, autocomplete ValueSet lookup, and NAMASTE<->ICD-11 TM2 "
        "$translate operation. Built for SIH 2026 — Ayurveda scope only."
    ),
    version="0.1.0-prototype",
)

app.include_router(codesystem.router)
app.include_router(valueset.router)
app.include_router(translate.router)


@app.on_event("startup")
def on_startup():
    init_db(reset=False)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "service": "namaste-icd11-terminology-service",
        "docs": "/docs",
    }
