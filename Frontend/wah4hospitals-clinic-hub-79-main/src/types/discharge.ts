// src/types/discharge.ts

export interface DischargeRequirements {
  finalDiagnosis: boolean;
  physicianSignature: boolean;
  medicationReconciliation: boolean;
  dischargeSummary: boolean;
  billingClearance: boolean;
  nursingNotes: boolean;
  followUpScheduled: boolean;
}

export interface DischargeRecord {
  id: number;
  patient: number;
  admission?: number;
  patientName: string;
  room: string;
  admissionDate: string;
  condition: string;
  status: 'pending' | 'ready' | 'discharged';
  physician: string;
  department: string;
  age: number;
  estimatedDischarge?: string;
  requirements: DischargeRequirements;
  dischargeDate?: string;
  finalDiagnosis?: string;
  dischargeSummary?: string;
  followUpRequired?: boolean;
  followUpPlan?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingPatient {
  id: number;
  patient_name: string;  // Backend uses snake_case
  room: string;
  admission_date: string;  // Backend uses snake_case
  condition: string;
  status: 'pending' | 'ready' | 'discharged';
  physician_name: string;  // Backend uses snake_case
  department: string;
  age: number;
  estimatedDischarge?: string;
  requirements: DischargeRequirements;
}

export interface DischargedPatient {
  id: number;
  patient_name: string;  // Backend uses snake_case
  room: string;
  admission_date: string;  // Backend uses snake_case
  dischargeDate: string;
  condition: string;
  physician_name: string;  // Backend uses snake_case
  department: string;
  age: number;
  finalDiagnosis: string;
  dischargeSummary: string;
  followUpRequired: boolean;
  followUpPlan?: string;
}

export interface DischargeForm {
  patientId: number;
  finalDiagnosis: string;
  hospitalStaySummary: string;
  dischargeMedications: string;
  dischargeInstructions: string;
  followUpPlan?: string;
  billingStatus: string;
  pendingItems?: string;
}

export interface NewDischargeRecord {
  patient: number;
  admission?: number;
  patientName: string;
  room: string;
  admissionDate: string;
  condition: string;
  status?: 'pending' | 'ready' | 'discharged';
  physician: string;
  department: string;
  age: number;
  estimatedDischarge?: string;
}
