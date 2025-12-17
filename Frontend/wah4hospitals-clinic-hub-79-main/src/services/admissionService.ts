// src/services/admissionService.ts
import axios, { AxiosInstance } from "axios";

// Define a type for an admission
export interface Admission {
  id?: number;
  patient_name: string;
  room: string;
  date_admitted?: string;
  [key: string]: any; // for future extra fields
}

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL: "https://supreme-memory-5w9pg5gjv59379g7-8000.app.github.dev/api/admissions/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to handle errors
const handleError = (error: any) => {
  console.error("AdmissionService error:", error);
  throw error;
};

// Get all admissions (optionally filtered by patient ID)
export const getAdmissions = async (patientId?: number): Promise<Admission[]> => {
  try {
    const url = patientId ? `?patient=${patientId}` : "";
    const { data } = await api.get(url);
    return data;
  } catch (error) {
    handleError(error);
  }
};

// Get a single admission by ID
export const getAdmissionById = async (id: number): Promise<Admission> => {
  try {
    const { data } = await api.get(`${id}/`);
    return data;
  } catch (error) {
    handleError(error);
  }
};

// Create a new admission
export const createAdmission = async (admission: Admission): Promise<Admission> => {
  try {
    const { data } = await api.post("", admission);
    return data;
  } catch (error) {
    handleError(error);
  }
};

// Update an existing admission
export const updateAdmission = async (id: number, admission: Admission): Promise<Admission> => {
  try {
    const { data } = await api.put(`${id}/`, admission);
    return data;
  } catch (error) {
    handleError(error);
  }
};

// Delete an admission
export const deleteAdmission = async (id: number): Promise<void> => {
  try {
    await api.delete(`${id}/`);
  } catch (error) {
    handleError(error);
  }
};
