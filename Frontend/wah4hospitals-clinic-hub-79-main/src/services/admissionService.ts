// src/services/admissionService.ts
import axios, { AxiosInstance } from "axios";
import type { Admission, NewAdmission } from "@/types/admission"; // <- import NewAdmission

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.LOCAL_8080
      ? `${import.meta.env.LOCAL_8080}/api/admissions/`
      : import.meta.env.BACKEND_ADMISSIONS ||
      "https://sturdy-adventure-r4pv79wg54qxc5rwx-8000.app.github.dev/api/admissions/",
  headers: {
    "Content-Type": "application/json",
  },
});

const handleError = (error: any) => {
  console.error("AdmissionService error:", error);
  throw error;
};

export const admissionService = {
  getAll: async (): Promise<Admission[]> => {
    try {
      const { data } = await api.get<Admission[]>("");
      return data;
    } catch (error) {
      handleError(error);
    }
  },

  getById: async (id: number): Promise<Admission> => {
    try {
      const { data } = await api.get<Admission>(`${id}/`);
      return data;
    } catch (error) {
      handleError(error);
    }
  },

  // Use NewAdmission here so id is not required
  create: async (admission: NewAdmission): Promise<Admission> => {
    try {
      const { data } = await api.post<Admission>("", admission);
      return data;
    } catch (error) {
      handleError(error);
    }
  },

  update: async (id: number, admission: Admission): Promise<Admission> => {
    try {
      const { data } = await api.put<Admission>(`${id}/`, admission);
      return data;
    } catch (error) {
      handleError(error);
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`${id}/`);
    } catch (error) {
      handleError(error);
    }
  },
};
