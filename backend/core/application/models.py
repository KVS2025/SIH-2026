"""
models.py — Pydantic response models, loosely shaped to mirror the relevant
FHIR resource fields (CodeSystem.concept, ValueSet.expansion.contains,
Parameters for $translate) without pulling in a full FHIR library —
kept lightweight for prototype speed.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class NamasteConcept(BaseModel):
    """Mirrors a CodeSystem.concept entry."""
    code: str
    display: str
    definition: str
    designation_sanskrit: str = Field(..., description="Native-language term")


class ValueSetMatch(BaseModel):
    """Mirrors a ValueSet.expansion.contains entry, for autocomplete results."""
    system: str = "https://namaste.ayush.gov.in/fhir/CodeSystem/ayurveda"
    code: str
    display: str


class Coding(BaseModel):
    system: str
    code: str
    display: Optional[str] = None


class ScoredCandidate(BaseModel):
    code: str
    code_type: str  # "stem" | "pattern"
    display: str
    score: float


class TranslateResult(BaseModel):
    """Response shape for the $translate operation."""
    source_namaste: Coding
    mapping_type: str  # "direct" | "postcoordinated" | "no_confident_match" | "candidates_only"
    result: Optional[List[Coding]] = None   # 1 item if direct/stem-only, 2+ if postcoordinated
    postcoordination_expression: Optional[str] = None
    confidence_score: Optional[float] = None
    needs_clinician_review: bool = False
    reasoning: Optional[str] = None
    message: Optional[str] = None
    # Step 4 addition — visible so you can inspect retrieval quality before
    # Step 5 (LLM reasoning) picks a final answer from these.
    retrieved_stem_candidates: Optional[List[ScoredCandidate]] = None
    retrieved_pattern_candidates: Optional[List[ScoredCandidate]] = None
