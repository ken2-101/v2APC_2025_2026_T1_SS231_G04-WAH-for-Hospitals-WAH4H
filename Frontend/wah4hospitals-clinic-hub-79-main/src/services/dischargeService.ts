// src/services/dischargeService.ts
import axios, { AxiosInstance } from "axios";

// Types matching backend models
export interface DischargeRequirements {
  id?: number;
  admission: number;
  final_diagnosis: boolean;
  physician_signature: boolean;
  medication_reconciliation: boolean;
  discharge_summary: boolean;
  billing_clearance: boolean;
  nursing_notes: boolean;
  follow_up_scheduled: boolean;
  is_ready?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DischargeRecord {
  id?: number;
  patient: number;
  patient_details?: any;
  admission: number;
  admission_details?: any;
  patient_name: string;
  room: string;
  admission_date: string;
  discharge_date?: string | null;
  condition: string;
  physician: string;
  department: string;
  age: number;
  final_diagnosis: string;
  discharge_summary: string;
  follow_up_required: boolean;
  follow_up_plan?: string | null;
  status: 'pending' | 'ready' | 'discharged';
  requirements?: DischargeRequirements;
  created_at?: string;
  updated_at?: string;
}

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL: "https://sturdy-adventure-r4pv79wg54qxc5rwx-8000.app.github.dev/api/discharge/",
  headers: {
    "Content-Type": "application/json",
  },
});

const handleError = (error: any) => {
  console.error("DischargeService error:", error);
  throw error;
};

export const dischargeService = {
  // Discharge Records
  getAllRecords: async (): Promise<DischargeRecord[]> => {
    try {
      const { data } = await api.get<DischargeRecord[]>("records/");
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  getRecordById: async (id: number): Promise<DischargeRecord> => {
    try {
      const { data } = await api.get<DischargeRecord>(`records/${id}/`);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  getDischargedPatients: async (): Promise<DischargeRecord[]> => {
    try {
      const { data } = await api.get<DischargeRecord[]>("records/discharged_patients/");
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  getPendingDischarges: async (): Promise<DischargeRecord[]> => {
    try {
      const { data } = await api.get<DischargeRecord[]>("records/pending_discharges/");
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  getReadyForDischarge: async (): Promise<DischargeRecord[]> => {
    try {
      const { data } = await api.get<DischargeRecord[]>("records/ready_for_discharge/");
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  searchRecords: async (searchTerm: string): Promise<DischargeRecord[]> => {
    try {
      const { data } = await api.get<DischargeRecord[]>(`records/?search=${searchTerm}`);
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  filterByStatus: async (status: 'pending' | 'ready' | 'discharged'): Promise<DischargeRecord[]> => {
    try {
      const { data } = await api.get<DischargeRecord[]>(`records/?status=${status}`);
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  createRecord: async (record: Omit<DischargeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<DischargeRecord> => {
    try {
      const { data } = await api.post<DischargeRecord>("records/", record);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  updateRecord: async (id: number, record: Partial<DischargeRecord>): Promise<DischargeRecord> => {
    try {
      const { data } = await api.patch<DischargeRecord>(`records/${id}/`, record);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  markAsDischarge: async (id: number, dischargeDate?: string): Promise<DischargeRecord> => {
    try {
      const { data } = await api.post<DischargeRecord>(`records/${id}/mark_discharged/`, {
        discharge_date: dischargeDate || new Date().toISOString().split('T')[0]
      });
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  markAsReady: async (id: number): Promise<DischargeRecord> => {
    try {
      const { data } = await api.post<DischargeRecord>(`records/${id}/mark_ready/`);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  deleteRecord: async (id: number): Promise<void> => {
    try {
      await api.delete(`records/${id}/`);
    } catch (error) {
      handleError(error);
    }
  },

  // Discharge Requirements
  getAllRequirements: async (): Promise<DischargeRequirements[]> => {
    try {
      const { data } = await api.get<DischargeRequirements[]>("requirements/");
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  getRequirementsByAdmission: async (admissionId: number): Promise<DischargeRequirements[]> => {
    try {
      const { data } = await api.get<DischargeRequirements[]>(`requirements/?admission=${admissionId}`);
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  getRequirementById: async (id: number): Promise<DischargeRequirements> => {
    try {
      const { data } = await api.get<DischargeRequirements>(`requirements/${id}/`);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  createRequirements: async (requirements: Omit<DischargeRequirements, 'id' | 'created_at' | 'updated_at' | 'is_ready'>): Promise<DischargeRequirements> => {
    try {
      const { data } = await api.post<DischargeRequirements>("requirements/", requirements);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  updateRequirements: async (id: number, requirements: Partial<DischargeRequirements>): Promise<DischargeRequirements> => {
    try {
      const { data } = await api.patch<DischargeRequirements>(`requirements/${id}/`, requirements);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  deleteRequirements: async (id: number): Promise<void> => {
    try {
      await api.delete(`requirements/${id}/`);
    } catch (error) {
      handleError(error);
    }
  }
};
