// src/services/billingService.ts
import axios, { AxiosInstance } from 'axios';

// Define types based on backend models
export interface InvoiceLineItem {
  id: number;
  sequence: string;
  description: string;
  quantity: number;
  unit_price: number;
  net_value: number;
  gross_value: number;
}

export interface Invoice {
  invoice_id: number; // Primary Key
  identifier: string;
  subject_id: number;
  status: 'draft' | 'issued' | 'balanced' | 'cancelled';
  invoice_datetime: string;
  total_net_value: string | number; // Decimal string from Django
  total_gross_value: string | number;
  line_items: InvoiceLineItem[];
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
  // --- INVOICE METHODS ---

  getPatientSummary: async (subjectId: number) => {
    const response = await api.get(`/api/billing/invoices/patient_summary/?subject_id=${subjectId}`);
    return response.data;
  },

  getInvoices: async (subjectId: number) => {
    const response = await api.get(`/api/billing/invoices/?subject_id=${subjectId}`);
    return response.data;
  },

  generateInvoice: async (subjectId: number) => {
    const response = await api.post('/api/billing/invoices/generate/', { subject_id: subjectId });
    return response.data;
  },

  recordPayment: async (invoiceId: number, paymentData: any) => {
    const response = await api.post(`/api/billing/invoices/${invoiceId}/record_payment/`, paymentData);
    return response.data;
  },

  async createManualInvoice(subjectId: number) {
    const response = await api.post('/api/billing/invoices/create_manual/', { subject_id: subjectId });
    return response.data;
  },

  addManualItem: async (invoiceId: number, itemData: { description: string; amount: number; category: string }) => {
    const response = await api.post(`/api/billing/invoices/${invoiceId}/add_item/`, itemData);
    return response.data;
  },
};

export default billingService;
