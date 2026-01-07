// src/services/billingService.ts
import axios, { AxiosInstance } from 'axios';

// Define types based on backend models
export interface MedicineItem {
  id?: number;
  name: string;
  dosage: string;
  quantity: number;
  unit_price: string | number;
  total_cost?: string | number;
}

export interface DiagnosticItem {
  id?: number;
  name: string;
  cost: string | number;
}

export interface Payment {
  id?: number;
  billing_record?: number;
  amount: string | number;
  payment_method: string;
  or_number: string;
  cashier: string;
  payment_date: string;
  created_at?: string;
}

export interface BillingRecord {
  id?: number;
  patient?: number;
  admission?: number;
  patient_name: string;
  hospital_id: string;
  admission_date: string;
  discharge_date: string;
  room_ward: string;
  room_type: string;
  number_of_days: number;
  rate_per_day: string | number;
  attending_physician_fee: string | number;
  specialist_fee: string | number;
  surgeon_fee: string | number;
  other_professional_fees: string | number;
  diet_type: string;
  meals_per_day: number;
  diet_duration: number;
  cost_per_meal: string | number;
  supplies_charge: string | number;
  procedure_charge: string | number;
  nursing_charge: string | number;
  miscellaneous_charge: string | number;
  discount: string | number;
  philhealth_coverage: string | number;
  is_senior: boolean;
  is_pwd: boolean;
  is_philhealth_member: boolean;
  is_finalized: boolean;
  finalized_date?: string | null;
  medicines: MedicineItem[];
  diagnostics: DiagnosticItem[];
  payments?: Payment[];
  total_room_charge?: string | number;
  total_professional_fees?: string | number;
  total_dietary_charge?: string | number;
  subtotal?: string | number;
  total_amount?: string | number;
  running_balance?: string | number;
  payment_status?: 'Paid' | 'Pending' | 'Partial';
  created_at?: string;
  updated_at?: string;
}

export interface BillingDashboardItem {
  id: number;
  patientName: string;
  encounterId: string;
  runningBalance: string | number;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  lastORDate: string | null;
  room: string;
}

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.STURDY_ADVENTURE_BASE_8000 ||
    import.meta.env.LOCAL_8000 ||
    import.meta.env.STURDY_ADVENTURE_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleError = (error: any) => {
  console.error('BillingService error:', error);
  throw error;
};

export const billingService = {
  // Get all billing records
  getAll: async (): Promise<BillingRecord[]> => {
    try {
      const { data } = await api.get<BillingRecord[]>('/api/billing/billing-records/');
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get dashboard data
  getDashboard: async (status?: string): Promise<BillingDashboardItem[]> => {
    try {
      const params = status ? { status } : {};
      const { data } = await api.get<BillingDashboardItem[]>(
        '/api/billing/billing-records/dashboard/',
        { params }
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get billing record by ID
  getById: async (id: number): Promise<BillingRecord> => {
    try {
      const { data } = await api.get<BillingRecord>(`/api/billing/billing-records/${id}/`);
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Create new billing record
  create: async (billingData: Partial<BillingRecord>): Promise<BillingRecord> => {
    try {
      const { data } = await api.post<BillingRecord>(
        '/api/billing/billing-records/',
        billingData
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Update billing record
  update: async (id: number, billingData: Partial<BillingRecord>): Promise<BillingRecord> => {
    try {
      const { data } = await api.put<BillingRecord>(
        `/api/billing/billing-records/${id}/`,
        billingData
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Partial update billing record
  patch: async (id: number, billingData: Partial<BillingRecord>): Promise<BillingRecord> => {
    try {
      const { data } = await api.patch<BillingRecord>(
        `/api/billing/billing-records/${id}/`,
        billingData
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Delete billing record
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/billing/billing-records/${id}/`);
    } catch (error) {
      return handleError(error);
    }
  },

  // Finalize billing record
  finalize: async (id: number): Promise<BillingRecord> => {
    try {
      const { data } = await api.post<BillingRecord>(
        `/api/billing/billing-records/${id}/finalize/`
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Add payment to billing record
  addPayment: async (id: number, paymentData: Omit<Payment, 'id' | 'billing_record' | 'created_at' | 'or_number'>): Promise<BillingRecord> => {
    try {
      const { data } = await api.post<BillingRecord>(
        `/api/billing/billing-records/${id}/add_payment/`,
        paymentData
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get payments for billing record
  getPayments: async (id: number): Promise<Payment[]> => {
    try {
      const { data } = await api.get<Payment[]>(`/api/billing/billing-records/${id}/payments/`);
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get billing records by patient
  getByPatient: async (patientId: number): Promise<BillingRecord[]> => {
    try {
      const { data } = await api.get<BillingRecord[]>(
        `/api/billing/billing-records/by_patient/`,
        { params: { patient_id: patientId } }
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get billing records by admission
  getByAdmission: async (admissionId: number): Promise<BillingRecord[]> => {
    try {
      const { data } = await api.get<BillingRecord[]>(
        `/api/billing/billing-records/by_admission/`,
        { params: { admission_id: admissionId } }
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
};

export default billingService;
