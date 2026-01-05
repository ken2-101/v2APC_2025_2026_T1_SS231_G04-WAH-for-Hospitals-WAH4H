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
    import.meta.env.LOCAL_8080
      ? `${import.meta.env.LOCAL_8080}/api/discharge/discharge-records/`
      : import.meta.env.BACKEND_DISCHARGE
        ? `${import.meta.env.BACKEND_DISCHARGE}/discharge-records/`
        : "https://sturdy-adventure-r4pv79wg54qxc5rwx-8000.app.github.dev/api/discharge/discharge-records/",
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
      const { data } = await api.get<PendingPatient[]>("pending/");
      return data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },

  // Get discharged patients
  getDischarged: async (): Promise<DischargedPatient[]> => {
    try {
      const { data } = await api.get<DischargedPatient[]>("discharged/");
      return data;
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
  ): Promise<DischargeRecord> => {
    try {
      const { data } = await api.patch<DischargeRecord>(`${id}/update_requirements/`, {
        requirements,
      });
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
      const { data } = await api.post("from_billing/", { billing_ids: billingIds });
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },
};
