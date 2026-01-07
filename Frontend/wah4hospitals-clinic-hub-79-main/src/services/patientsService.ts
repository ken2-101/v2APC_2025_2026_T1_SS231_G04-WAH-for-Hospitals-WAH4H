import api from './api'; // ✅ correct
import type { PatientFormData } from '../types/patient';

export const updatePatient = (id: number, data: PatientFormData) => {
  return api.put(`/patients/${id}/`, data);
};

export const deletePatient = (id: number) => {
  return api.delete(`/patients/${id}/`);
};
