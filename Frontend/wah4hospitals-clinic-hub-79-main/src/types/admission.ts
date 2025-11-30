export interface Admission {
    id: string;
    patientId: string;
    patientName: string;
    admissionDate: string;
    attendingPhysician: string;
    ward: string;
    room: string;
    bed: string;
    status: 'Active' | 'Discharged' | 'Transferred';
    encounterType: 'Inpatient';
    admittingDiagnosis: string;
    reasonForAdmission: string;
    admissionCategory: 'Emergency' | 'Regular';
    modeOfArrival: 'Walk-in' | 'Ambulance' | 'Referral';
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
