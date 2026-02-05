export interface Patient {
    id: number;
    patientName: string;
    room: string;
    admissionDate: string;
    condition: string;
    physician: string;
    department: string;
    age: number;
    status: 'pending' | 'ready' | 'discharged';
    dischargeDate?: string;
}

export interface MedicineItem {
    id: number;
    name: string;
    dosage: string;
    quantity: number;
    unitPrice: number;
}

export interface DiagnosticItem {
    id: number;
    name: string;
    cost: number;
}

export interface BillingRecord {
    id: number;
    patientId: number;
    isFinalized: boolean;
    finalizedDate?: string;
    patientName: string;
    hospitalId: string;
    admissionDate: string;
    dischargeDate: string;
    roomWard: string;
    roomType: string;
    numberOfDays: number;
    ratePerDay: number;
    attendingPhysicianFee: number;
    specialistFee: number;
    surgeonFee: number;
    otherProfessionalFees: number;
    medicines: MedicineItem[];
    dietType: string;
    mealsPerDay: number;
    dietDuration: number;
    costPerMeal: number;
    diagnostics: DiagnosticItem[];
    suppliesCharge: number;
    procedureCharge: number;
    nursingCharge: number;
    miscellaneousCharge: number;
    discount: number;
    philhealthCoverage: number;
    paymentStatus?: 'Paid' | 'Pending' | 'Partial';
    payments?: Array<{ id?: number; or_number: string; amount: number | string }>;
}
