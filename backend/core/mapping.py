from icd_client import ICDClient
from llm_client import ICDMappingLLM


def map_to_icd(input_text):

    icd = ICDClient()
    llm = ICDMappingLLM()

    # =====================================================
    # 1. Search WHO MMS
    # =====================================================

    raw_results = icd.search(input_text)

    candidates = icd.extract_search_results(raw_results, top_matches_per_result=3)

    candidates = candidates[:15]

    # =====================================================
    # 2. Ask LLM to analyze the input
    # =====================================================

    analysis = llm.analyze_postcoordination(
        input_text=input_text, candidates=candidates
    )

    # =====================================================
    # 3. NORMAL CODE
    # =====================================================

    if not analysis["requires_postcoordination"]:
        recommended_code = analysis.get("base_candidate_code")

        if not recommended_code and candidates:
            recommended_code = candidates[0]["code"]

        validation = icd.validate_code(recommended_code)

        return {
            "input": input_text,
            "candidates": candidates,
            "postcoordination_analysis": analysis,
            "recommendation": {"recommended_code": recommended_code},
            "validation": validation,
            "status": ("validated" if validation["valid"] else "validation_failed"),
        }

    # =====================================================
    # 4. POSTCOORDINATION
    # =====================================================

    base_concept = analysis.get("base_concept")

    additional_concepts = analysis.get("additional_concepts", [])

    # =====================================================
    # 5. Resolve BASE concept through MMS
    # =====================================================

    base_candidates = icd.find_concept(base_concept, top_n=5)

    if not base_candidates:
        return {
            "input": input_text,
            "candidates": candidates,
            "postcoordination_analysis": analysis,
            "status": "base_concept_not_found",
        }

    # Best base candidate
    base_candidate = max(
        base_candidates,
        key=lambda x: x.get("score") if x.get("score") is not None else -999,
    )

    base_code = base_candidate["code"]

    # =====================================================
    # 6. Get WHO's actual postcoordination axes
    # =====================================================

    scale_info = icd.get_postcoordination_scale(base_code)

    available_axes = scale_info["postcoordination_scale"]

    if not available_axes:
        return {
            "input": input_text,
            "candidates": candidates,
            "postcoordination_analysis": analysis,
            "base_concept": {"meaning": base_concept, "candidate": base_candidate},
            "status": "no_postcoordination_axes",
        }

    # =====================================================
    # 7. Resolve every additional concept
    # =====================================================

    resolved_concepts = []

    for additional in additional_concepts:
        meaning = additional.get("meaning")

        relationship = additional.get("relationship")

        # -------------------------------------------------
        # Search Foundation
        # -------------------------------------------------

        foundation_candidates = icd.find_foundation_concept(meaning, top_n=10)

        if not foundation_candidates:
            resolved_concepts.append(
                {
                    "meaning": meaning,
                    "relationship": relationship,
                    "error": "Foundation concept not found",
                }
            )

            continue

        # -------------------------------------------------
        # Prefer exact title match
        # -------------------------------------------------

        exact_matches = [
            candidate
            for candidate in foundation_candidates
            if candidate.get("title", "").lower() == meaning.lower()
        ]

        if exact_matches:
            foundation_candidate = exact_matches[0]

        else:
            foundation_candidate = max(
                foundation_candidates,
                key=lambda x: x.get("score") if x.get("score") is not None else -999,
            )

        foundation_uri = foundation_candidate["uri"]

        # -------------------------------------------------
        # Resolve Foundation URI to ICD representation
        # -------------------------------------------------

        value_description = icd.describe(uri=foundation_uri)

        value_code = value_description.get("code")

        # -------------------------------------------------
        # Ask LLM which WHO axis applies
        # -------------------------------------------------

        axis_selection = llm.select_postcoordination_axis(
            input_text=input_text,
            base_concept=base_concept,
            additional_concept=meaning,
            relationship=relationship,
            available_axes=available_axes,
        )

        resolved_concepts.append(
            {
                "meaning": meaning,
                "relationship": relationship,
                "foundation": {
                    "uri": foundation_uri,
                    "title": foundation_candidate["title"],
                },
                "value": {
                    "code": value_code,
                    "label": value_description.get("label"),
                    "foundation_uri": value_description.get("foundationUri"),
                },
                "axis": axis_selection,
            }
        )

    # =====================================================
    # 8. Make sure every additional concept was resolved
    # =====================================================

    unresolved = [
        item
        for item in resolved_concepts
        if "error" in item
        or not item.get("value", {}).get("code")
        or not item.get("axis", {}).get("axisName")
    ]

    if unresolved:
        return {
            "input": input_text,
            "candidates": candidates,
            "postcoordination_analysis": analysis,
            "base_concept": {"meaning": base_concept, "candidate": base_candidate},
            "available_axes": available_axes,
            "resolved_concepts": resolved_concepts,
            "status": "postcoordination_resolution_failed",
        }

    # =====================================================
    # 9. Construct ICD-11 postcoordination expression
    # =====================================================

    final_parts = [base_code]

    for item in resolved_concepts:
        value_code = item["value"]["code"]

        final_parts.append(value_code)

    final_code = "&".join(final_parts)

    # =====================================================
    # 10. Validate complete expression with WHO
    # =====================================================

    validation = icd.validate_code(final_code)

    # =====================================================
    # 11. Return complete result
    # =====================================================

    return {
        "input": input_text,
        "candidates": candidates,
        "postcoordination_analysis": analysis,
        "base_concept": {"meaning": base_concept, "candidate": base_candidate},
        "available_axes": available_axes,
        "resolved_concepts": resolved_concepts,
        "postcoordinated_code": final_code,
        "validation": validation,
        "status": (
            "postcoordination_validated"
            if validation["valid"]
            else "postcoordination_validation_failed"
        ),
    }
