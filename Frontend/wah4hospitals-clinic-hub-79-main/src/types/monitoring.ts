export type PatientStatus = 'Stable' | 'Critical';

export interface VitalSign {
    id: string;
    admissionId: string;
    dateTime: string;
    bloodPressure: string;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    oxygenSaturation: number;
    height?: number;
    weight?: number;
    staffName: string;
}

export interface ClinicalNote {
    id: string;
    admissionId: string;
    dateTime: string;
    type: 'SOAP' | 'Progress' | 'Rounds';
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    providerName: string;
}

export interface DietaryOrder {
    dietType: string;
    fluidRestrictions?: string;
    allergies: string[];
    npoResponse: boolean;
    activityLevel: string;
    lastUpdated: string;
    orderedBy: string;
    id?: string; // optional id to match backend
}

export interface HistoryEvent {
    id: string;
    admissionId: string;
    dateTime: string;
    category: 'Vitals' | 'Note' | 'Medication' | 'Lab' | 'Procedure' | 'Admission';
    description: string;
    details?: string;
}

// ✅ This is the type your dashboard/page expects
export interface MonitoringAdmission {
    id: number;
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
    lastVitals?: VitalSign;
    lastNote?: ClinicalNote;
    dietary?: DietaryOrder;
    history?: HistoryEvent[];
}
