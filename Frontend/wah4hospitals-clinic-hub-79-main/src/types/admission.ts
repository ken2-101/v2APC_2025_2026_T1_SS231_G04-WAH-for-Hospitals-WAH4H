// src/types/admission.ts

export interface Admission {
    id: string; // required for existing/fetched admissions
    admission_id: string; // human-readable admission number
    patient: string; // ID of the patient
    patient_details?: any; // optional nested details
    admission_date: string;
    attending_physician: string;
    assigned_nurse: string; // ✅ included
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

// Type used when creating a new admission (id is not needed)
export type NewAdmission = Omit<Admission, 'id' | 'patient_details'>;

// Bed structure for rooms
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
