export type LabTestType = 'CBC' | 'Urinalysis' | 'Fecalysis' | 'X-Ray' | 'Ultrasound' | 'ECG' | 'Blood Chemistry';
export type LabPriority = 'Routine' | 'STAT';
export type LabStatus = 'Pending' | 'In-Progress' | 'Completed';

export interface LabResult {
    testName: string;
    resultValue: string;
    unit: string;
    referenceRange: string;
    interpretation: string;
}

export interface LabRequest {
    id: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    testType: LabTestType;
    clinicalReason: string;
    priority: LabPriority;
    status: LabStatus;
    dateRequested: string;
    dateCompleted?: string;
    medicalTechnologist?: string;
    prcNumber?: string;
    results?: LabResult[];
}
