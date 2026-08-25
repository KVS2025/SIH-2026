"""
retrieval.py — Step 4: semantic retrieval over the ICD-11 TM2 mock candidate set.

Embeds every ICD-11 TM2 stem/pattern description once at startup (cached in
memory), then for a given NAMASTE term's definition, returns the top-K most
semantically similar stem codes and pattern codes separately — since a
postcoordinated expression needs one stem + zero-or-more patterns, not a
single flat ranked list.

NOTE: data/icd11_tm2_mock.csv contains ILLUSTRATIVE placeholder codes
(TM2-STEM-XX, TM2-PAT-XX), not real WHO ICD-11 identifiers — see
data/README_dataset.md. Swap in real WHO ICD-API data before final submission;
this module's logic (embed -> cosine similarity -> top-K) does not change
when you do.
"""
import csv
from pathlib import Path
from dataclasses import dataclass
from functools import lru_cache

from sentence_transformers import SentenceTransformer, util

BASE_DIR = Path(__file__).resolve().parent.parent
TM2_CSV_PATH = BASE_DIR / "data" / "icd11_tm2_mock.csv"

MODEL_NAME = "all-MiniLM-L6-v2"  # small, fast, CPU-friendly — good enough for prototype


@dataclass
class TM2Candidate:
    code: str
    code_type: str  # "stem" | "pattern"
    display: str
    description: str
    score: float = 0.0


def _load_tm2_candidates() -> list[TM2Candidate]:
    with open(TM2_CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [
            TM2Candidate(
                code=row["code"].strip(),
                code_type=row["code_type"].strip(),
                display=row["display"].strip(),
                description=row["description"].strip(),
            )
            for row in reader
        ]


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    # Cached so the (relatively slow) model load happens once per process.
    return SentenceTransformer(MODEL_NAME)


@lru_cache(maxsize=1)
def _get_indexed_candidates():
    """
    Returns (candidates, embeddings_tensor). Cached at module level so
    embedding the ~34-row TM2 candidate set only happens once at startup,
    not on every request.
    """
    candidates = _load_tm2_candidates()
    model = _get_model()
    texts = [f"{c.display}: {c.description}" for c in candidates]
    embeddings = model.encode(texts, convert_to_tensor=True)
    return candidates, embeddings


def get_top_k_candidates(
    query_text: str, k: int = 3, code_type: str | None = None
) -> list[TM2Candidate]:
    """
    query_text: the NAMASTE term's definition (or display+definition combined)
    code_type: "stem" | "pattern" | None (None = search both pools together)
    Returns candidates sorted by descending cosine similarity, each with .score set.
    """
    candidates, embeddings = _get_indexed_candidates()
    model = _get_model()

    query_embedding = model.encode(query_text, convert_to_tensor=True)
    scores = util.cos_sim(query_embedding, embeddings)[0]  # tensor of len(candidates)

    scored = [
        TM2Candidate(
            code=c.code,
            code_type=c.code_type,
            display=c.display,
            description=c.description,
            score=float(scores[i]),
        )
        for i, c in enumerate(candidates)
        if (code_type is None or c.code_type == code_type)
    ]
    scored.sort(key=lambda c: c.score, reverse=True)
    return scored[:k]


if __name__ == "__main__":
    # Quick manual check: retrieval.py run standalone against a known hard case.
    test_definition = (
        "A detailed subtype of Sandhivata where symptoms are specifically "
        "aggravated by cold exposure and Kapha involvement is present alongside Vata"
    )
    print("Top stem candidates:")
    for c in get_top_k_candidates(test_definition, k=3, code_type="stem"):
        print(f"  {c.score:.3f}  {c.code}  {c.display}")
    print("Top pattern candidates:")
    for c in get_top_k_candidates(test_definition, k=3, code_type="pattern"):
        print(f"  {c.score:.3f}  {c.code}  {c.display}")
