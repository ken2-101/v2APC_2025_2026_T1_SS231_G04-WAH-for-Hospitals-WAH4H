// src/types/admission.ts

export interface Admission {
    id: string; // database ID
    admission_id: string; // pre-generated ID from backend
    patient: string; // ID of the patient
    patient_details?: any; // optional nested patient info
    admission_date: string;
    attending_physician: string;
    assigned_nurse: string; // added since backend provides this
    ward: string;
    room: string;
    bed: string;
    status: 'Active' | 'Discharged' | 'Transferred';
    encounter_type: string; // can be 'Inpatient' or ICD-10 etc.
    admitting_diagnosis: string;
    reason_for_admission: string;
    admission_category: 'Emergency' | 'Regular';
    mode_of_arrival: 'Walk-in' | 'Ambulance' | 'Referral';
    created_at?: string;
    updated_at?: string;
}

// Type used when creating a new admission (id and patient_details are not needed)
export type NewAdmission = Omit<Admission, 'id' | 'patient_details' | 'admission_id'>;

export interface Bed {
    id: string;
    number: string;
    isOccupied: boolean;
}

export interface Room {
    id: string;
    number: string;
    ward: string;
    capacity: number;
    occupied: number;
    beds: Bed[];
}
