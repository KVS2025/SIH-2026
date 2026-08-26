import os
import json

from google import genai
from google.genai import types
from dotenv import load_dotenv


load_dotenv()


class ICDMappingLLM:
    def __init__(self):

        api_key = os.getenv("GOOGLE_API_KEY")

        if not api_key:
            raise ValueError("GOOGLE_API_KEY is missing from .env")

        self.client = genai.Client(api_key=api_key)

        self.model = "gemini-2.5-flash"

    def recommend_code(self, input_text, candidates):
        """
        Given the original input and ICD-11 candidates,
        ask the LLM to select the best candidate.

        The LLM is instructed to select ONLY from the
        supplied candidates.
        """

        candidates_json = json.dumps(candidates, indent=2, ensure_ascii=False)

        prompt = f"""
You are an ICD-11 terminology mapping assistant.

Your task is to select the most appropriate ICD-11
candidate from the candidates supplied by the WHO
ICD-11 search API.

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

6. If the information in the input is insufficient
   to distinguish between candidates, prefer the
   appropriate unspecified candidate rather than
   making an unsupported assumption.

7. Return valid JSON only.

INPUT:
{input_text}

WHO ICD-11 CANDIDATES:
{candidates_json}

Return this structure:

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

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0, response_mime_type="application/json"
            ),
        )

        return json.loads(response.text)

    def analyze_postcoordination(self, input_text, candidates):
        candidates_json = json.dumps(candidates, indent=2, ensure_ascii=False)

        prompt = f"""
    You are an ICD-11 terminology mapping assistant.

    Analyze the input and the ICD-11 candidates returned by
    the WHO ICD-11 Search API.

    Your job is to determine whether an existing candidate
    already represents the complete meaning of the input or
    whether additional postcoordination is required.

    IMPORTANT:

    1. Do not invent ICD-11 codes.
    2. Do not invent postcoordination values.
    3. Do not output a postcoordination code yourself.
    4. If an existing candidate completely represents the
    input, prefer that candidate.
    5. Only say postcoordination is required when the input
    contains a meaningful clinical detail that is not
    represented by the selected candidate.
    6. If postcoordination is required, describe the additional
    concept by MEANING, not by inventing an ICD-11 code.

    INPUT:
    {input_text}

    WHO CANDIDATES:
    {candidates_json}

    Return JSON only:

    {{
        "requires_postcoordination": true,
        "base_code": "code or null",
        "base_title": "title or null",
        "additional_concepts": [
            {{
                "meaning": "concept that needs to be added",
                "reason": "why it is required"
            }}
        ],
        "reason": "short explanation"
    }}
    """

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0, response_mime_type="application/json"
            ),
        )

        return json.loads(response.text)
