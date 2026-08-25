/**
 * AYUSH CodeBridge - Mock Data Layer
 * Comprehensive realistic datasets for NAMASTE, WHO ICD-11 TM2, and ICD-11 Biomedical
 */

window.AYUSH_MOCK_DATA = {
  // Primary Terminology Mapping Catalog
  diagnoses: [
    {
      id: "diag-amavata",
      name: "Amavata",
      systemCategory: "Ayurveda Diagnostic Concept",
      definition: "An Ayurvedic disease condition characterized by joint pain, swelling, stiffness, and fever caused by accumulation of Ama (undigested toxic byproduct) and aggravation of Vata dosha in joints.",
      synonyms: ["Rheumatoid arthritis-like condition", "Ama-Vata disorder", "Joint stiffness syndrome"],
      namaste: {
        code: "N12345",
        display: "Amavata (अमवात)",
        system: "National AYUSH Terminology (NAMASTE)",
        systemUri: "http://namaste.ayush.gov.in/codes",
        source: "Ministry of AYUSH, Govt of India",
        version: "2026.08",
        status: "Active",
        category: "Kaya Chikitsa / Musculoskeletal",
        description: "Primary NAMASTE code for Amavata joint disorder."
      },
      tm2: {
        code: "TXXA1.2",
        display: "Traditional medicine condition characterized by joint pain and systemic Ama stiffness",
        system: "WHO ICD-11 Traditional Medicine Module 2 (TM2)",
        systemUri: "http://id.who.int/icd/release/11/2026/mms/tm2",
        relationship: "Exact",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#exactMatch",
        description: "Official WHO TM2 code mapped directly from NAMASTE N12345."
      },
      biomedical: {
        hasEquivalent: true,
        code: "MB25.1",
        display: "Rheumatoid arthritis, unspecified / Inflammatory polyarthropathy",
        system: "ICD-11 Biomedical MMS",
        systemUri: "http://id.who.int/icd/release/11/mms",
        relationship: "Related",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#relatedMatch",
        confidence: 92,
        description: "Biomedical ICD-11 equivalent sharing overlapping inflammatory polyarthritis features."
      },
      mappingRationale: {
        mappingType: "Exact (TM2) / Related (Biomedical)",
        source: "Official Ministry of AYUSH & WHO Joint Expert Working Group ConceptMap 2026",
        version: "TM2 2026.x",
        confidence: "High (92%)",
        provenance: "WHO ICD-11 TM2 Editorial Board / National AYUSH Terminology Cell",
        lastUpdated: "12 Aug 2026",
        isAiAssisted: false,
        notes: "Clinical consensus confirms high correlation between Amavata clinical criteria and ICD-11 TM2 TXXA1.2."
      }
    },
    {
      id: "diag-kasa",
      name: "Kasa",
      systemCategory: "Ayurveda Diagnostic Concept",
      definition: "Respiratory disorder involving cough, airway hyperresponsiveness, and Vata-Kapha vitiation in the Pranavaha Srotas.",
      synonyms: ["Cough disorder", "Bronchial reflex condition", "Pranavaha Srotas disorder"],
      namaste: {
        code: "N30412",
        display: "Kasa (कास)",
        system: "National AYUSH Terminology (NAMASTE)",
        systemUri: "http://namaste.ayush.gov.in/codes",
        source: "Ministry of AYUSH, Govt of India",
        version: "2026.08",
        status: "Active",
        category: "Pranavaha Srotas / Respiratory",
        description: "Primary NAMASTE concept for Kasa."
      },
      tm2: {
        code: "TXXR4.1",
        display: "Traditional medicine cough syndrome",
        system: "WHO ICD-11 Traditional Medicine Module 2 (TM2)",
        systemUri: "http://id.who.int/icd/release/11/2026/mms/tm2",
        relationship: "Exact",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#exactMatch",
        description: "WHO TM2 representation of traditional respiratory cough."
      },
      biomedical: {
        hasEquivalent: true,
        code: "MD11.0",
        display: "Cough / Acute bronchial cough syndrome",
        system: "ICD-11 Biomedical MMS",
        systemUri: "http://id.who.int/icd/release/11/mms",
        relationship: "Broader",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#broader",
        confidence: 88,
        description: "Biomedical classification for cough symptoms."
      },
      mappingRationale: {
        mappingType: "Exact (TM2) / Broader (Biomedical)",
        source: "WHO / AYUSH Interoperability Taskforce",
        version: "2026.08",
        confidence: "High (88%)",
        provenance: "AYUSH Terminology Portal",
        lastUpdated: "10 Aug 2026",
        isAiAssisted: false,
        notes: "Direct match in TM2 respiratory section."
      }
    },
    {
      id: "diag-arsha",
      name: "Arsha",
      systemCategory: "Ayurveda Diagnostic Concept",
      definition: "Anorectal vascular disorder marked by painful inflamed fleshy sprouts in the anal canal, corresponding to hemorrhoidal disease with specific Dosha predominance.",
      synonyms: ["Hemorrhoids", "Piles", "Guda Vrata disorder"],
      namaste: {
        code: "N48201",
        display: "Arsha (अर्शः)",
        system: "National AYUSH Terminology (NAMASTE)",
        systemUri: "http://namaste.ayush.gov.in/codes",
        source: "Ministry of AYUSH, Govt of India",
        version: "2026.08",
        status: "Active",
        category: "Shalya Tantra / Anorectal",
        description: "NAMASTE term for Ayurvedic anorectal condition Arsha."
      },
      tm2: {
        code: "TXXG2.4",
        display: "Traditional medicine anorectal vascular sprout disorder",
        system: "WHO ICD-11 Traditional Medicine Module 2 (TM2)",
        systemUri: "http://id.who.int/icd/release/11/2026/mms/tm2",
        relationship: "Exact",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#exactMatch",
        description: "WHO TM2 classification for Arsha."
      },
      biomedical: {
        hasEquivalent: true,
        code: "DB60.0",
        display: "Hemorrhoids / Internal & external hemorrhoidal disorder",
        system: "ICD-11 Biomedical MMS",
        systemUri: "http://id.who.int/icd/release/11/mms",
        relationship: "Exact",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#exactMatch",
        confidence: 96,
        description: "Direct anatomical and clinical match in ICD-11 Biomedical gastroenterology section."
      },
      mappingRationale: {
        mappingType: "Exact (TM2 & Biomedical)",
        source: "National AYUSH Terminology Expert Group",
        version: "2026.08",
        confidence: "Very High (96%)",
        provenance: "WHO & Ministry of AYUSH",
        lastUpdated: "08 Aug 2026",
        isAiAssisted: false,
        notes: "High degree of clinical alignment between Arsha and hemorrhoidal pathology."
      }
    },
    {
      id: "diag-prameha",
      name: "Prameha",
      systemCategory: "Ayurveda Diagnostic Concept",
      definition: "A broad spectrum of metabolic and urinary disorders marked by altered urinary frequency/characteristics, Medas (adipose) tissue disturbance, and eventual progression to Madhumeha.",
      synonyms: ["Metabolic syndrome precursor", "Urinary metabolic disorder", "Pre-diabetes spectrum"],
      namaste: {
        code: "N59014",
        display: "Prameha (प्रमेह)",
        system: "National AYUSH Terminology (NAMASTE)",
        systemUri: "http://namaste.ayush.gov.in/codes",
        source: "Ministry of AYUSH, Govt of India",
        version: "2026.08",
        status: "Active",
        category: "Kaya Chikitsa / Endocrine & Metabolic",
        description: "NAMASTE term for Prameha spectrum."
      },
      tm2: {
        code: "TXXE1.0",
        display: "Traditional medicine metabolic fluid & urinary dysfunction",
        system: "WHO ICD-11 Traditional Medicine Module 2 (TM2)",
        systemUri: "http://id.who.int/icd/release/11/2026/mms/tm2",
        relationship: "Exact",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#exactMatch",
        description: "TM2 concept for traditional metabolic disorder."
      },
      biomedical: {
        hasEquivalent: true,
        code: "5A11.0",
        display: "Type 2 diabetes mellitus / Impaired glucose tolerance spectrum",
        system: "ICD-11 Biomedical MMS",
        systemUri: "http://id.who.int/icd/release/11/mms",
        relationship: "Broader",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#broader",
        confidence: 85,
        description: "Biomedical metabolic category."
      },
      mappingRationale: {
        mappingType: "Exact (TM2) / Broader (Biomedical)",
        source: "AYUSH Interoperability Steering Committee",
        version: "2026.08",
        confidence: "High (85%)",
        provenance: "AYUSH / WHO Taskforce",
        lastUpdated: "14 Aug 2026",
        isAiAssisted: false,
        notes: "Prameha covers 20 sub-types; 5A11.0 represents the general diabetes/metabolic state."
      }
    },
    {
      id: "diag-vatakaphaja-gulma",
      name: "Vata-Kaphaja Gulma",
      systemCategory: "Ayurveda Diagnostic Concept",
      definition: "A specific Ayurvedic internal phantom tumor/palpable mass in the abdominal region caused by localized Vata and Kapha entrapment without fixed anatomical neoplasm structure.",
      synonyms: ["Abdominal phantom mass", "Dosha entrapment lump"],
      namaste: {
        code: "N77109",
        display: "Vata-Kaphaja Gulma (वातकफज गुल्म)",
        system: "National AYUSH Terminology (NAMASTE)",
        systemUri: "http://namaste.ayush.gov.in/codes",
        source: "Ministry of AYUSH, Govt of India",
        version: "2026.08",
        status: "Active",
        category: "Kaya Chikitsa / Abdominal Disorders",
        description: "NAMASTE term for Vata-Kapha abdominal lump."
      },
      tm2: {
        code: "TXXA9.8",
        display: "Traditional medicine localized abdominal gas/fluid entrapment mass",
        system: "WHO ICD-11 Traditional Medicine Module 2 (TM2)",
        systemUri: "http://id.who.int/icd/release/11/2026/mms/tm2",
        relationship: "Exact",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#exactMatch",
        description: "WHO TM2 exact representation."
      },
      biomedical: {
        hasEquivalent: false,
        code: "NO DIRECT EQUIVALENT",
        display: "No direct biomedical equivalent exists. Preserved in FHIR as TM2 concept without forcing an inaccurate ICD-11 Biomedical code.",
        system: "ICD-11 Biomedical MMS",
        systemUri: "http://id.who.int/icd/release/11/mms",
        relationship: "No-Map",
        relationshipUri: "http://hl7.org/fhir/concept-map-relationship#not-related-to",
        confidence: 0,
        description: "Unique traditional medicine concept preserved natively."
      },
      mappingRationale: {
        mappingType: "Exact (TM2) / No Direct Equivalent (Biomedical)",
        source: "WHO ICD-11 TM2 Principles of Non-Reductionist Mapping",
        version: "2026.08",
        confidence: "N/A (Preserved Concept)",
        provenance: "WHO ICD-11 Committee",
        lastUpdated: "15 Aug 2026",
        isAiAssisted: false,
        notes: "Crucial Clinical Safety Feature: traditional concept is preserved without forcing a false biomedical cancer or hernia code."
      }
    }
  ],

  // Terminology Release Version History & Sync Metrics
  versions: {
    namaste: { status: "Synced", version: "2026.08", lastSync: "2 hours ago", totalTerms: "4,520", publisher: "Ministry of AYUSH" },
    icd11: { status: "Synced", version: "Release 2026", lastSync: "2 hours ago", totalTerms: "17,000+", publisher: "World Health Organization" },
    tm2: { status: "Synced", version: "Release 2026", lastSync: "2 hours ago", totalTerms: "1,240", publisher: "WHO Traditional Medicine" }
  },

  // Audit Events Log
  auditLogs: [
    { timestamp: "17:42:13", action: "Diagnosis Searched", detail: "Searched term 'Amavata'", user: "Dr. Ananya Sharma", system: "NAMASTE Engine", mappingVersion: "v2026.08" },
    { timestamp: "17:42:15", action: "Mapping Retrieved", detail: "NAMASTE (N12345) ➔ TM2 (TXXA1.2) [ExactMatch]", user: "System Auto-Lookup", system: "ConceptMap Engine", mappingVersion: "v2026.08" },
    { timestamp: "17:42:18", action: "Clinician Confirmed", detail: "Confirmed relationship mapping for patient Rahul Mehta (ABHA: 91-8472-9012-3456)", user: "Dr. Ananya Sharma", system: "Clinical Workstation", mappingVersion: "v2026.08" },
    { timestamp: "17:42:21", action: "FHIR Condition Generated", detail: "Condition resource res_cond_98124 validated against FHIR R4 profile", user: "Dr. Ananya Sharma", system: "FHIR R4 Encoder", mappingVersion: "FHIR R4 v4.0.1" },
    { timestamp: "17:42:22", action: "Record Saved to Problem List", detail: "Successfully posted to ABDM EHR Repository", user: "Dr. Ananya Sharma", system: "ABDM Connector", mappingVersion: "FHIR R4" }
  ],

  // System Health Metrics
  healthMetrics: {
    services: [
      { name: "WHO ICD-11 API Gateway", status: "Operational", latency: "48ms", uptime: "99.98%" },
      { name: "NAMASTE Terminology DB", status: "Operational", latency: "12ms", uptime: "100.0%" },
      { name: "FHIR R4 Interop Server", status: "Operational", latency: "22ms", uptime: "99.95%" },
      { name: "ConceptMap Graph Engine", status: "Operational", latency: "18ms", uptime: "100.0%" },
      { name: "Elastic Terminology Index", status: "Operational", latency: "15ms", uptime: "99.99%" },
      { name: "ABDM Security Gateway", status: "Operational", latency: "9ms", uptime: "100.0%" }
    ],
    chartData: {
      labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
      requests: [1200, 950, 3400, 5800, 6200, 4900, 5120],
      latency: [24, 22, 35, 42, 38, 28, 26]
    }
  }
};
