export type PatientStatus = 'Stable' | 'Critical';

export interface VitalSign {
    id: string;
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
    npoResponse: boolean; // True if NPO
    activityLevel: string;
    lastUpdated: string;
    orderedBy: string;
}

export interface HistoryEvent {
    id: string;
    dateTime: string;
    category: 'Vitals' | 'Note' | 'Medication' | 'Lab' | 'Procedure' | 'Admission';
    description: string;
    details?: string;
}

export interface MonitoringPatient {
    id: string;
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
