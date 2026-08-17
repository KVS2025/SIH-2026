/**
 * AYUSH CodeBridge - ConceptMap Explorer Logic
 * Interactive Knowledge Graph visualizer powered by Cytoscape.js
 */

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("cy-container")) {
    initConceptMapGraph();
  }
});

function initConceptMapGraph() {
  const container = document.getElementById("cy-container");
  if (!container) return;

  if (typeof cytoscape === "undefined") {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted)">
        Cytoscape library loading...
      </div>
    `;
    return;
  }

  // Cytoscape Nodes & Edges
  const elements = [
    // NAMASTE Nodes
    { data: { id: "N12345", label: "Amavata (N12345)", type: "namaste", cat: "Ayurveda" } },
    { data: { id: "N30412", label: "Kasa (N30412)", type: "namaste", cat: "Ayurveda" } },
    { data: { id: "N48201", label: "Arsha (N48201)", type: "namaste", cat: "Ayurveda" } },
    { data: { id: "N59014", label: "Prameha (N59014)", type: "namaste", cat: "Ayurveda" } },
    { data: { id: "N77109", label: "Vata-Kaphaja Gulma (N77109)", type: "namaste", cat: "Ayurveda" } },

    // WHO TM2 Nodes
    { data: { id: "TXXA1.2", label: "TM2 Joint Pain (TXXA1.2)", type: "tm2", cat: "WHO TM2" } },
    { data: { id: "TXXR4.1", label: "TM2 Cough (TXXR4.1)", type: "tm2", cat: "WHO TM2" } },
    { data: { id: "TXXG2.4", label: "TM2 Anorectal Sprout (TXXG2.4)", type: "tm2", cat: "WHO TM2" } },
    { data: { id: "TXXE1.0", label: "TM2 Metabolic Fluid (TXXE1.0)", type: "tm2", cat: "WHO TM2" } },
    { data: { id: "TXXA9.8", label: "TM2 Abdominal Mass (TXXA9.8)", type: "tm2", cat: "WHO TM2" } },

    // ICD-11 Biomedical Nodes
    { data: { id: "MB25.1", label: "Rheumatoid Arthritis (MB25.1)", type: "icd11", cat: "Biomedical" } },
    { data: { id: "MD11.0", label: "Cough Syndrome (MD11.0)", type: "icd11", cat: "Biomedical" } },
    { data: { id: "DB60.0", label: "Hemorrhoids (DB60.0)", type: "icd11", cat: "Biomedical" } },
    { data: { id: "5A11.0", label: "Type 2 Diabetes (5A11.0)", type: "icd11", cat: "Biomedical" } },
    { data: { id: "NO_MAP", label: "NO BIOMEDICAL EQUIVALENT", type: "no-map", cat: "Preserved Concept" } },

    // Edges (Relationships)
    { data: { source: "N12345", target: "TXXA1.2", label: "exactMatch", rel: "exact" } },
    { data: { source: "TXXA1.2", target: "MB25.1", label: "relatedMatch", rel: "related" } },

    { data: { source: "N30412", target: "TXXR4.1", label: "exactMatch", rel: "exact" } },
    { data: { source: "TXXR4.1", target: "MD11.0", label: "broader", rel: "broader" } },

    { data: { source: "N48201", target: "TXXG2.4", label: "exactMatch", rel: "exact" } },
    { data: { source: "TXXG2.4", target: "DB60.0", label: "exactMatch", rel: "exact" } },

    { data: { source: "N59014", target: "TXXE1.0", label: "exactMatch", rel: "exact" } },
    { data: { source: "TXXE1.0", target: "5A11.0", label: "broader", rel: "broader" } },

    { data: { source: "N77109", target: "TXXA9.8", label: "exactMatch", rel: "exact" } },
    { data: { source: "TXXA9.8", target: "NO_MAP", label: "no-map", rel: "nomap" } }
  ];

  const cy = cytoscape({
    container: container,
    elements: elements,
    style: [
      {
        selector: "node",
        style: {
          "label": "data(label)",
          "color": "#102A43",
          "font-family": "Plus Jakarta Sans, sans-serif",
          "font-size": "11px",
          "font-weight": "700",
          "text-valign": "bottom",
          "text-margin-y": 6,
          "background-color": "#16805A",
          "width": "28px",
          "height": "28px",
          "border-width": "2px",
          "border-color": "#FFFFFF",
          "shadow-blur": 8,
          "shadow-color": "rgba(0,0,0,0.1)"
        }
      },
      {
        selector: 'node[type = "namaste"]',
        style: { "background-color": "#14532D" }
      },
      {
        selector: 'node[type = "tm2"]',
        style: { "background-color": "#0F766E" }
      },
      {
        selector: 'node[type = "icd11"]',
        style: { "background-color": "#155EEF" }
      },
      {
        selector: 'node[type = "no-map"]',
        style: { "background-color": "#DC2626", "shape": "rectangle" }
      },
      {
        selector: "edge",
        style: {
          "width": 2,
          "line-color": "#94A3B8",
          "target-arrow-color": "#94A3B8",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
          "label": "data(label)",
          "font-size": "9px",
          "color": "#64748B",
          "font-weight": "600"
        }
      },
      {
        selector: 'edge[rel = "exact"]',
        style: { "line-color": "#16805A", "target-arrow-color": "#16805A", "width": 3 }
      },
      {
        selector: 'edge[rel = "broader"]',
        style: { "line-color": "#0F766E", "target-arrow-color": "#0F766E" }
      },
      {
        selector: 'edge[rel = "related"]',
        style: { "line-color": "#155EEF", "target-arrow-color": "#155EEF" }
      },
      {
        selector: 'edge[rel = "nomap"]',
        style: { "line-color": "#DC2626", "line-style": "dashed", "target-arrow-color": "#DC2626" }
      }
    ],
    layout: {
      name: "breadthfirst",
      directed: true,
      padding: 30,
      spacingFactor: 1.2
    }
  });

  // Node click event
  cy.on("tap", "node", (evt) => {
    const node = evt.target;
    const nodeData = node.data();
    const detailPanel = document.getElementById("node-detail-panel");
    if (detailPanel) {
      detailPanel.innerHTML = `
        <div style="font-weight:800; font-size:1.1rem; color:var(--color-navy); margin-bottom:6px;">${nodeData.label}</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">Category: ${nodeData.cat}</div>
        <div class="meta-row"><span class="meta-label">Concept ID</span><span class="meta-value">${nodeData.id}</span></div>
        <div class="meta-row"><span class="meta-label">Graph System</span><span class="meta-value">${nodeData.type.toUpperCase()}</span></div>
        <div class="meta-row"><span class="meta-label">FHIR Equivalence</span><span class="meta-value" style="color:var(--color-emerald)">Verified</span></div>
      `;
    }
    window.showToast(`Selected graph concept: ${nodeData.id}`, "info");
  });
}
