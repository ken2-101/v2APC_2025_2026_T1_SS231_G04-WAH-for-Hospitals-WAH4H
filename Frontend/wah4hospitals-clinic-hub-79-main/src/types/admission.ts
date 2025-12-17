// src/types/admission.ts

// Full Admission type for fetched/existing records
export interface Admission {
    id: string; // internal DB ID
    admission_id: string; // human-readable admission number
    patient: string; // patient ID
    patient_details?: any; // optional nested patient info
    admission_date: string;
    attending_physician: string;
    assigned_nurse: string; // included
    ward: string;
    room: string;
    bed: string;
    status: 'Active' | 'Discharged' | 'Transferred';
    encounter_type: 'Inpatient';
    admitting_diagnosis: string;
    reason_for_admission: string;
    admission_category: 'Emergency' | 'Regular';
    mode_of_arrival: 'Walk-in' | 'Ambulance' | 'Referral';
}

// Type used when creating a new admission (backend generates admission_id)
export type NewAdmission = Omit<Admission, 'id' | 'patient_details' | 'admission_id'>;

// Payload type for creating a new admission
// admission_id is optional because backend generates it
export type CreateAdmission = Omit<Admission, 'id' | 'patient_details'> & {
    admission_id?: string;
};

// Bed structure for hospital rooms
export interface Bed {
    id: string;
    number: string;
    isOccupied: boolean;
}

// Room structure containing beds
export interface Room {
    id: string;
    number: string;
    ward: string;
    capacity: number;
    occupied: number;
    beds: Bed[];
}
