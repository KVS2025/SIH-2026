import os
from urllib.parse import quote

import requests
from dotenv import load_dotenv

import re

# Load variables from .env
load_dotenv()


class ICDClient:
    def __init__(self):

        # =====================================================
        # Credentials
        # =====================================================

        self.client_id = os.getenv("ClientId")
        self.client_secret = os.getenv("ClientSecret")

        if not self.client_id:
            raise ValueError("ClientId is missing from .env")

        if not self.client_secret:
            raise ValueError("ClientSecret is missing from .env")

        # =====================================================
        # WHO API URLs
        # =====================================================

        self.token_url = os.getenv("WHO_TOKEN_URL")
        self.search_url = os.getenv("WHO_SEARCH_URL")
        self.codeinfo_url = os.getenv("WHO_CODEINFO_URL")
        self.describe_url = os.getenv("WHO_DESCRIBE_URL")
        self.lookup_url = os.getenv("WHO_LOOKUP_URL")

        urls = {
            "WHO_TOKEN_URL": self.token_url,
            "WHO_SEARCH_URL": self.search_url,
            "WHO_CODEINFO_URL": self.codeinfo_url,
            "WHO_DESCRIBE_URL": self.describe_url,
            "WHO_LOOKUP_URL": self.lookup_url,
        }

        for name, url in urls.items():
            if not url:
                raise ValueError(f"{name} is missing from .env")

        # =====================================================
        # Token
        # =====================================================

        self.access_token = None

    # =========================================================
    # GET ACCESS TOKEN
    # =========================================================

    def get_token(self):

        response = requests.post(
            self.token_url,
            data={"grant_type": "client_credentials", "scope": "icdapi_access"},
            auth=(self.client_id, self.client_secret),
            timeout=30,
        )

        response.raise_for_status()

        data = response.json()

        self.access_token = data["access_token"]

        return self.access_token

    # =========================================================
    # COMMON HEADERS
    # =========================================================

    def _get_headers(self):

        if self.access_token is None:
            self.get_token()

        return {
            "Authorization": f"Bearer {self.access_token}",
            "API-Version": "v2",
            "Accept-Language": "en",
            "Accept": "application/json",
        }

    # =========================================================
    # COMMON GET REQUEST
    # =========================================================

    def _get(self, url, params=None):

        headers = self._get_headers()

        response = requests.get(url, headers=headers, params=params, timeout=30)

        # -----------------------------------------------------
        # Token expired
        # -----------------------------------------------------

        if response.status_code == 401:
            print("Token expired. Requesting a new token...")

            self.get_token()

            headers = self._get_headers()

            response = requests.get(url, headers=headers, params=params, timeout=30)

        response.raise_for_status()

        return response.json()

    # =========================================================
    # SEARCH API
    # =========================================================

    def search(
        self,
        query,
        flexible=False,
        include_keyword_result=False,
        medical_coding_mode=True,
        chapter_filter=None,
        subtree_filter=None,
    ):
        """
        Search ICD-11 using normal text search.

        Example:
            icd.search("diabetes mellitus")

        Parameters:
            query:
                Text to search.

            flexible:
                If True, uses flexible search.

            include_keyword_result:
                If True, returns keyword suggestions.

            medical_coding_mode:
                If True, searches coding-related ICD entities.

            chapter_filter:
                Optional chapter filter.
                Example: "01;02;21"

            subtree_filter:
                Optional subtree URI(s).
        """

        params = {
            "q": query,
            "useFlexisearch": str(flexible).lower(),
            "includeKeywordResult": str(include_keyword_result).lower(),
            "medicalCodingMode": str(medical_coding_mode).lower(),
        }

        if chapter_filter is not None:
            params["chapterFilter"] = chapter_filter

        if subtree_filter is not None:
            params["subtreesFilter"] = subtree_filter

        return self._get(self.search_url, params=params)

    def find_concept(self, text, top_n=5):
        """
        Search WHO for a concept and return compact candidates.
        """

        raw_results = self.search(text)

        candidates = self.extract_search_results(raw_results, top_matches_per_result=3)

        return candidates[:top_n]

    def extract_search_results(self, response, top_matches_per_result=3):
        """
        Extract useful fields from the WHO search response.
        """

        results = []

        entities = response.get("destinationEntities", [])

        for entity in entities:
            code = entity.get("theCode")

            title = entity.get("title", "")

            title = self._clean_html(title)

            score = entity.get("score")

            # ---------------------------------------------
            # Extract matching terms
            # ---------------------------------------------

            matching_pvs = entity.get("matchingPVs", [])

            useful_matches = []

            for pv in matching_pvs:
                label = pv.get("label", "")

                label = self._clean_html(label)

                useful_matches.append(
                    {
                        "type": pv.get("propertyId"),
                        "label": label,
                        "score": pv.get("score"),
                    }
                )

            # Sort matching terms by score
            useful_matches.sort(
                key=lambda x: x["score"] if x["score"] is not None else float("-inf"),
                reverse=True,
            )

            # Keep only top matching terms
            useful_matches = useful_matches[:top_matches_per_result]

            # ---------------------------------------------
            # Foundation URI
            # ---------------------------------------------

            foundation_uri = None

            if matching_pvs:
                foundation_uri = matching_pvs[0].get("foundationUri")

            # ---------------------------------------------
            # Compact result
            # ---------------------------------------------

            compact_result = {
                "code": code,
                "title": title,
                "score": score,
                "chapter": entity.get("chapter"),
                "foundation_uri": foundation_uri,
                "is_leaf": entity.get("isLeaf"),
                "postcoordination_available": (
                    entity.get("postcoordinationAvailability") is not None
                    and entity.get("postcoordinationAvailability") > 0
                ),
                "has_coding_note": entity.get("hasCodingNote"),
                "matched_terms": useful_matches,
            }

            results.append(compact_result)

        return results

    @staticmethod
    def _clean_html(text):

        if not text:
            return text

        return re.sub(r"<[^>]+>", "", text)

    # =========================================================
    # SIMILARITY / MATCHING SEARCH
    # =========================================================

    def match(self, search_text, threshold=None, subtree_filter=None):
        """
        Find ICD-11 concepts that are similar to the
        provided text.

        Example:
            icd.match(
                "high blood pressure",
                threshold=0.7
            )

        The response contains matching entities and
        their similarity scores.
        """

        params = {"searchText": search_text}

        if threshold is not None:
            params["matchThreshold"] = threshold

        if subtree_filter is not None:
            params["subtreesFilter"] = subtree_filter

        return self._get(self.search_url, params=params)

    # =========================================================
    # CODE INFO
    # =========================================================

    def code_info(self, code):
        """
        Get information about an ICD-11 code.

        Example:
            icd.code_info("BA00")
        """

        # ICD-11 code combinations can contain characters
        # such as & and /, so encode them for the URL.

        encoded_code = quote(code, safe="")

        url = f"{self.codeinfo_url}/{encoded_code}"

        return self._get(url)

    def validate_code(self, code):
        """
        Check whether an ICD-11 code exists in WHO.
        """

        try:
            result = self.code_info(code)

            return {"valid": True, "code": result.get("code"), "info": result}

        except requests.HTTPError as e:
            if e.response.status_code == 404:
                return {"valid": False, "code": code, "error": "ICD-11 code not found"}

            raise

    # =========================================================
    # DESCRIBE
    # =========================================================

    def describe(self, code=None, uri=None):
        """
        Describe an ICD-11 code, URI or combination.

        Provide either code OR uri.
        """

        if code is None and uri is None:
            raise ValueError("Provide either 'code' or 'uri'")

        if code is not None and uri is not None:
            raise ValueError("Provide either 'code' or 'uri', not both")

        params = {}

        if code is not None:
            params["code"] = code

        if uri is not None:
            params["uri"] = uri

        return self._get(self.describe_url, params=params)

    # =========================================================
    # LOOKUP
    # =========================================================

    def lookup(self, uri):
        """
        Lookup a Foundation URI in the selected
        ICD-11 linearization.
        """

        params = {"uri": uri}

        return self._get(self.lookup_url, params=params)

    # =========================================================
    # EXTRACT USEFUL SEARCH RESULTS
    # =========================================================

    def extract_search_results(self, response, top_matches_per_result=3):
        """
        Extract the useful information from the large WHO
        search response.

        Returns a compact list containing:

        - ICD-11 code
        - title
        - overall score
        - chapter
        - leaf status
        - postcoordination availability
        - coding note status
        - best matching terms
        """

        results = []

        # WHO search response contains destinationEntities
        entities = response.get("destinationEntities", [])

        for entity in entities:
            # -------------------------------------------------
            # Basic information
            # -------------------------------------------------

            code = entity.get("theCode")
            title = entity.get("title", "")
            score = entity.get("score")

            # Remove WHO highlighting HTML
            title = self._clean_html(title)

            # -------------------------------------------------
            # Matching properties
            # -------------------------------------------------

            matching_pvs = entity.get("matchingPVs", [])

            useful_matches = []

            for pv in matching_pvs:
                label = pv.get("label", "")

                label = self._clean_html(label)

                useful_matches.append(
                    {
                        "type": pv.get("propertyId"),
                        "label": label,
                        "score": pv.get("score"),
                    }
                )

            # -------------------------------------------------
            # Sort matching properties by score
            # -------------------------------------------------

            useful_matches.sort(
                key=lambda x: x["score"] if x["score"] is not None else float("-inf"),
                reverse=True,
            )

            # Keep only the best few
            useful_matches = useful_matches[:top_matches_per_result]

            # -------------------------------------------------
            # Foundation URI
            # -------------------------------------------------

            foundation_uri = None

            if matching_pvs:
                foundation_uri = matching_pvs[0].get("foundationUri")

            # -------------------------------------------------
            # Compact result
            # -------------------------------------------------

            compact_result = {
                "code": code,
                "title": title,
                "score": score,
                "chapter": entity.get("chapter"),
                "foundation_uri": foundation_uri,
                "is_leaf": entity.get("isLeaf"),
                "postcoordination_available": (
                    entity.get("postcoordinationAvailability") is not None
                    and entity.get("postcoordinationAvailability") > 0
                ),
                "has_coding_note": entity.get("hasCodingNote"),
                "matched_terms": useful_matches,
            }

            results.append(compact_result)

        return results

    # =========================================================
    # CLEAN WHO HIGHLIGHTING
    # =========================================================

    @staticmethod
    def _clean_html(text):

        if not text:
            return text

        # Remove <em class='found'> and </em>
        text = re.sub(r"<[^>]+>", "", text)

        return text
