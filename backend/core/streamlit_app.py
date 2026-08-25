"""Thin Streamlit client for the NAMASTE terminology service."""

import requests
import streamlit as st

st.set_page_config(
    page_title="NAMASTE Terminology Workbench", page_icon="🩺", layout="wide"
)
API_DEFAULT = "http://localhost:8000"


def api_get(path: str, params: dict | None = None, timeout: int = 10):
    """Call an existing GET endpoint and render a friendly error on failure."""
    try:
        response = requests.get(
            f"{st.session_state.api_base.rstrip('/')}{path}",
            params=params,
            timeout=timeout,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as exc:
        st.warning(
            "That terminology code was not found."
            if exc.response is not None and exc.response.status_code == 404
            else f"Backend returned an HTTP error: {exc}"
        )
    except requests.exceptions.Timeout:
        st.error("The backend took too long to respond. Please try again.")
    except requests.exceptions.ConnectionError:
        st.error(
            "Backend unavailable. Start FastAPI with: `uvicorn application.main:app --reload --port 8000`"
        )
    except ValueError:
        st.error("The backend returned invalid JSON.")
    return None


def check_backend(show_message: bool = True) -> bool:
    """Check the backend health endpoint."""
    health = api_get("/", timeout=5)
    connected = isinstance(health, dict) and health.get("status") == "ok"
    if show_message:
        (st.sidebar.success if connected else st.sidebar.error)(
            "Backend connected" if connected else "Backend unavailable"
        )
    return connected


def get_concept(code: str):
    """Fetch one NAMASTE concept."""
    return api_get(f"/CodeSystem/{code.strip()}") if code.strip() else None


def autocomplete(query: str):
    """Fetch the plain-list autocomplete response."""
    data = api_get("/ValueSet/$expand", params={"filter": query})
    return data if isinstance(data, list) else []


def get_codesystem():
    """Fetch the complete CodeSystem resource."""
    data = api_get("/CodeSystem", timeout=15)
    return data if isinstance(data, dict) else None


def translate(code: str):
    """Fetch the existing translation response."""
    return api_get("/translate", params={"namaste_code": code}, timeout=30)


def render_raw(data: dict):
    """Render a collapsed developer response panel."""
    with st.expander("Developer: Raw API Response"):
        st.json(data)


def render_concept(concept: dict):
    """Render a reusable NAMASTE concept card."""
    designation = concept.get("designation") or []
    sanskrit = (
        designation[0].get("value", "Not supplied") if designation else "Not supplied"
    )
    st.markdown('<div class="concept-panel">', unsafe_allow_html=True)
    st.caption("NAMASTE CONCEPT")
    col1, col2, col3 = st.columns(3)
    col1.metric("Code", concept.get("code", "-"))
    col2.metric("Preferred Term", concept.get("display", "-"))
    col3.metric("Sanskrit Term", sanskrit)
    st.markdown("**Definition**")
    st.write(concept.get("definition", "No definition supplied."))
    st.caption("CodeSystem · NAMASTE Ayurveda")
    st.markdown("</div>", unsafe_allow_html=True)


def score_value(candidate: dict) -> float:
    """Return a bounded score for a Streamlit progress bar."""
    try:
        return min(max(float(candidate.get("score", 0)), 0.0), 1.0)
    except (TypeError, ValueError):
        return 0.0


def render_candidates(candidates: list, title: str):
    """Render candidate codes, displays, and retrieval similarity scores."""
    st.markdown(f"#### {title}")
    if not candidates:
        st.caption("No candidates returned.")
        return
    for candidate in candidates:
        left, right = st.columns([3, 2])
        with left:
            st.markdown(f"**{candidate.get('display', 'Unnamed candidate')}**")
            st.caption(candidate.get("code", "Code unavailable"))
        with right:
            score = score_value(candidate)
            st.progress(score, text=f"Similarity · {score:.2f}")


def render_status(result: dict):
    """Render status copy based only on the backend mapping_type."""
    status = result.get("mapping_type", "unknown")
    descriptions = {
        "direct": (
            "DIRECT MAPPING",
            "An existing mapping was found in the terminology database.",
            st.success,
        ),
        "candidates_only": (
            "CANDIDATES RETRIEVED",
            "Semantic retrieval produced candidates; no final mapping has been selected or validated.",
            st.warning,
        ),
        "no_confident_match": (
            "NO CONFIDENT MATCH",
            "No sufficiently confident retrieval match was found.",
            st.error,
        ),
        "postcoordinated": (
            "POSTCOORDINATED",
            "The backend returned a postcoordinated mapping.",
            st.success,
        ),
    }
    title, message, renderer = descriptions.get(
        status,
        (
            status.upper(),
            "The backend returned an unrecognized mapping state.",
            st.info,
        ),
    )
    st.markdown(f"### {title}")
    renderer(message)


def render_translation(result: dict):
    """Render source, retrieval, status, confidence, and honest future-stage placeholders."""
    source = result.get("source_namaste", {})
    st.markdown("### Step 1 · NAMASTE Source")
    source_cols = st.columns(3)
    source_cols[0].metric("Code", source.get("code", "-"))
    source_cols[1].metric("Term", source.get("display", "-"))
    source_cols[2].metric("System", "NAMASTE Ayurveda")
    st.markdown("### Step 2 · Semantic Retrieval")
    stem_col, pattern_col = st.columns(2)
    with stem_col:
        render_candidates(
            result.get("retrieved_stem_candidates") or [], "TM2 STEM CANDIDATES"
        )
    with pattern_col:
        render_candidates(
            result.get("retrieved_pattern_candidates") or [], "TM2 PATTERN CANDIDATES"
        )
    st.markdown("### Step 3 · Current Mapping Status")
    render_status(result)
    if result.get("result"):
        st.markdown("#### ICD-11 TM2 Mapping")
        for coding in result["result"]:
            st.success(
                f"{coding.get('code', '-')} · {coding.get('display', 'Display unavailable')}"
            )
        st.caption(
            "Prototype / illustrative code. Not verified as an official WHO mapping by this frontend."
        )
    if result.get("postcoordination_expression"):
        st.code(result["postcoordination_expression"], language="text")
    st.markdown("### Step 4 · Confidence")
    confidence = result.get("confidence_score")
    if confidence is None:
        st.info("No confidence score was returned by the backend.")
    else:
        bounded = score_value({"score": confidence})
        confidence_cols = st.columns([1, 3])
        confidence_cols[0].metric("Retrieval Confidence", f"{bounded:.2f}")
        confidence_cols[1].progress(
            bounded, text="Retrieval confidence · not validation"
        )
    st.markdown("### Step 5 · LLM Reasoning")
    if result.get("reasoning"):
        st.info(result["reasoning"])
    else:
        st.caption(
            "Not implemented yet. The current backend performs semantic retrieval only."
        )
    st.markdown("### Step 6 · WHO ICD-11 Validation")
    st.warning(
        "Pending · not implemented in the current backend. No WHO validation is claimed."
    )
    st.markdown("### Step 7 · Clinician Review")
    if result.get("needs_clinician_review"):
        st.warning(
            "Clinician review required. The current mapping has not been automatically confirmed."
        )
    else:
        st.success(
            "No clinician review is currently required based on the backend response."
        )
    if result.get("message"):
        st.caption(result["message"])
    render_raw(result)


def render_pipeline_status():
    """Show which terminology workflow stages are live or pending."""
    st.markdown("### Implementation Status")
    for label, live in [
        ("NAMASTE terminology", True),
        ("Semantic retrieval", True),
        ("LLM reasoning", False),
        ("WHO ICD-11 validation", False),
        ("Clinician confirmation", False),
        ("Mapping persistence", False),
        ("FHIR Bundle integration", False),
    ]:
        st.markdown(
            f"{'✅' if live else '🟡'} **{label}** · {'Live' if live else 'Pending'}"
        )


def page_concept_lookup():
    """Render the dedicated concept inspection page."""
    st.title("Concept Lookup")
    st.caption("Inspect a NAMASTE Ayurveda terminology concept.")
    code = st.text_input("NAMASTE Code", placeholder="NAMC-A001", key="concept_code")
    if st.button("Search Concept", type="primary") and code.strip():
        concept = get_concept(code)
        if concept:
            st.session_state.lookup_concept = concept
    concept = st.session_state.get("lookup_concept")
    if concept:
        render_concept(concept)
        if st.button("Translate this Concept", key="lookup_translate"):
            result = translate(concept["code"])
            if result:
                st.session_state.lookup_translation = result
        if st.session_state.get("lookup_translation"):
            render_translation(st.session_state.lookup_translation)


def page_browse_codesystem():
    """Render a locally filterable CodeSystem browser with a selected detail panel."""
    st.title("Browse CodeSystem")
    st.caption("Explore the NAMASTE Ayurveda terminology.")
    if st.button("Load CodeSystem", type="primary"):
        st.session_state.codesystem = get_codesystem()
    data = st.session_state.get("codesystem")
    if not data:
        st.info("Load the CodeSystem to begin browsing.")
        return
    meta_cols = st.columns(4)
    meta_cols[0].metric("Concepts", data.get("count", 0))
    meta_cols[1].metric("Status", data.get("status", "-"))
    meta_cols[2].metric("Name", data.get("name", "-"))
    meta_cols[3].metric("Content", data.get("content", "-"))
    st.caption(data.get("url", "CodeSystem URL unavailable"))
    query = st.text_input("Search concepts...", key="browse_query").lower().strip()
    concepts = data.get("concept", [])
    filtered = []
    for concept in concepts:
        sanskrit = (concept.get("designation") or [{}])[0].get("value", "")
        searchable = " ".join(
            [
                concept.get("code", ""),
                concept.get("display", ""),
                concept.get("definition", ""),
                sanskrit,
            ]
        ).lower()
        if not query or query in searchable:
            filtered.append(
                {
                    "Code": concept.get("code", ""),
                    "Term": concept.get("display", ""),
                    "Sanskrit": sanskrit,
                    "Definition": concept.get("definition", ""),
                }
            )
    st.caption(
        f"Showing {len(filtered)} of {data.get('count', len(concepts))} concepts"
    )
    st.dataframe(filtered, use_container_width=True, hide_index=True)
    options = {f"{item['Code']} · {item['Term']}": item["Code"] for item in filtered}
    if options:
        selected = st.selectbox(
            "Select a concept for details", list(options), key="browse_selected"
        )
        selected_concept = next(
            (item for item in concepts if item.get("code") == options[selected]), None
        )
        if selected_concept:
            render_concept(selected_concept)
            if st.button("Translate", key="browse_translate"):
                result = translate(selected_concept["code"])
                if result:
                    render_translation(result)
    render_raw(data)


def page_autocomplete():
    """Render the EMR-style terminology autocomplete page."""
    st.title("Autocomplete Search")
    st.caption(
        "Search NAMASTE terminology as a clinician would while entering a diagnosis."
    )
    query = st.text_input(
        "Search diagnosis, symptom or clinical term...", key="autocomplete_query"
    )
    if not query.strip():
        st.info("Enter a term such as cold, joint, fever, or headache.")
        return
    matches = autocomplete(query.strip())
    if not matches:
        st.info("No terminology matches found.")
        return
    options = {
        f"{item.get('code', '-')} · {item.get('display', '-')}": item
        for item in matches
    }
    selected = options[
        st.selectbox("Suggestions", list(options), key="autocomplete_selected")
    ]
    st.markdown("### Selected Diagnosis")
    st.write(f"**NAMASTE Code:** `{selected.get('code', '-')}`")
    st.write(f"**Term:** {selected.get('display', '-')}")
    if st.button(
        "Translate to ICD-11 TM2", type="primary", key="autocomplete_translate"
    ):
        result = translate(selected.get("code", ""))
        if result:
            render_translation(result)
    render_raw({"matches": matches})


def page_translate():
    """Render the main translation pipeline page."""
    st.title("Translate NAMASTE Code")
    st.caption(
        "Retrieve and inspect the current NAMASTE → ICD-11 TM2 mapping pipeline."
    )
    code = st.text_input("NAMASTE Code", placeholder="NAMC-A001", key="translate_code")
    if st.button("Translate", type="primary") and code.strip():
        with st.spinner("Retrieving terminology mapping..."):
            result = translate(code.strip())
        if result:
            st.session_state.translation = result
    if st.session_state.get("translation"):
        render_translation(st.session_state.translation)
        render_pipeline_status()


if "api_base" not in st.session_state:
    st.session_state.api_base = API_DEFAULT
with st.sidebar:
    st.markdown("# 🩺 NAMASTE ↔ ICD-11 TM2")
    st.caption("Terminology workbench")
    st.session_state.api_base = st.text_input(
        "Backend URL", value=st.session_state.api_base
    )
    navigation = st.radio(
        "Navigation",
        [
            "Concept Lookup",
            "Browse CodeSystem",
            "Autocomplete Search",
            "Translate Code",
        ],
        label_visibility="collapsed",
    )
    if st.button("Check Backend Connection"):
        check_backend()
    st.divider()
    st.markdown("**About**")
    st.caption(
        "FHIR-shaped terminology micro-service prototype for NAMASTE Ayurveda terminology and ICD-11 TM2 mapping."
    )
    st.caption("Prototype TM2 codes are illustrative and are not verified WHO codes.")

st.markdown(
    """
<style>
:root { --line: rgba(124,169,198,.22); --panel: rgba(22,42,59,.62); --cyan: #56c7d9; }
.stApp { background: radial-gradient(circle at 85% 0%, rgba(39,106,145,.2), transparent 31rem), linear-gradient(135deg, #0b1824 0%, #102738 55%, #0a1722 100%); }
[data-testid="stSidebar"] { background: #09151f; border-right: 1px solid var(--line); }
.block-container { max-width: 1440px; padding: 2.4rem 4rem 4rem; }
.concept-panel { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 1.2rem 1.4rem; margin: 1rem 0 1.5rem; }
[data-testid="stMetric"] { background: rgba(17,35,49,.72); border: 1px solid var(--line); border-radius: 8px; padding: .75rem 1rem; }
h1 { font-weight: 650; } h3 { color: var(--cyan); }
</style>
""",
    unsafe_allow_html=True,
)

if navigation == "Concept Lookup":
    page_concept_lookup()
elif navigation == "Browse CodeSystem":
    page_browse_codesystem()
elif navigation == "Autocomplete Search":
    page_autocomplete()
else:
    page_translate()
