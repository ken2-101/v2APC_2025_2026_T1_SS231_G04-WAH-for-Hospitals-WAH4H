// src/services/admissionService.ts
import api from "./api"; // Shared Axios instance
import type { Admission, NewAdmission } from "@/types/admission";

export const admissionService = {
  /**
   * List all encounters (admissions)
   */
  getAll: async (): Promise<Admission[]> => {
    const { data } = await api.get<any>("/api/admission/encounters/");
    // Handle DRF pagination
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      return data.results;
    }
    // Handle non-paginated list
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  },

  /**
   * Get single encounter details
   */
  getById: async (id: number): Promise<Admission> => {
    const { data } = await api.get<Admission>(`/api/admission/encounters/${id}/`);
    return data;
  },

  /**
   * Admit a patient (Create Encounter)
   */
  create: async (admission: NewAdmission): Promise<Admission> => {
    const { data } = await api.post<Admission>("/api/admission/encounters/", admission);
    return data;
  },

  /**
   * Update encounter details
   */
  update: async (id: number, admission: Partial<Admission>): Promise<Admission> => {
    const { data } = await api.put<Admission>(`/api/admission/encounters/${id}/`, admission);
    return data;
  },

  /**
   * Discharge patient
   */
  discharge: async (id: number, dischargeData: { period_end: string; discharge_disposition?: string; discharge_destination_id?: number }): Promise<Admission> => {
    const { data } = await api.post<Admission>(`/api/admission/encounters/${id}/discharge/`, dischargeData);
    return data;
  },

  /**
   * Delete encounter (if needed/allowed)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/admission/encounters/${id}/`);
  },
};
