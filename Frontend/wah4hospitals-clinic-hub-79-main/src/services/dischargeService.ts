// src/services/dischargeService.ts
import axios, { AxiosInstance } from "axios";
import type {
  DischargeRecord,
  PendingPatient,
  DischargedPatient,
  DischargeForm,
  NewDischargeRecord,
  DischargeRequirements,
} from "@/types/discharge";

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL}/api/discharge/`
      : import.meta.env.VITE_LOCAL_8000
        ? `${import.meta.env.VITE_LOCAL_8000}/api/discharge/`
        : 'http://localhost:8000/api/discharge/',
  headers: {
    "Content-Type": "application/json",
  },
});

const handleError = (error: any) => {
  console.error("DischargeService error:", error);
  throw error;
};

export const dischargeService = {
  // Get all discharge records
  getAll: async (): Promise<DischargeRecord[]> => {
    try {
      const { data } = await api.get<DischargeRecord[]>("");
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  // Get a single discharge record by ID
  getById: async (id: number): Promise<DischargeRecord> => {
    try {
      const { data } = await api.get<DischargeRecord>(`${id}/`);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  // Get pending discharges (pending or ready status)
  getPending: async (): Promise<PendingPatient[]> => {
    try {
      const { data } = await api.get<PendingPatient[]>("discharges/pending/");
      // Map backend field names to frontend expected names
      return data.map(discharge => ({
        ...discharge,
        id: discharge.discharge_id || discharge.id || 0,
        status: discharge.workflow_status || discharge.status || 'pending'
      }));
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  // Get ready for discharge patients
  getReady: async (): Promise<PendingPatient[]> => {
    try {
      const { data } = await api.get<PendingPatient[]>("discharges/ready/");
      return data.map(discharge => ({
        ...discharge,
        id: discharge.discharge_id || discharge.id || 0,
        status: 'ready' as const
      }));
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  // Get discharged patients
  getDischarged: async (): Promise<DischargedPatient[]> => {
    try {
      const { data } = await api.get<DischargedPatient[]>("discharges/discharged/");
      return data.map(patient => ({
        ...patient,
        id: patient.discharge_id || patient.id || 0
      }));
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  // Create a new discharge record
  create: async (discharge: NewDischargeRecord): Promise<DischargeRecord> => {
    try {
      const { data } = await api.post<DischargeRecord>("", discharge);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  // Update a discharge record
  update: async (id: number, discharge: Partial<DischargeRecord>): Promise<DischargeRecord> => {
    try {
      const { data } = await api.put<DischargeRecord>(`${id}/`, discharge);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  // Partial update of a discharge record
  patch: async (id: number, discharge: Partial<DischargeRecord>): Promise<DischargeRecord> => {
    try {
      const { data } = await api.patch<DischargeRecord>(`${id}/`, discharge);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  // Delete a discharge record
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`${id}/`);
    } catch (error) {
      handleError(error);
    }
  },

  // Process discharge (submit discharge form)
  processDischarge: async (id: number, form: DischargeForm): Promise<DischargeRecord> => {
    try {
      const { data } = await api.post<DischargeRecord>(`${id}/process_discharge/`, form);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  // Update discharge requirements checklist
  updateRequirements: async (
    id: number,
    requirements: Partial<DischargeRequirements>
  ): Promise<any> => {
    try {
      const { data } = await api.patch<any>(`discharges/${id}/update_requirements/`, {
        requirements,
      });
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  // Complete discharge process
  completeDischarge: async (id: number, form: Partial<DischargeForm>): Promise<any> => {
    try {
      const { data } = await api.post<any>(`discharges/${id}/complete/`, form);
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },

  // Search/filter discharge records
  search: async (params: {
    status?: string;
    department?: string;
    condition?: string;
    search?: string;
  }): Promise<DischargeRecord[]> => {
    try {
      const { data } = await api.get<DischargeRecord[]>("", { params });
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  // Get patients from billing records eligible for discharge
  getFromBilling: async (): Promise<any> => {
    try {
      const { data } = await api.get("from_billing/");
      return data;
    } catch (error) {
      handleError(error);
      return { count: 0, patients: [] };
    }
  },

  // Create discharge records from billing records
  createFromBilling: async (billingIds: number[]): Promise<any> => {
    try {
      const { data } = await api.post("discharges/create_from_billing/", { billing_ids: billingIds });
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },
};
