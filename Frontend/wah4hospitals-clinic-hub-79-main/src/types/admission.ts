// src/types/admission.ts

export interface Admission {
    id: number | string;
    encounter_id?: number; 
    identifier?: string;   
    admissionNo: string;   
    status: string;
    priority: 'routine' | 'urgent' | 'emergency';
    patientId: string;
    patientName: string;
    location: {
        building: string;
        ward: string;
        room: string;
        bed: string;
    };
    location_ids?: (string | number)[];
    physician: string;
    serviceType: string;
    admissionDate: string;
    admissionTime?: string;
    dischargeDate?: string | null;
    
    // UI Aligned Fields
    encounterType: 'IMP' | 'EMER' | 'AMB' | 'HH';
    diagnosis: string;
    reasonForAdmission: string;
    admitSource: string;
    preAdmissionIdentifier?: string;
    isReadmission: boolean;
    dietPreference: string[];
    specialArrangements: string[];
    specialCourtesy: string[];
    
    // Backend Raw fields (optional)
    class_field?: string;
    type?: string;
    reason_code?: string;
    admit_source?: string;
    discharge_disposition?: string;
    period_start?: string;
    period_end?: string;
    diet_preference?: string;
    special_courtesy?: string;
    special_arrangement?: string;
    re_admission?: boolean;
    procedures?: any[]; 

    subject_id?: number;
    patient_summary?: any;
    location_summary?: any;
    practitioner_summary?: any;
}

export interface NewAdmission {
    patientId: string; // Internal Patient ID or Subject ID
    patientName: string;
    admissionDate: string;
    physician: string; // Name or ID
    serviceType: string;
    diagnosis: string;
    priority: 'routine' | 'urgent' | 'emergency';
    location: {
        building: string;
        ward: string;
        room: string;
        bed: string;
    };
    location_ids?: (string | number)[];
    admitSource: string;
    dietPreference: string[];
    specialArrangements: string[];
    specialCourtesy: string[];
    
    // Expanded fields for UI match
    encounterType: 'IMP' | 'EMER' | 'AMB' | 'HH';
    admissionTime: string;
    preAdmissionIdentifier?: string;
    isReadmission: boolean;
    reasonForAdmission?: string;

    // Backend mapping fields
    subject_id?: number;
    participant_individual_id?: number;
}

