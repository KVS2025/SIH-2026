"""
routes/translate.py — the core NAMASTE -> ICD-11 TM2 $translate operation.

GET /translate?namaste_code=NAMC-A001

Step 3 scope (this file): the DIRECT-MAPPING branch only —
if the row already has icd11_tm2_mapped_code set, return it immediately.
If not, this currently returns a stub "not yet mapped" response —
Steps 4-6 (retrieval.py, reasoning.py, validation.py) plug into the
`resolve_unmapped()` function below without touching this route.
"""

from fastapi import APIRouter, HTTPException
from application.db import get_connection
from application.models import Coding, ScoredCandidate, TranslateResult
from application import retrieval

router = APIRouter(tags=["Translate"])

# Below this cosine-similarity score, we don't trust the top stem candidate
# enough to even show it as a "confident" retrieval — route straight to
# clinician review instead of guessing. Tune once real embeddings + a real
# ICD-11 TM2 dataset are in place; this is a starting placeholder.
STEM_CONFIDENCE_THRESHOLD = 0.35


def resolve_unmapped(
    namaste_code: str, term_english: str, definition: str
) -> TranslateResult:
    """
    Step 4 (this function, now live): semantic retrieval only.
    Steps 5-6 (LLM reasoning + WHO rule validation) still TODO — for now this
    returns the top-K retrieved stem/pattern candidates directly, unranked
    by an LLM and unvalidated against permissible-combination rules, so you
    can inspect retrieval quality on its own before adding reasoning on top.
    """
    source = Coding(
        system="https://namaste.ayush.gov.in/fhir/CodeSystem/ayurveda",
        code=namaste_code,
        display=term_english,
    )

    query_text = f"{term_english}: {definition}"
    stem_candidates = retrieval.get_top_k_candidates(query_text, k=3, code_type="stem")
    pattern_candidates = retrieval.get_top_k_candidates(
        query_text, k=3, code_type="pattern"
    )

    stem_scored = [
        ScoredCandidate(
            code=c.code, code_type=c.code_type, display=c.display, score=c.score
        )
        for c in stem_candidates
    ]
    pattern_scored = [
        ScoredCandidate(
            code=c.code, code_type=c.code_type, display=c.display, score=c.score
        )
        for c in pattern_candidates
    ]

    # No confident stem match at all -> zero/near-zero retrieval fallback branch.
    if not stem_candidates or stem_candidates[0].score < STEM_CONFIDENCE_THRESHOLD:
        return TranslateResult(
            source_namaste=source,
            mapping_type="no_confident_match",
            needs_clinician_review=True,
            message="No confident retrieval match found — routed directly to clinician review.",
            retrieved_stem_candidates=stem_scored,
            retrieved_pattern_candidates=pattern_scored,
        )

    return TranslateResult(
        source_namaste=source,
        mapping_type="candidates_only",
        confidence_score=stem_candidates[0].score,
        needs_clinician_review=True,  # still true until Steps 5-6 (reasoning + validation) exist
        message=(
            "Step 4 (retrieval) complete — showing top candidates. "
            "Step 5 (LLM reasoning) and Step 6 (WHO rule validation) not yet wired in, "
            "so no final answer is auto-selected yet."
        ),
        retrieved_stem_candidates=stem_scored,
        retrieved_pattern_candidates=pattern_scored,
    )


@router.get("/translate", response_model=TranslateResult)
def translate(namaste_code: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM namaste_terms WHERE namaste_code = ?", (namaste_code,)
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(
            status_code=404, detail=f"NAMASTE code '{namaste_code}' not found"
        )

    source = Coding(
        system="https://namaste.ayush.gov.in/fhir/CodeSystem/ayurveda",
        code=row["namaste_code"],
        display=row["term_english"],
    )

    # --- Direct-mapping branch (Step 3) ---
    if row["icd11_tm2_mapped_code"]:
        return TranslateResult(
            source_namaste=source,
            mapping_type="direct",
            result=[
                Coding(
                    system="http://id.who.int/icd/release/11/tm2",
                    code=row["icd11_tm2_mapped_code"],
                    display=f"[illustrative placeholder — replace with real ICD-11 TM2 lookup]",
                )
            ],
            confidence_score=1.0,
            needs_clinician_review=False,
            message="Direct official mapping found — no engine involved.",
        )

    # --- Unmapped branch (Steps 4-6, stubbed for now) ---
    return resolve_unmapped(row["namaste_code"], row["term_english"], row["definition"])
