import json
import os

from icd_client import ICDClient


# =========================================================
# Configuration
# =========================================================

OUTPUT_DIR = "responses"


# Create responses directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)


# =========================================================
# Helper function
# =========================================================


def save_json(data, filename):

    filepath = os.path.join(OUTPUT_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

    print(f"Saved response → {filepath}")


# =========================================================
# Main
# =========================================================


def main():

    icd = ICDClient()

    # =====================================================
    # 1. TOKEN
    # =====================================================

    print("\n" + "=" * 70)
    print("1. TOKEN TEST")
    print("=" * 70)

    try:
        token = icd.get_token()

        print("SUCCESS")
        print("Token obtained successfully.")

        # DO NOT save the token to JSON.
        # It is a credential and should remain private.

    except Exception as e:
        print("FAILED")
        print(e)

        return

    # =====================================================
    # 2. NORMAL SEARCH
    # =====================================================

    print("\n" + "=" * 70)
    print("2. SEARCH TEST")
    print("=" * 70)

    try:
        result = icd.search("diabetes mellitus")

        print("SUCCESS")

        save_json(result, "search.json")

    except Exception as e:
        print("FAILED")
        print(e)

    # =====================================================
    # 3. MATCHING SEARCH
    # =====================================================

    print("\n" + "=" * 70)
    print("3. MATCHING TEST")
    print("=" * 70)

    try:
        result = icd.search("diabetes mellitus")

        compact_results = icd.extract_search_results(result, top_matches_per_result=3)

        save_json(compact_results, "search_extracted.json")

    except Exception as e:
        print("FAILED")
        print(e)

    # =====================================================
    # 4. CODE INFO
    # =====================================================

    print("\n" + "=" * 70)
    print("4. CODE INFO TEST")
    print("=" * 70)

    try:
        # Replace this with a real ICD-11 code
        # returned from search/matching.
        code = "BA00"

        result = icd.code_info(code)

        print("SUCCESS")

        save_json(result, "codeinfo.json")

    except Exception as e:
        print("FAILED")
        print(e)

    # =====================================================
    # 5. DESCRIBE
    # =====================================================

    print("\n" + "=" * 70)
    print("5. DESCRIBE TEST")
    print("=" * 70)

    try:
        code = "BA00"

        result = icd.describe(code=code)

        print("SUCCESS")

        save_json(result, "describe.json")

    except Exception as e:
        print("FAILED")
        print(e)


if __name__ == "__main__":
    main()
