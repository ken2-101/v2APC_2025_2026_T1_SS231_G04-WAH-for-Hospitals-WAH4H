// src/services/admissionService.ts
import { Admission, NewAdmission } from "@/types/admission";
import { MOCK_ADMISSIONS, LOCATION_HIERARCHY } from "@/data/mockAdmissionData";

// Utility to simulate network delay (removes instant loading flicker)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const admissionService = {
  /**
   * List all encounters (admissions)
   * Fetches from Mock Data
   */
  getAll: async (): Promise<Admission[]> => {
    await delay(500); // Simulate API latency
    return [...MOCK_ADMISSIONS];
  },

  /**
   * Get Location Hierarchy (Building -> Wing -> Ward -> Room)
   * Used for the Room Management View and Dropdowns
   */
  getLocations: async () => {
    await delay(300);
    return LOCATION_HIERARCHY;
  },

  /**
   * Get single encounter details
   */
  getById: async (id: number | string): Promise<Admission | undefined> => {
    await delay(300);
    return MOCK_ADMISSIONS.find(a => a.id == id);
  },

  /**
   * Admit a patient (Create Encounter)
   */
  create: async (admission: NewAdmission): Promise<Admission> => {
    await delay(800); // Simulate saving delay
    console.log("SENDING TO BACKEND (MOCK):", admission);
    
    // Create a new mock admission object
    const newRecord: Admission = {
      id: Math.random().toString(36).substr(2, 9),
      admissionNo: "ENC-" + Math.floor(Math.random() * 100000),
      status: "in-progress",
      dischargeDate: null,
      procedures: [],
      ...admission
    };
    
    return newRecord;
  },

  /**
   * Search for patients (Step 1 of Wizard)
   */
  searchPatients: async (query: string) => {
    await delay(400);
    // Mock patient database
    const mockPatients = [
      { id: "101", name: "Fernando Lucia Dela Cruz", patientId: "WAH-2026-00011", dob: "1985-01-15", age: 41, contact: "+63 912 345 6789", philhealth: "12-345678901-2" },
      { id: "102", name: "Oscar Lucia Aguilar", patientId: "WAH-2026-00017", dob: "1978-03-22", age: 47, contact: "+63 918 765 4321", philhealth: "12-987654321-0" },
      { id: "103", name: "Maria Clara Santos", patientId: "WAH-2026-00025", dob: "1990-06-12", age: 35, contact: "+63 917 111 2222", philhealth: "12-111222333-4" }
    ];
    
    if (!query) return [];
    return mockPatients.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.patientId.toLowerCase().includes(query.toLowerCase())
    );
  },

  /**
   * Update encounter details
   */
  update: async (id: number | string, data: Partial<Admission>): Promise<Admission> => {
    await delay(500);
    console.log(`UPDATING ADMISSION ${id} (MOCK):`, data);
    return { ...MOCK_ADMISSIONS[0], ...data }; // Return dummy updated record
  },

  /**
   * Discharge patient
   */
  discharge: async (id: number | string): Promise<boolean> => {
    await delay(600);
    console.log(`DISCHARGING ADMISSION ${id} (MOCK)`);
    return true;
  }
};