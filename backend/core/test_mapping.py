import json

from mapping import map_to_icd


def main():

    print("=" * 70)
    print("NAMASTE → ICD-11 MAPPING SYSTEM")
    print("=" * 70)

    while True:
        print("\nEnter a medical term.")
        print("Type 'exit' to quit.")

        user_input = input("\nInput: ").strip()

        if user_input.lower() == "exit":
            print("Exiting...")
            break

        if not user_input:
            print("Please enter something.")
            continue

        print("\nProcessing...")
        print("-" * 70)

        try:
            result = map_to_icd(user_input)

            print("\nFULL RESULT")
            print("=" * 70)

            print(json.dumps(result, indent=4, ensure_ascii=False))

        except Exception as e:
            print("\nERROR")
            print("-" * 70)
            print(e)


if __name__ == "__main__":
    main()
