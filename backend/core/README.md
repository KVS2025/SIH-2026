# NAMASTE ↔ ICD-11 TM2 Terminology Micro-service — Prototype

Steps 1-3 of the build order, working end to end: SQLite-backed NAMASTE
CodeSystem, autocomplete ValueSet lookup, and a $translate operation
(direct-mapping branch complete; unmapped branch stubbed for Steps 4-6).

## Run it

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then open http://localhost:8000/docs for interactive Swagger UI — every
endpoint below is demoable straight from there.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /CodeSystem` | Full NAMASTE Ayurveda CodeSystem (FHIR-shaped) |
| `GET /CodeSystem/{code}` | Single concept lookup |
| `GET /ValueSet/$expand?filter=<text>` | Autocomplete search |
| `GET /translate?namaste_code=<code>` | NAMASTE → ICD-11 TM2 translation |

## Try these against the seeded dataset

- `GET /translate?namaste_code=NAMC-A001` → direct mapping (Amlapitta, already mapped)
- `GET /translate?namaste_code=NAMC-A011` → unmapped (Sandhivata) — currently
  returns `needs_clinician_review: true` with a message pointing at Step 4
- `GET /ValueSet/$expand?filter=cold` → surfaces the deliberately "hard"
  postcoordination cases (NAMC-A012, NAMC-A033)

## Next build steps (in order)

1. ~~`app/retrieval.py` — embedding similarity over the `definition` column~~ **DONE.** Uses sentence-transformers (`all-MiniLM-L6-v2`) against `data/icd11_tm2_mock.csv` (illustrative placeholder TM2 codes — see data/README_dataset.md). Returns top-K stem and pattern candidates separately, visible in the `/translate` response as `retrieved_stem_candidates` / `retrieved_pattern_candidates`. A confidence threshold (`STEM_CONFIDENCE_THRESHOLD` in translate.py, currently 0.35) routes low-confidence cases straight to `no_confident_match` / clinician review.
2. **`app/reasoning.py`** — LLM call to pick best stem+pattern combination
   from the top-K candidates, with justification + confidence score
3. **`app/validation.py`** — rule-based permissible-combination check
4. Wire all three into `resolve_unmapped()` in `app/routes/translate.py` —
   the route/response contract is already fixed, so this is additive, not
   a rewrite
5. Add the confirmed-mapping write-back (`mapping_source='engine'` /
   `'clinician_confirmed'`, `confidence_score`, `needs_review` columns
   already exist in the schema for this)
6. `app/routes/bundle.py` — FHIR Bundle upload endpoint (Step 8 of the
   original build order)

## Notes

- `icd11_tm2_mapped_code` values in the seed CSV are **illustrative
  placeholders** (`TM2-DEMO-XX`), not real WHO codes — see
  `data/README_dataset.md`. Swap for real ICD-API lookups before final
  submission.
- ABHA/OAuth 2.0 auth is intentionally not implemented yet — stub it in
  `app/auth.py` as a fake bearer-token check for the demo, and state
  clearly in your pitch that this is the integration point for real
  ABHA-linked OAuth 2.0 in production.

## Frontend (Streamlit demo UI)

A minimal demo UI is included at `streamlit_app.py` — search a NAMASTE term,
see autocomplete matches, translate to ICD-11 TM2, and inspect retrieval
candidates with confidence bars. This is what to actually show judges live.

Run it in a **second terminal**, alongside the backend:

```bash
# terminal 1 — backend
uvicorn app.main:app --reload --port 8000

# terminal 2 — frontend
streamlit run streamlit_app.py
```

Streamlit opens automatically at http://localhost:8501. The backend URL is
configurable in the sidebar if you're not running on the default port.
