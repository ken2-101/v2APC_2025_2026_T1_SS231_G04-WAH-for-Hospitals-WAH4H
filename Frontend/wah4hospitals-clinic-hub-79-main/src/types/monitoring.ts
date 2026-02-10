export type PatientStatus = 'Stable' | 'Critical' | 'Observation' | 'Recovering';

/* =========================
   VITAL SIGNS
   ========================= */
export interface VitalSign {
    id: string;
    admissionId: string;          // maps to backend: admission
    dateTime: string;             // maps to backend: date_time
    bloodPressure: string;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    oxygenSaturation: number;
    staffName: string;            // maps to backend: staff_name
}

/* =========================
   CLINICAL NOTES
   ========================= */
export interface ClinicalNote {
    id: string;
    admissionId: string;          // backend: admission
    dateTime: string;             // backend: date_time
    type: 'SOAP' | 'Progress';    // 🔑 aligned with NOTE_TYPES
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    providerName: string;         // backend: provider_name
}

/* =========================
   DIETARY ORDERS
   ========================= */
export interface DietaryOrder {
    id?: string;
    admissionId: string;          // backend: admission (OneToOne)
    dietType: string;
    allergies: string[];
    npoResponse: boolean;
    activityLevel: string;
    orderedBy: string;            // backend: ordered_by
    lastUpdated: string;          // backend: last_updated
}

/* =========================
   HISTORY / TIMELINE
   ========================= */
export interface HistoryEvent {
    id: string;
    admissionId: string;          // backend: admission
    dateTime: string;             // backend: date_time
    category: 'Admission' | 'Vitals' | 'Note' | 'Procedure' | 'Medication' | 'Lab';
    description: string;
    details?: string;
}

/* =========================
   LABORATORY REQUESTS
   ========================= */
export interface LabRequest {
    id: string;
    admissionId: string;
    testName: string;
    testCode: string;                // LOINC code
    priority: 'routine' | 'urgent' | 'stat';
    notes: string;
    lifecycleStatus: 'ordered' | 'requested' | 'completed';
    orderedBy: string;
    orderedAt: string;
    requestedBy?: string;
    requestedAt?: string;
    completedAt?: string;
    resultContent?: {
        findings: string;
        values: { parameter: string; value: string; reference: string; flag?: string }[];
        interpretation: string;
        reportedBy: string;
        reportedAt: string;
    };
}

export interface LabResult {
    findings: string;
    values: { parameter: string; value: string; reference: string; flag?: string }[];
    interpretation: string;
    reportedBy: string;
    reportedAt: string;
}
   (UI AGGREGATE TYPE)
   ========================= */
export interface MonitoringAdmission {
    id: number;                   // admission.id
    patientId: number;
    patientName: string;
    room: string;
    doctorName: string;
    nurseName: string;
    status: PatientStatus;
    encounterType: string;
    admittingDiagnosis: string;
    reasonForAdmission: string;
    admissionCategory: string;
    modeOfArrival: string;
    admissionDate: string;
    attendingPhysician: string;
    assignedNurse?: string;
    ward: string;

    // Derived / related data
    lastVitals?: VitalSign;
    lastNote?: ClinicalNote;
    dietary?: DietaryOrder;
    history?: HistoryEvent[];
}
