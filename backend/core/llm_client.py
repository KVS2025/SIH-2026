import os
import json
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv()


class ICDMappingLLM:
    def __init__(self):

        api_key = os.getenv("GOOGLE_API_KEY")

        if not api_key:
            raise ValueError("GOOGLE_API_KEY is missing from .env")

        self.client = genai.Client(api_key=api_key)

        self.model = "gemini-2.5-flash"

    # =========================================================
    # COMMON GEMINI JSON REQUEST
    # =========================================================

    def _generate_json(self, prompt, max_retries=3):
        """
        Send a prompt to Gemini and return parsed JSON.

        Retries temporary 503 / UNAVAILABLE errors.
        """

        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0, response_mime_type="application/json"
                    ),
                )

                return json.loads(response.text)

            except Exception as e:
                error_text = str(e)

                # -----------------------------------------
                # Temporary Gemini availability error
                # -----------------------------------------

                if "503" in error_text or "UNAVAILABLE" in error_text:
                    if attempt == max_retries - 1:
                        raise

                    wait_time = 2**attempt

                    print(
                        f"Gemini temporarily unavailable. "
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)

                else:
                    raise

    # =========================================================
    # RECOMMEND ICD CODE
    # =========================================================

    def recommend_code(self, input_text, candidates):
        """
        Select the best ICD-11 candidate.

        The LLM can ONLY select a code from the
        candidates supplied by WHO.
        """

        candidates_json = json.dumps(candidates, indent=2, ensure_ascii=False)

        prompt = f"""
You are an ICD-11 terminology mapping assistant.

Your task is to select the most appropriate ICD-11
candidate from the candidates supplied by the WHO
ICD-11 Search API.

IMPORTANT RULES:

1. You may ONLY recommend a code that appears in
   the candidate list.

2. Do NOT invent an ICD-11 code.

3. The WHO score is evidence of textual similarity,
   but it is NOT by itself proof that the candidate
   is clinically correct.

4. Consider the meaning and context of the input.

5. Pay attention to distinctions such as:

   - Type 1 vs Type 2
   - pregnancy
   - neonatal conditions
   - complications
   - specified vs unspecified
   - underlying disease vs manifestation
   - antibiotic resistance

6. Do not assume information that is not present
   in the input.

7. If the input does not contain enough information
   to distinguish between candidates, prefer an
   appropriate unspecified candidate.

8. Return JSON only.

INPUT:
{input_text}

WHO ICD-11 CANDIDATES:
{candidates_json}

Return:

{{
    "recommended_code": "code",
    "recommended_title": "title",
    "confidence": 0.0,
    "reason": "short explanation",
    "alternatives": [
        {{
            "code": "code",
            "reason": "why this could be appropriate"
        }}
    ]
}}
"""

        return self._generate_json(prompt)

    # =========================================================
    # POSTCOORDINATION ANALYSIS
    # =========================================================

    def analyze_postcoordination(self, input_text, candidates):
        """
        Determine whether an existing ICD-11 candidate
        completely represents the input or whether
        additional concepts are required.

        The LLM identifies meanings and relationships.
        It does NOT invent ICD-11 codes.
        """

        candidates_json = json.dumps(candidates, indent=2, ensure_ascii=False)

        prompt = f"""
You are an ICD-11 terminology mapping assistant.

Analyze the clinical input and the ICD-11 candidates
returned by the WHO ICD-11 Search API.

Determine:

1. Whether one of the WHO candidates already represents
   the complete meaning of the input.

2. If not, identify the BASE clinical concept.

3. Identify ADDITIONAL clinical concepts that need to
   be represented through ICD-11 postcoordination.

IMPORTANT RULES:

- Do NOT invent ICD-11 codes.
- Do NOT invent ICD-11 postcoordination codes.
- Do NOT output XN codes or other ICD codes yourself.
- Describe additional concepts using their plain meaning.
- The backend will search WHO separately to resolve
  those concepts into ICD-11 codes.
- Separate a concept from its relationship.

Example:

Input:
"Infectious blepharitis caused by Escherichia coli"

Correct:

base_concept:
"Infectious blepharitis"

additional concept:
"Escherichia coli"

relationship:
"causative agent"

Do NOT return:

"Escherichia coli as the causative agent"

because the backend needs to search for the concept
"Escherichia coli" separately.

Another example:

Input:
"Urinary tract infection due to Escherichia coli"

If a WHO candidate already represents the complete
meaning, postcoordination is NOT required.

INPUT:
{input_text}

WHO CANDIDATES:
{candidates_json}

Return JSON only.

If postcoordination IS required:

{{
    "requires_postcoordination": true,
    "base_concept": "plain meaning of base concept",
    "base_candidate_code": null,
    "additional_concepts": [
        {{
            "meaning": "plain meaning of additional concept",
            "relationship": "relationship to base concept"
        }}
    ],
    "reason": "short explanation"
}}

If postcoordination is NOT required:

{{
    "requires_postcoordination": false,
    "base_concept": null,
    "base_candidate_code": "existing WHO code",
    "additional_concepts": [],
    "reason": "why the existing candidate completely represents the input"
}}
"""

        return self._generate_json(prompt)

    def select_postcoordination_axis(
        self, input_text, base_concept, additional_concept, relationship, available_axes
    ):
        """
        Select the appropriate WHO postcoordination axis.

        The LLM is NOT allowed to invent an axis.
        """

        axes = []

        for axis in available_axes:
            axes.append(
                {
                    "axisName": axis.get("axisName"),
                    "requiredPostcoordination": axis.get("requiredPostcoordination"),
                    "allowMultipleValues": axis.get("allowMultipleValues"),
                    "scaleEntity": axis.get("scaleEntity"),
                }
            )

        axes_json = json.dumps(axes, indent=2, ensure_ascii=False)

        prompt = f"""
    You are an ICD-11 postcoordination assistant.

    You must select the appropriate postcoordination axis
    for an additional clinical concept.

    IMPORTANT:

    - You may ONLY select an axis that WHO supplied.
    - Do NOT invent an axis.
    - Do NOT invent an ICD code.
    - Do NOT invent a value.
    - The backend will resolve the actual value using WHO.

    INPUT:
    {input_text}

    BASE CONCEPT:
    {base_concept}

    ADDITIONAL CONCEPT:
    {additional_concept}

    CLINICAL RELATIONSHIP:
    {relationship}

    WHO AVAILABLE POSTCOORDINATION AXES:
    {axes_json}

    Return JSON only:

    {{
        "axisName": "exact axisName from WHO",
        "reason": "short explanation"
    }}

    If none of the available axes is appropriate:

    {{
        "axisName": null,
        "reason": "why no available axis is appropriate"
    }}
    """

        return self._generate_json(prompt)
