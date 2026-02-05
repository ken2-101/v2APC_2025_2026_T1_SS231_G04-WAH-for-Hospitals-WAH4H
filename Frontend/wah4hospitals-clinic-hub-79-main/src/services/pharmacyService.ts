
import api from './api';
import { InventoryItem, MedicationRequest } from '@/types/pharmacy';

const PHARMACY_BASE_URL = '/api/pharmacy';

class PharmacyService {

  // ==================== INVENTORY ====================

  /**
   * Fetch all inventory items mapping backend fields to frontend types
   */
  async getInventory(params?: { show_expired?: boolean; show_inactive?: boolean }): Promise<InventoryItem[]> {
    try {
      const response = await api.get(`${PHARMACY_BASE_URL}/inventory/`, { params });
      console.log('Raw inventory response:', response.data);
      
      const items = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('Items to map:', items.length);
      
      // Map backend fields to frontend InventoryItem interface
      return items.map((item: any) => {
        try {
          return {
            id: item.inventory_id,
            generic_name: item.item_name, // Mapping item_name -> generic_name for UI
            brand_name: item.item_name,   // Redundant but required by UI type
            description: item.category,   // Using category as description
            quantity: item.current_stock,
            minimum_stock_level: item.reorder_level,
            unit_price: parseFloat(item.unit_cost),
            expiry_date: item.expiry_date,
            batch_number: item.batch_number,
            manufacturer: 'Unknown',      // Not in backend model
            is_active: item.status === 'active',
            // Derived status flags logic (simplified, ideally backend provides this)
            is_expired: new Date(item.expiry_date) < new Date(),
            is_expiring_soon: false, // Logic needed
            is_low_stock: item.current_stock <= item.reorder_level,
            is_out_of_stock: item.current_stock === 0,
            status_indicators: [],      // Populated by frontend helper
            created_at: item.created_at,
            updated_at: item.updated_at
          };
        } catch (mapError) {
          console.error('Error mapping inventory item:', item, mapError);
          throw mapError;
        }
      });
    } catch (error) {
      console.error('Error in getInventory:', error);
      throw error;
    }
  }

  /**
   * Create a new inventory item
   */
  async addInventoryItem(data: any): Promise<InventoryItem> {
    // Transform frontend data to backend expected format
    const payload = {
      item_code: `MED-${Date.now()}`, // Auto-generate code if not provided
      item_name: data.generic_name,
      category: 'Medicine',
      batch_number: data.batch_number,
      current_stock: data.quantity,
      reorder_level: data.minimum_stock_level,
      unit_of_measure: 'unit', // Default
      unit_cost: data.unit_price,
      status: 'active',
      expiry_date: data.expiry_date,
      last_restocked_datetime: new Date().toISOString(),
      created_by: 'System' // Should be user ID in real app
    };

    const response = await api.post(`${PHARMACY_BASE_URL}/inventory/`, payload);
    return this.mapToInventoryItem(response.data);
  }

  // ==================== MEDICATION REQUESTS ====================

  /**
   * Fetch medication requests
   */
  async getRequests(statusFilter: string = 'active'): Promise<MedicationRequest[]> {
     // Backend status: active, on-hold, cancelled, completed, entered-in-error, stopped, draft, unknown
     // Frontend status: pending, approved, denied, dispensed
     
     // Mapping 'pending' (frontend) -> 'active' (backend)
     const backendStatus = statusFilter === 'pending' ? 'active' : statusFilter;

     const response = await api.get(`${PHARMACY_BASE_URL}/requests/`, {
         params: { status: backendStatus }
     });
     
     const requests = Array.isArray(response.data) ? response.data : (response.data.results || []);

     // Fetch inventory to match with requests
     const inventory = await this.getInventory();

     return requests.map((req: any) => {
         // Find matching inventory item by medication name
         const inventoryItem = inventory.find(
             item => item.generic_name?.toLowerCase() === req.medication_display?.toLowerCase()
         );

         return {
             id: req.medication_request_id,
             admission: req.encounter_id,
             admission_info: {
                 id: req.encounter_id,
                 patient_name: `Patient #${req.subject_id}`,
                 admission_date: req.authored_on
             },
             inventory_item: inventoryItem?.id || 0,
             inventory_item_detail: inventoryItem || {
                 id: 0,
                 generic_name: req.medication_display || req.medication_code,
                 brand_name: 'N/A',
                 description: 'Unknown',
                 quantity: 0,
                 minimum_stock_level: 0,
                 unit_price: 0,
                 expiry_date: new Date().toISOString(),
                 batch_number: 'N/A',
                 manufacturer: 'Unknown',
                 is_active: false,
                 is_expired: false,
                 is_expiring_soon: false,
                 is_low_stock: true,
                 is_out_of_stock: true,
                 status_indicators: [],
                 created_at: req.authored_on,
                 updated_at: req.updated_at
             },
             quantity: req.dispense_quantity || 0,
             status: req.status === 'active' ? 'pending' : req.status,
             notes: req.note,
             requested_by: `Practitioner #${req.requester_id}`,
             requested_at: req.authored_on,
             updated_at: req.updated_at
         };
     });
  }

  /**
   * Fetch requests by admission (encounter)
   */
  async getRequestsByAdmission(admissionId: number): Promise<MedicationRequest[]> {
     const response = await api.get(`${PHARMACY_BASE_URL}/requests/by-encounter/`, {
         params: { encounter_id: admissionId }
     });
     
     const requestList = Array.isArray(response.data) ? response.data : (response.data.results || []);
     
     // Fetch inventory to match with requests
     const inventory = await this.getInventory();
     
     return requestList.map((req: any) => {
         // Find matching inventory item by medication name
         const inventoryItem = inventory.find(
             item => item.generic_name?.toLowerCase() === req.medication_display?.toLowerCase()
         );

         return {
             id: req.medication_request_id,
             admission: req.encounter_id,
             admission_info: {
                 id: req.encounter_id,
                 patient_name: `Patient #${req.subject_id}`,
                 admission_date: req.authored_on
             },
             inventory_item: inventoryItem?.id || 0,
             inventory_item_detail: inventoryItem || {
                 id: 0,
                 generic_name: req.medication_display || req.medication_code,
                 brand_name: 'N/A',
                 description: 'Unknown',
                 quantity: 0,
                 minimum_stock_level: 0,
                 unit_price: 0,
                 expiry_date: new Date().toISOString(),
                 batch_number: 'N/A',
                 manufacturer: 'Unknown',
                 is_active: false,
                 is_expired: false,
                 is_expiring_soon: false,
                 is_low_stock: true,
                 is_out_of_stock: true,
                 status_indicators: [],
                 created_at: req.authored_on,
                 updated_at: req.updated_at
             },
             quantity: req.dispense_quantity || 0,
             status: req.status === 'active' ? 'pending' : req.status,
             notes: req.note,
             requested_by: `Practitioner #${req.requester_id}`,
             requested_at: req.authored_on,
             updated_at: req.updated_at
         };
     });
  }

  /**
   * Create a new medication request
   */
  async createRequest(data: {
      admission: number;
      subject_id: number; // Patient ID
      requester_id: number; // Practitioner ID
      inventory_item?: number;
      inventory_item_detail?: InventoryItem; // Pass actual inventory details
      quantity: number;
      notes?: string;
      medication_code?: string;
      medication_display?: string;
  }): Promise<MedicationRequest> {
     // Generate unique identifier for the medication request
     const identifier = `MR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
     
     // Transform frontend data to backend expected format
     const payload = {
         identifier: identifier,
         status: 'active',
         intent: 'order',
         priority: 'routine',
         subject_id: data.subject_id,
         encounter_id: data.admission,
         requester_id: data.requester_id,
         medication_code: data.medication_code || 'MED-UNKNOWN',
         medication_display: data.medication_display || 'Unknown Medication',
         dispense_quantity: data.quantity,
         authored_on: new Date().toISOString(),
         note: data.notes || ''
     };

     console.log('Creating medication request with payload:', payload);

     try {
       const response = await api.post(`${PHARMACY_BASE_URL}/requests/`, payload);
       
       // Return mapped object similar to getRequests
       const req = response.data;
       return {
           id: req.medication_request_id,
           admission: req.encounter_id,
           admission_info: { id: req.encounter_id, patient_name: 'Unknown', admission_date: req.authored_on },
           inventory_item: data.inventory_item || 0, 
           inventory_item_detail: data.inventory_item_detail || {
               id: 0,
               generic_name: req.medication_display || req.medication_code,
               brand_name: req.medication_display || req.medication_code,
               description: 'Pending Request',
               quantity: 0,
               minimum_stock_level: 0,
               unit_price: 0,
               expiry_date: new Date().toISOString(),
               batch_number: 'N/A',
               manufacturer: 'Unknown',
               is_active: true,
               is_expired: false,
               is_expiring_soon: false,
               is_low_stock: false,
               is_out_of_stock: true,
               status_indicators: [],
               created_at: new Date().toISOString(),
               updated_at: new Date().toISOString()
           },
           quantity: req.dispense_quantity || 0,
           status: req.status === 'active' ? 'pending' : req.status,
           notes: req.note,
           requested_by: `Practitioner #${req.requester_id}`,
           requested_at: req.authored_on,
           updated_at: req.updated_at
       };
     } catch (error: any) {
       console.error('Error creating medication request:', error);
       console.error('Error response:', error.response?.data);
       console.error('Error status:', error.response?.status);
       
       // Throw a more descriptive error
       const errorMessage = error.response?.data?.error 
         || error.response?.data?.message 
         || error.response?.data 
         || 'Failed to create medication request';
       
       throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
     }
  }

  // Helper
  private mapToInventoryItem(item: any): InventoryItem {
      return {
          id: item.inventory_id,
          generic_name: item.item_name,
          brand_name: item.item_name,
          description: item.category,
          quantity: item.current_stock,
          minimum_stock_level: item.reorder_level,
          unit_price: parseFloat(item.unit_cost),
          expiry_date: item.expiry_date,
          batch_number: item.batch_number,
          manufacturer: 'Unknown',
          is_active: item.status === 'active',
          is_expired: new Date(item.expiry_date) < new Date(),
          is_expiring_soon: false,
          is_low_stock: item.current_stock <= item.reorder_level,
          is_out_of_stock: item.current_stock === 0,
          status_indicators: [],
          created_at: item.created_at,
          updated_at: item.updated_at
      };
  }
}

export default new PharmacyService();
