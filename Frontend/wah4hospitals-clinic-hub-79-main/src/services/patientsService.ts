import api from './api';
import type { Patient, PatientFormData } from '../types/patient';

/**
 * Fetch all patients
 */
export const getPatients = async () => {
  const response = await api.get('/api/patients/');
  return response.data;
};

/**
 * Fetch a single patient by ID
 */
export const getPatient = async (id: number) => {
  const response = await api.get(`/api/patients/${id}/`);
  return response.data;
};

/**
 * Create a new patient
 */
export const createPatient = async (data: PatientFormData) => {
  const response = await api.post('/api/patients/', data);
  return response.data;
};

/**
 * Update an existing patient
 */
export const updatePatient = async (id: number, data: PatientFormData) => {
  const response = await api.put(`/api/patients/${id}/`, data);
  return response.data;
};

export const deletePatient = async (id: number) => {
  const response = await api.delete(`/api/patients/${id}/`);
  return response.data;
};

// ============================================================================
// CONDITIONS SERVICES
// ============================================================================

export const getConditions = async () => {
  const response = await api.get('/api/patients/conditions/');
  return response.data;
};

export const createCondition = async (data: any) => {
  const response = await api.post('/api/patients/conditions/', data);
  return response.data;
};

// ============================================================================
// ALLERGIES SERVICES
// ============================================================================

export const getAllergies = async () => {
  const response = await api.get('/api/patients/allergies/');
  return response.data;
};

export const createAllergy = async (data: any) => {
  const response = await api.post('/api/patients/allergies/', data);
  return response.data;
};

// ============================================================================
// IMMUNIZATIONS SERVICES
// ============================================================================

export const getImmunizations = async () => {
  const response = await api.get('/api/patients/immunizations/');
  return response.data;
};

export const createImmunization = async (data: any) => {
  const response = await api.post('/api/patients/immunizations/', data);
  return response.data;
};
