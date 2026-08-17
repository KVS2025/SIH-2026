/**
 * AyuSutra - API Layer
 * Clean abstraction for Terminology, ConceptMap & FHIR operations
 */

class AyuSutraAPI {
  constructor() {
    this.useMock = true; // Easily flip to false for FastAPI backend
    this.baseUrl = "/api/v1";
  }

  // Simulate network delay for realistic response feeling
  async _delay(ms = 120) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search terminology catalog across NAMASTE, TM2, and ICD-11
   */
  async searchTerminology(query = "") {
    await this._delay(100);
    const q = query.trim().toLowerCase();
    if (!q) return window.AYUSH_MOCK_DATA.diagnoses;

    return window.AYUSH_MOCK_DATA.diagnoses.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.namaste.code.toLowerCase().includes(q) ||
      item.tm2.code.toLowerCase().includes(q) ||
      (item.biomedical.code && item.biomedical.code.toLowerCase().includes(q)) ||
      item.synonyms.some(s => s.toLowerCase().includes(q))
    );
  }

  /**
   * Retrieve single diagnosis detail by ID or name
   */
  async getDiagnosisById(idOrName) {
    await this._delay(80);
    const key = idOrName.toLowerCase();
    return window.AYUSH_MOCK_DATA.diagnoses.find(d => 
      d.id.toLowerCase() === key || d.name.toLowerCase() === key
    ) || window.AYUSH_MOCK_DATA.diagnoses[0];
  }

  /**
   * Perform $translate code mapping operation between source and target systems
   */
  async translateCode(sourceSystem, code, targetSystem) {
    await this._delay(150);
    const diagnosis = window.AYUSH_MOCK_DATA.diagnoses.find(d => 
      d.namaste.code === code || d.tm2.code === code || d.biomedical.code === code
    ) || window.AYUSH_MOCK_DATA.diagnoses[0];

    let targetResult = {};
    if (targetSystem.includes("TM2") || targetSystem.includes("tm2")) {
      targetResult = {
        code: diagnosis.tm2.code,
        display: diagnosis.tm2.display,
        system: diagnosis.tm2.system,
        relationship: diagnosis.tm2.relationship,
        confidence: "100%",
        warnings: null
      };
    } else if (targetSystem.includes("Biomedical") || targetSystem.includes("icd11")) {
      if (diagnosis.biomedical.hasEquivalent) {
        targetResult = {
          code: diagnosis.biomedical.code,
          display: diagnosis.biomedical.display,
          system: diagnosis.biomedical.system,
          relationship: diagnosis.biomedical.relationship,
          confidence: `${diagnosis.biomedical.confidence}%`,
          warnings: null
        };
      } else {
        targetResult = {
          code: "NO DIRECT EQUIVALENT",
          display: diagnosis.biomedical.display,
          system: diagnosis.biomedical.system,
          relationship: "No-Map",
          confidence: "0%",
          warnings: "Concept is preserved in TM2 without forcing an inaccurate biomedical code."
        };
      }
    } else {
      targetResult = {
        code: diagnosis.namaste.code,
        display: diagnosis.namaste.display,
        system: diagnosis.namaste.system,
        relationship: "Exact",
        confidence: "100%",
        warnings: null
      };
    }

    return {
      status: "success",
      source: { system: sourceSystem, code: code, term: diagnosis.name },
      target: targetResult,
      provenance: diagnosis.mappingRationale
    };
  }

  /**
   * Generate valid FHIR R4 Condition Resource JSON
   */
  async generateFHIRCondition(patientData, codings) {
    await this._delay(180);
    const diagnosis = codings.diagnosis || window.AYUSH_MOCK_DATA.diagnoses[0];

    const fhirCodingArray = [];

    // Always append NAMASTE
    if (codings.includeNamaste !== false) {
      fhirCodingArray.push({
        system: diagnosis.namaste.systemUri,
        code: diagnosis.namaste.code,
        display: diagnosis.namaste.display,
        userSelected: true
      });
    }

    // Always append TM2
    if (codings.includeTM2 !== false) {
      fhirCodingArray.push({
        system: diagnosis.tm2.systemUri,
        code: diagnosis.tm2.code,
        display: diagnosis.tm2.display,
        extension: [
          {
            url: "http://hl7.org/fhir/StructureDefinition/conceptmap-relationship",
            valueCode: diagnosis.tm2.relationshipUri
          }
        ]
      });
    }

    // Append Biomedical if present
    if (codings.includeBiomedical && diagnosis.biomedical.hasEquivalent) {
      fhirCodingArray.push({
        system: diagnosis.biomedical.systemUri,
        code: diagnosis.biomedical.code,
        display: diagnosis.biomedical.display,
        extension: [
          {
            url: "http://hl7.org/fhir/StructureDefinition/conceptmap-relationship",
            valueCode: diagnosis.biomedical.relationshipUri
          }
        ]
      });
    }

    const fhirResource = {
      resourceType: "Condition",
      id: "ayusutra-cond-" + Math.floor(100000 + Math.random() * 900000),
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString(),
        profile: [
          "http://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition",
          "http://hl7.org/fhir/uv/term-server/StructureDefinition/interop-condition"
        ]
      },
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
            display: "Active"
          }
        ]
      },
      verificationStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: "confirmed",
            display: "Confirmed"
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "problem-list-item",
              display: "Problem List Item"
            }
          ]
        }
      ],
      code: {
        text: diagnosis.name,
        coding: fhirCodingArray
      },
      subject: {
        reference: `Patient/${patientData.abhaId || "91-8472-9012-3456"}`,
        display: patientData.patientName || "Rahul Mehta"
      },
      encounter: {
        reference: `Encounter/${patientData.encounterId || "OPD-2026-0817-092"}`,
        display: "OPD Consultation - AIIMS AYUSH Center"
      },
      onsetDateTime: new Date().toISOString().split('T')[0],
      recordedDate: new Date().toISOString(),
      recorder: {
        display: "Dr. Ananya Sharma (Senior Clinical Informationist)"
      },
      note: [
        {
          text: `Clinician mapped via AyuSutra Terminology Interoperability Engine. Mapping Confidence: ${diagnosis.mappingRationale.confidence}. Provenance: ${diagnosis.mappingRationale.provenance}`
        }
      ]
    };

    return fhirResource;
  }

  async getVersions() {
    await this._delay(60);
    return window.AYUSH_MOCK_DATA.versions;
  }

  async getAuditLogs() {
    await this._delay(60);
    return window.AYUSH_MOCK_DATA.auditLogs;
  }

  async getHealthMetrics() {
    await this._delay(60);
    return window.AYUSH_MOCK_DATA.healthMetrics;
  }
}

window.api = new AyuSutraAPI();
