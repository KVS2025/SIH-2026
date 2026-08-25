# Ayurveda NAMASTE Mock Dataset — README

## What this is
A hand-curated, **representative** dataset of 40 Ayurveda diagnostic terms, built for prototyping your terminology micro-service pipeline. Term names, Sanskrit terminology, and clinical descriptions are drawn from publicly documented Ayurveda diagnostic categories (real disorder names/concepts), so they're realistic and defensible in a demo.

## ⚠️ Important — what is NOT real in this file
The `icd11_tm2_mapped_code` values (`TM2-DEMO-01`, `TM2-DEMO-02`, etc.) are **placeholder codes I invented for structural demonstration only**. They are NOT real WHO ICD-11 codes. Do not present these as verified WHO mappings in your demo or slides — say clearly that this is a mock dataset with illustrative codes standing in for real ICD-11 TM2 identifiers, which your team will swap in from the actual WHO ICD-API before a production/final submission.

## Columns
| Column | Meaning |
|---|---|
| `namaste_code` | Mock NAMC-style code (unique ID) |
| `term_sanskrit` | The Ayurvedic term |
| `term_english` | English gloss/display name |
| `definition` | Short clinical description — this is what your embedding model should embed for semantic retrieval |
| `icd11_tm2_mapped_code` | Present (illustrative) = "already mapped" case. Blank = "unmapped, needs the cross-linkage engine" case |
| `demo_case_type` | Tells you which pipeline branch this row is meant to exercise (see below) |

## How the `demo_case_type` column maps to your architecture

- **`already_mapped_easy` / `already_mapped_medium`** (rows 1-10, 36) — 11 rows. Use these to demo the **direct lookup path** — no embeddings/LLM needed, `$translate` just returns the stored code instantly.
- **`unmapped_needs_postcoordination_easy`** — straightforward unmapped terms where the definition wording is close enough to an ICD-11-style description that embeddings alone should retrieve a good candidate. Use these to show your **retrieval step working well**.
- **`unmapped_needs_postcoordination_medium`** — moderately tricky unmapped terms, good for showing the **LLM reasoning layer adding value** over raw embedding similarity.
- **`unmapped_needs_postcoordination_hard`** — deliberately detailed/compound terms (e.g., NAMC-A012, A025, A029, A033) that combine a base disorder with a specific aggravating factor (cold, heat, Kapha excess) — these are your best demo cases for showing **postcoordination construction** (disorder code + pattern code), since the term itself signals it needs more than one code to represent fully.
- **`no_confident_match_edge_case`** (NAMC-A040) — deliberately included so you can demonstrate the **"no confident candidate → route to clinician review"** fallback branch working, rather than forcing a bad guess.

## Next steps for your team
1. Load this CSV into your SQLite table as-is to get Steps 1-3 of your build order running today.
2. In parallel, pursue the real WHO ICD-API and any official NAMASTE export (per earlier guidance) — when you get real data, keep this exact column structure so you can swap the CSV without touching any pipeline code.
3. Before your final demo/submission, replace every `TM2-DEMO-XX` placeholder with either a real WHO ICD-11 TM2 code (for the "already mapped" rows) or leave them genuinely unmapped so your engine constructs them live — and say so explicitly to judges.
