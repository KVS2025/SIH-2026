from icd_client import ICDClient
from llm_client import ICDMappingLLM


def map_to_icd(input_text):

    icd = ICDClient()
    llm = ICDMappingLLM()

    # =====================================================
    # 1. Search WHO
    # =====================================================

    raw_results = icd.search(input_text)

    # =====================================================
    # 2. Extract candidates
    # =====================================================

    candidates = icd.extract_search_results(raw_results, top_matches_per_result=3)

    candidates = candidates[:15]

    # =====================================================
    # 3. Ask LLM whether postcoordination is needed
    # =====================================================

    analysis = llm.analyze_postcoordination(
        input_text=input_text, candidates=candidates
    )

    # =====================================================
    # 4. If NO postcoordination is required
    # =====================================================

    if not analysis["requires_postcoordination"]:
        recommendation = llm.recommend_code(
            input_text=input_text, candidates=candidates
        )

        recommended_code = recommendation["recommended_code"]

        validation = icd.validate_code(recommended_code)

        return {
            "input": input_text,
            "candidates": candidates,
            "postcoordination_analysis": analysis,
            "recommendation": recommendation,
            "validation": validation,
        }

    # =====================================================
    # 5. Postcoordination IS required
    # =====================================================

    base_code = analysis.get("base_code")

    additional_concepts = analysis.get("additional_concepts", [])

    resolved_concepts = []

    # =====================================================
    # 6. Resolve every additional concept through WHO
    # =====================================================

    for concept in additional_concepts:
        meaning = concept["meaning"]

        concept_candidates = icd.find_concept(meaning, top_n=5)

        resolved_concepts.append(
            {"requested_meaning": meaning, "candidates": concept_candidates}
        )

    # =====================================================
    # 7. Return intermediate result
    # =====================================================

    return {
        "input": input_text,
        "candidates": candidates,
        "postcoordination_analysis": analysis,
        "resolved_concepts": resolved_concepts,
        "status": "postcoordination_requires_resolution",
    }
