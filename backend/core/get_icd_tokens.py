import os
import requests
from dotenv import load_dotenv

load_dotenv()

client_id = os.getenv("ClientId")
client_secret = os.getenv("ClientSecret")

TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token"


def get_icd_token():
    response = requests.post(
        TOKEN_URL,
        data={"grant_type": "client_credentials", "scope": "icdapi_access"},
        auth=(client_id, client_secret),
    )

    response.raise_for_status()

    token_data = response.json()

    return token_data["access_token"]


if __name__ == "__main__":
    token = get_icd_token()
    print("Token obtained successfully")
    print(token)
