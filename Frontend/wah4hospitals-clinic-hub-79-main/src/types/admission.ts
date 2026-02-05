// src/types/admission.ts

/**
 * Matches EncounterOutputSerializer in backend
 * Represents a read-only View/DTO of an admission.
 */
export interface Admission {
    encounter_id: number;
    identifier: string;
    status: string;
    class_field: string;
    type?: string | null;
    service_type?: string | null;
    priority?: string | null;
    
    subject_id: number;
    patient_summary?: {
        id?: number;
        patient_id?: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
        gender?: string;
        birthdate?: string;
        [key: string]: any;
    } | null;
    
    period_start?: string | null;
    period_end?: string | null;
    
    reason_code?: string | null;
    admit_source?: string | null;
    discharge_disposition?: string | null;
    
    location_id?: number | null;
    location_summary?: {
        id?: number;
        name?: string;
        [key: string]: any;
    } | null;
    
    participant_individual_id?: number | null;
    practitioner_summary?: {
        id?: number;
        full_name?: string;
        name?: string;
        [key: string]: any;
    } | null;
    
    created_at?: string | null;
    updated_at?: string | null;
}

/**
 * Matches EncounterInputSerializer in backend
 * Payload for creating a new admission.
 */
export interface NewAdmission {
    subject_id: number;
    class_field?: string;
    type?: string | null;
    service_type?: string | null;
    priority?: string | null;
    reason_code?: string | null;
    
    period_start?: string | null;
    location_id?: number | null;
    participant_individual_id?: number | null;
    participant_type?: string | null;
    
    admit_source?: string | null;
    account_id?: number | null;
    pre_admission_identifier?: string | null;
    location_status?: string | null;
}

