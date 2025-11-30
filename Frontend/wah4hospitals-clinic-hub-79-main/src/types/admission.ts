export interface Admission {
    id: string;
    patient: string; // ID of the patient
    patient_details?: any; // Nested patient details
    admission_date: string;
    attending_physician: string;
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
