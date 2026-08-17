/**
 * AYUSH CodeBridge - FHIR Clinical Record Builder
 * Generates valid FHIR R4 Condition Resources with multi-system codings
 */

document.addEventListener("DOMContentLoaded", () => {
  initFHIRBuilder();
});

let currentGeneratedFHIR = null;

function initFHIRBuilder() {
  const generateBtn = document.getElementById("btn-generate-fhir");
  const saveBtn = document.getElementById("btn-save-problem-list");
  const diagSelect = document.getElementById("fhir-diag-select");

  if (diagSelect) {
    diagSelect.addEventListener("change", async (e) => {
      const diagName = e.target.value;
      const diagObj = await window.api.getDiagnosisById(diagName);
      updateFHIRFormDiagnosisPreview(diagObj);
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      await handleGenerateFHIR();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      await handleGenerateFHIR();
      window.showToast("FHIR Condition saved to Patient Problem List!", "success");
    });
  }

  // Copy & Download JSON buttons inside Modal
  const copyBtn = document.getElementById("btn-copy-fhir-json");
  const downloadBtn = document.getElementById("btn-download-fhir-json");

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (currentGeneratedFHIR) {
        window.copyToClipboard(JSON.stringify(currentGeneratedFHIR, null, 2), "FHIR Condition JSON copied!");
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (currentGeneratedFHIR) {
        downloadJSONFile(currentGeneratedFHIR, `FHIR_Condition_${currentGeneratedFHIR.id}.json`);
      }
    });
  }
}

/**
 * Update coding checkboxes based on selected diagnosis
 */
function updateFHIRFormDiagnosisPreview(diagObj) {
  const codeNamaste = document.getElementById("fhir-code-namaste");
  const codeTM2 = document.getElementById("fhir-code-tm2");
  const codeICD11 = document.getElementById("fhir-code-icd11");

  if (codeNamaste) codeNamaste.innerText = `${diagObj.namaste.code} (${diagObj.name})`;
  if (codeTM2) codeTM2.innerText = `${diagObj.tm2.code} (Traditional Medicine Module 2)`;
  if (codeICD11) {
    codeICD11.innerText = diagObj.biomedical.hasEquivalent 
      ? `${diagObj.biomedical.code} (${diagObj.biomedical.display})`
      : `No direct equivalent (Preserved Concept)`;
  }
}

/**
 * Generate FHIR Resource and display in Modal & Preview Pane
 */
async function handleGenerateFHIR() {
  const patientName = document.getElementById("fhir-patient-name")?.value || "Rahul Mehta";
  const abhaId = document.getElementById("fhir-patient-abha")?.value || "91-8472-9012-3456";
  const encounterId = document.getElementById("fhir-encounter-id")?.value || "OPD-2026-0817-092";
  const diagName = document.getElementById("fhir-diag-select")?.value || "Amavata";

  const includeNamaste = document.getElementById("chk-namaste")?.checked ?? true;
  const includeTM2 = document.getElementById("chk-tm2")?.checked ?? true;
  const includeBiomedical = document.getElementById("chk-biomedical")?.checked ?? true;

  const diagnosisObj = await window.api.getDiagnosisById(diagName);

  const patientData = { patientName, abhaId, encounterId };
  const codings = { diagnosis: diagnosisObj, includeNamaste, includeTM2, includeBiomedical };

  const fhirResource = await window.api.generateFHIRCondition(patientData, codings);
  currentGeneratedFHIR = fhirResource;

  // Render formatted JSON in preview pane and modal
  renderFHIRJSONOutput(fhirResource);

  // Open Modal
  window.openModal("modal-fhir-json");
  window.showToast("FHIR R4 Condition Generated Successfully", "success");
}

function renderFHIRJSONOutput(fhirObj) {
  const jsonStr = JSON.stringify(fhirObj, null, 2);
  const modalCodeEl = document.getElementById("modal-fhir-code-display");
  const inlineCodeEl = document.getElementById("inline-fhir-code-display");

  if (modalCodeEl) {
    modalCodeEl.textContent = jsonStr;
    if (window.Prism) window.Prism.highlightElement(modalCodeEl);
  }
  if (inlineCodeEl) {
    inlineCodeEl.textContent = jsonStr;
    if (window.Prism) window.Prism.highlightElement(inlineCodeEl);
  }
}

/**
 * Download JSON helper
 */
function downloadJSONFile(contentObj, filename) {
  const blob = new Blob([JSON.stringify(contentObj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.showToast(`Downloaded ${filename}`, "info");
}
