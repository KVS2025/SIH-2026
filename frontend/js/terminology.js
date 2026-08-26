/**
 * AYUSH CodeBridge - Terminology & Diagnostic Explorer Logic
 * Handles interactive diagnosis search, autocomplete, side-by-side cards, and mapping flow diagram
 */

document.addEventListener("DOMContentLoaded", () => {
  initTerminologySearch();
  initAccordion();
  initCatalog();
});

let catalogRecords = [];

async function initCatalog() {
  const tableBody = document.getElementById("catalog-table-body");
  if (!tableBody) return;

  const searchInput = document.getElementById("catalog-search");
  const filters = [
    document.getElementById("filter-status"),
    document.getElementById("filter-category"),
    document.getElementById("filter-source")
  ];

  renderCatalogState("Loading catalog concepts...", "", "loading");
  try {
    catalogRecords = await window.api.searchTerminology("");
    populateCatalogFilters(catalogRecords);
    renderCatalogTable(applyCatalogFilters(searchInput?.value || "", filters));
  } catch (error) {
    renderCatalogState("Unable to load catalog concepts", "Please check the backend connection and try again.", "error");
    return;
  }

  searchInput?.addEventListener("input", async event => {
    renderCatalogState("Loading catalog concepts...", "", "loading");
    try {
      catalogRecords = await window.api.searchTerminology(event.target.value);
      renderCatalogTable(applyCatalogFilters(event.target.value, filters));
    } catch (error) {
      renderCatalogState("Unable to load catalog concepts", "Please check the backend connection and try again.", "error");
    }
  });

  filters.forEach(filter => filter?.addEventListener("change", () => {
    renderCatalogTable(applyCatalogFilters(searchInput?.value || "", filters));
  }));
}

function populateCatalogFilters(records) {
  const categories = [...new Set(records.map(record => record.databaseRecord?.demo_case_type).filter(Boolean))].sort();
  const sources = [...new Set(records.map(record => record.databaseRecord?.mapping_source).filter(Boolean))].sort();
  populateCatalogFilter("filter-category", "Category", categories);
  populateCatalogFilter("filter-source", "Source", sources);
}

function populateCatalogFilter(id, label, values) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = `<option value="all">${label}</option>`;
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function applyCatalogFilters(query, filters) {
  const normalizedQuery = query.trim().toLowerCase();
  const [statusFilter, categoryFilter, sourceFilter] = filters.map(filter => filter?.value || "all");
  return catalogRecords.filter(record => {
    const databaseRecord = record.databaseRecord || {};
    const searchableText = [record.name, record.sanskrit, record.namaste?.code, record.tm2?.code, record.definition]
      .filter(Boolean).join(" ").toLowerCase();
    const status = databaseRecord.needs_review ? "review" : "active";
    return (!normalizedQuery || searchableText.includes(normalizedQuery))
      && (statusFilter === "all" || status === statusFilter)
      && (categoryFilter === "all" || databaseRecord.demo_case_type === categoryFilter)
      && (sourceFilter === "all" || databaseRecord.mapping_source === sourceFilter);
  });
}

function renderCatalogState(title, detail, state) {
  const tbody = document.getElementById("catalog-table-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td class="catalog-state" colspan="6"><strong>${title}</strong>${detail ? `<span>${detail}</span>` : ""}</td></tr>`;
  tbody.closest(".catalog-table-wrapper")?.setAttribute("data-state", state);
}

function escapeCatalogText(value) {
  const element = document.createElement("div");
  element.textContent = value == null ? "" : String(value);
  return element.innerHTML;
}

function renderCatalogTable(items) {
  const tbody = document.getElementById("catalog-table-body");
  const count = document.getElementById("catalog-count");
  if (!tbody) return;
  if (count) count.textContent = `${items.length} concept${items.length === 1 ? "" : "s"}`;

  if (items.length === 0) {
    renderCatalogState("No concepts found", "Try adjusting your search or filters.", "empty");
    return;
  }

  tbody.innerHTML = items.map(item => {
    const databaseRecord = item.databaseRecord || {};
    return `
      <tr>
        <td><div class="catalog-concept-name">${escapeCatalogText(item.name)}</div><div class="catalog-concept-category">${escapeCatalogText(item.systemCategory)}</div></td>
        <td class="catalog-sanskrit">${escapeCatalogText(item.sanskrit || item.namaste?.display)}</td>
        <td><span class="code-badge namaste">${escapeCatalogText(item.namaste?.code)}</span></td>
        <td><span class="code-badge tm2">${escapeCatalogText(item.tm2?.code)}</span></td>
        <td class="definition-cell">${escapeCatalogText(item.definition)}</td>
        <td><a href="dashboard.html?diag=${encodeURIComponent(item.name)}" class="catalog-inspect-link">Inspect <i data-lucide="arrow-right" aria-hidden="true"></i></a></td>
      </tr>`;
  }).join("");
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Initialize main autocomplete search box
 */
function initTerminologySearch() {
  const searchInput = document.getElementById("main-diag-search");
  const dropdown = document.getElementById("search-autocomplete-dropdown");
  const clearBtn = document.getElementById("search-clear-btn");

  if (!searchInput) return;

  // Search input typing listener
  searchInput.addEventListener("input", async (e) => {
    const query = e.target.value;
    if (query.trim().length === 0) {
      if (dropdown) dropdown.classList.remove("active");
      return;
    }

    const results = await window.api.searchTerminology(query);
    renderAutocompleteDropdown(results, dropdown, searchInput);
  });

  // Clear button click
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      if (dropdown) dropdown.classList.remove("active");
      searchInput.focus();
    });
  }

  // Click outside closes dropdown
  document.addEventListener("click", (e) => {
    if (dropdown && !searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });

  // Recent quick search chip clicks
  const chips = document.querySelectorAll(".recent-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const termName = chip.getAttribute("data-term") || chip.innerText.trim();
      selectDiagnosisByName(termName);
    });
  });
}

/**
 * Render Autocomplete Dropdown list
 */
function renderAutocompleteDropdown(results, dropdown, searchInput) {
  if (!dropdown) return;
  dropdown.innerHTML = "";

  if (results.length === 0) {
    dropdown.innerHTML = `
      <div class="autocomplete-item" style="cursor:default;">
        <div class="auto-term-name">No terminology match found</div>
        <div class="auto-term-category">Try searching "Amavata", "Kasa", or "Arsha"</div>
      </div>
    `;
    dropdown.classList.add("active");
    return;
  }

  results.forEach(item => {
    const el = document.createElement("div");
    el.className = "autocomplete-item";
    el.innerHTML = `
      <div>
        <div class="auto-term-name">${item.name}</div>
        <div class="auto-term-category">${item.systemCategory}</div>
      </div>
      <div class="auto-codes-strip">
        <span class="code-chip namaste">NAMASTE: ${item.namaste.code}</span>
        <span class="code-chip tm2">TM2: ${item.tm2.code}</span>
        <span class="code-chip icd11">ICD-11: ${item.biomedical.hasEquivalent ? item.biomedical.code : 'NO MAP'}</span>
      </div>
    `;

    el.addEventListener("click", () => {
      searchInput.value = item.name;
      dropdown.classList.remove("active");
      renderDiagnosisDetailView(item);
    });

    dropdown.appendChild(el);
  });

  dropdown.classList.add("active");
}

/**
 * Select diagnosis by name directly
 */
window.selectDiagnosisByName = async function(name) {
  const diagnosis = await window.api.getDiagnosisById(name);
  const searchInput = document.getElementById("main-diag-search");
  if (searchInput) searchInput.value = diagnosis.name;
  renderDiagnosisDetailView(diagnosis);
};

/**
 * Update Side-by-Side Three Cards View & Mapping Flow Diagram
 */
function renderDiagnosisDetailView(diagnosis) {
  const container = document.getElementById("diagnosis-detail-section");
  if (!container) return;

  // Make sure container is visible
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth", block: "start" });

  // 1. Title Header
  const titleEl = document.getElementById("detail-diagnosis-title");
  const descEl = document.getElementById("detail-diagnosis-desc");
  if (titleEl) titleEl.innerText = diagnosis.name;
  if (descEl) descEl.innerText = `${diagnosis.systemCategory} • ${diagnosis.definition}`;

  // 2. Card 1 - NAMASTE
  const cardNamaste = document.getElementById("card-namaste-content");
  if (cardNamaste) {
    cardNamaste.innerHTML = `
      <div class="card-header-badge">
        <span class="system-tag namaste">NAMASTE • INDIA</span>
        <span class="demo-notice">Demo Mapping</span>
      </div>
      <div class="card-code-display">${diagnosis.namaste.code}</div>
      <div class="card-term-title">${diagnosis.namaste.display}</div>
      <div class="card-meta-list">
        <div class="meta-row">
          <span class="meta-label">System</span>
          <span class="meta-value">National AYUSH Terminology</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Source</span>
          <span class="meta-value">${diagnosis.namaste.source}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Category</span>
          <span class="meta-value">${diagnosis.namaste.category}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Version</span>
          <span class="meta-value">${diagnosis.namaste.version}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Status</span>
          <span class="meta-value" style="color:var(--status-success)">● ${diagnosis.namaste.status}</span>
        </div>
      </div>
      <button class="btn btn-secondary w-full" onclick="showToast('Viewing NAMASTE concept definition for ${diagnosis.namaste.code}', 'info')">
        <i data-lucide="book-open"></i> View Concept
      </button>
    `;
  }

  // 3. Card 2 - WHO ICD-11 TM2
  const cardTM2 = document.getElementById("card-tm2-content");
  if (cardTM2) {
    cardTM2.innerHTML = `
      <div class="card-header-badge">
        <span class="system-tag tm2">ICD-11 TM2 • WHO</span>
        <span class="demo-notice">Demo Mapping</span>
      </div>
      <div class="card-code-display">${diagnosis.tm2.code}</div>
      <div class="card-term-title">${diagnosis.tm2.display}</div>
      <div class="card-meta-list">
        <div class="meta-row">
          <span class="meta-label">Classification</span>
          <span class="meta-value">Traditional Medicine (TM2)</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Relationship</span>
          <span class="meta-value"><span class="relationship-badge exact">✓ ${diagnosis.tm2.relationship}</span></span>
        </div>
        <div class="meta-row">
          <span class="meta-label">System URI</span>
          <span class="meta-value" style="font-size:0.75rem">who.int/icd/tm2</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Mapping Type</span>
          <span class="meta-value">ConceptMap Equivalence</span>
        </div>
      </div>
      <button class="btn btn-secondary w-full" onclick="showToast('Accessing WHO ICD-11 TM2 Registry for ${diagnosis.tm2.code}', 'info')">
        <i data-lucide="external-link"></i> View WHO Concept
      </button>
    `;
  }

  // 4. Card 3 - ICD-11 Biomedical (OR Special "NO DIRECT EQUIVALENT" Card)
  const cardICD11 = document.getElementById("card-icd11-content");
  if (cardICD11) {
    if (diagnosis.biomedical.hasEquivalent) {
      cardICD11.innerHTML = `
        <div class="card-header-badge">
          <span class="system-tag icd11">ICD-11 • BIOMEDICINE</span>
          <span class="demo-notice">Demo Mapping</span>
        </div>
        <div class="card-code-display">${diagnosis.biomedical.code}</div>
        <div class="card-term-title">${diagnosis.biomedical.display}</div>
        <div class="card-meta-list">
          <div class="meta-row">
            <span class="meta-label">Relationship</span>
            <span class="meta-value"><span class="relationship-badge related">${diagnosis.biomedical.relationship}</span></span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Mapping Confidence</span>
            <span class="meta-value" style="color:var(--color-blue); font-weight:800">${diagnosis.biomedical.confidence}%</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Classification</span>
            <span class="meta-value">Biomedical MMS</span>
          </div>
        </div>
        <button class="btn btn-blue w-full" onclick="showToast('Accessing ICD-11 Biomedical MMS browser', 'info')">
          <i data-lucide="file-text"></i> View Biomedical Code
        </button>
      `;
    } else {
      // PROMPT REQUIREMENT: Show "NO DIRECT EQUIVALENT: The traditional medicine concept is preserved without forcing a biomedical classification."
      cardICD11.innerHTML = `
        <div class="card-header-badge">
          <span class="system-tag icd11">ICD-11 • BIOMEDICINE</span>
          <span class="demo-notice">Preservation Policy</span>
        </div>
        <div class="no-equivalent-box">
          <div class="no-equivalent-title">NO DIRECT EQUIVALENT</div>
          <div class="no-equivalent-desc">
            The traditional medicine concept is preserved without forcing a biomedical classification.
          </div>
        </div>
        <div class="card-meta-list">
          <div class="meta-row">
            <span class="meta-label">Relationship</span>
            <span class="meta-value"><span class="relationship-badge no-eq">No Direct Map</span></span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Interoperability Protocol</span>
            <span class="meta-value">FHIR TM2 Native Code</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Clinical Safety</span>
            <span class="meta-value" style="color:var(--status-success)">Non-Reductionist</span>
          </div>
        </div>
        <button class="btn btn-outline w-full" disabled style="opacity:0.6; cursor:not-allowed">
          <i data-lucide="shield-alert"></i> Preserved Concept Only
        </button>
      `;
    }
  }

  // 5. Update Mapping Diagram Flow Nodes
  const nodeNamaste = document.getElementById("flow-node-namaste");
  const nodeTM2 = document.getElementById("flow-node-tm2");
  const nodeICD11 = document.getElementById("flow-node-icd11");
  const relBadge1 = document.getElementById("flow-rel-badge-1");
  const relBadge2 = document.getElementById("flow-rel-badge-2");

  if (nodeNamaste) {
    nodeNamaste.querySelector(".node-code").innerText = diagnosis.namaste.code;
    nodeNamaste.querySelector(".node-term").innerText = diagnosis.name;
  }
  if (nodeTM2) {
    nodeTM2.querySelector(".node-code").innerText = diagnosis.tm2.code;
    nodeTM2.querySelector(".node-term").innerText = "TM2 Traditional";
  }
  if (nodeICD11) {
    nodeICD11.querySelector(".node-code").innerText = diagnosis.biomedical.hasEquivalent ? diagnosis.biomedical.code : "NO MAP";
    nodeICD11.querySelector(".node-term").innerText = diagnosis.biomedical.hasEquivalent ? "Biomedical MMS" : "Preserved Concept";
  }
  if (relBadge1) relBadge1.innerText = `${diagnosis.tm2.relationship}`;
  if (relBadge2) relBadge2.innerText = `${diagnosis.biomedical.relationship}`;

  // 6. Update "Why This Mapping?" Accordion Details
  const rType = document.getElementById("rationale-mapping-type");
  const rSource = document.getElementById("rationale-source");
  const rVer = document.getElementById("rationale-version");
  const rConf = document.getElementById("rationale-confidence");
  const rProv = document.getElementById("rationale-provenance");
  const rDate = document.getElementById("rationale-date");

  if (rType) rType.innerText = diagnosis.mappingRationale.mappingType;
  if (rSource) rSource.innerText = diagnosis.mappingRationale.source;
  if (rVer) rVer.innerText = diagnosis.mappingRationale.version;
  if (rConf) rConf.innerText = diagnosis.mappingRationale.confidence;
  if (rProv) rProv.innerText = diagnosis.mappingRationale.provenance;
  if (rDate) rDate.innerText = diagnosis.mappingRationale.lastUpdated;

  // Re-initialize icons inside dynamically updated cards
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Accordion Toggle Handler
 */
function initAccordion() {
  const accordion = document.querySelector(".mapping-rationale-accordion");
  if (!accordion) return;

  const header = accordion.querySelector(".accordion-header");
  if (header) {
    header.addEventListener("click", () => {
      accordion.classList.toggle("open");
    });
  }
}
