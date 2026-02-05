// src/types/admission.ts

/**
 * Matches EncounterOutputSerializer in backend
 */
export interface Admission {
    encounter_id: number; // primary key
    identifier: string; // generated ID (e.g. ENC-123)
    status: string;
    class_field: string; // 'inpatient', 'outpatient', etc.
    type?: string;
    service_type?: string;
    priority?: string;
    
    subject_id: number; // Patient ID
    patient_summary?: Record<string, any>; // Flattened patient info
    
    period_start?: string; // Admission date
    period_end?: string; // Discharge date
    
    reason_code?: string;
    admit_source?: string;
    discharge_disposition?: string;
    
    location_id?: number;
    location_summary?: Record<string, any>; // Flattened location info
    
    participant_individual_id?: number; // Practitioner ID
    practitioner_summary?: Record<string, any>; // Flattened practitioner info
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Matches EncounterInputSerializer in backend
 */
export interface NewAdmission {
    subject_id: number;
    class_field?: string; // default: 'inpatient'
    type?: string;
    service_type?: string;
    priority?: string;
    reason_code?: string;
    
    period_start?: string;
    location_id?: number;
    participant_individual_id?: number;
    participant_type?: string;
    
    admit_source?: string;
    account_id?: number;
    pre_admission_identifier?: string;
}

