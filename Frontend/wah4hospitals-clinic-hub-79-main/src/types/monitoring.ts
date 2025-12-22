export type PatientStatus = 'Stable' | 'Critical';

export interface VitalSign {
    id: string;
    admissionId: string; // links to admission
    dateTime: string;
    bloodPressure: string; // format: "systolic/diastolic"
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
    admissionId: string; // links to admission
    dateTime: string;
    type: 'SOAP' | 'Progress' | 'Rounds';
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    providerName: string;
}

export interface DietaryOrder {
    admissionId: string; // links to admission
    dietType: string;
    fluidRestrictions?: string;
    allergies: string[];
    npoResponse: boolean; // True if NPO
    activityLevel: string;
    lastUpdated: string;
    orderedBy: string;
}

export interface HistoryEvent {
    id: string;
    admissionId: string; // links to admission
    dateTime: string;
    category: 'Vitals' | 'Note' | 'Medication' | 'Lab' | 'Procedure' | 'Admission';
    description: string;
    details?: string;
}

export interface MonitoringPatient {
    id: string; // this is admissionId
    patientId: string; // actual patient reference
    patientName: string;
    room: string;
    doctorName: string;
    nurseName: string;
    status: PatientStatus;
    lastVitals?: VitalSign;
    lastNote?: ClinicalNote;
    dietary?: DietaryOrder;
    history?: HistoryEvent[];
}
