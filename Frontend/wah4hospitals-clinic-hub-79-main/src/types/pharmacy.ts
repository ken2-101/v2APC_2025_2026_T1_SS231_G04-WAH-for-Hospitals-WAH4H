export interface InventoryItem {
  id: number;
  generic_name: string;
  brand_name: string;
  description?: string;
  quantity: number;
  expiry_date: string; // ISO string
  batch_number: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationRequest {
  id: number;
  admission: number; // FK to Admission
  inventory_item: number; // ID only
  inventory_item_detail?: InventoryItem; // full inventory info, read-only
  quantity: number;
  status: 'pending' | 'approved' | 'denied' | 'dispensed';
  notes?: string;
  requested_at: string;
  updated_at: string;
}
