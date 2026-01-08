import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RestockModal from '@/components/pharmacy/RestockModal';
import { DispenseModal } from '@/components/pharmacy/DispenseModal';
import { toast } from 'sonner';
import { InventoryItem, MedicationRequest } from '@/types/pharmacy';

const API_BASE = (
  import.meta.env.BACKEND_PHARMACY_8000 ||
  import.meta.env.BACKEND_PHARMACY ||
  'http://localhost:8000/api/pharmacy'
).replace(/\/$/, ''); // Remove trailing slash if present

const Pharmacy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'restock' | 'dispense'>('restock');

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const [requests, setRequests] = useState<MedicationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [dispenseOpen, setDispenseOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MedicationRequest | null>(null);

  // ------------------ Fetch Inventory ------------------
  const fetchInventory = async () => {
    try {
      setLoadingInventory(true);
      const res = await axios.get<InventoryItem[]>(`${API_BASE}/inventory/`);
      setInventory(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoadingInventory(false);
    }
  };

  // ------------------ Fetch Pending Requests ------------------
  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await axios.get<MedicationRequest[]>(`${API_BASE}/medication-requests/?status=pending`);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load pending requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchRequests();
  }, []);

  const handleInventoryUpdate = (item: InventoryItem) => {
    // RestockModal already created the item, just add it to the local state
    setInventory((prev) => [...prev, item]);
  };

  const openDispenseModal = (request: MedicationRequest) => {
    setSelectedRequest(request);
    setDispenseOpen(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pharmacy</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'restock' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('restock')}
        >
          Inventory Management
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'dispense' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('dispense')}
        >
          Dispense Requests
        </button>
      </div>

      {/* Restock Tab */}
      {activeTab === 'restock' && (
        <div>
          <div className="mb-4">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => setIsRestockOpen(true)}
            >
              Restock Inventory
            </button>
          </div>

          {loadingInventory ? (
            <p>Loading inventory...</p>
          ) : inventory.length > 0 ? (
            <div className="space-y-2">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="p-2 border rounded flex flex-col sm:flex-row justify-between items-start sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{item.generic_name}</p>
                    <p className="text-sm text-gray-600">
                      Brand: {item.brand_name || '-'} | Qty: {item.quantity} | Batch: {item.batch_number} | Expiry: {item.expiry_date}
                    </p>
                    {item.description && <p className="text-sm text-gray-500 italic">Description: {item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No inventory available</p>
          )}

          <RestockModal isOpen={isRestockOpen} onClose={() => setIsRestockOpen(false)} onInventoryUpdate={handleInventoryUpdate} />
        </div>
      )}

      {/* Dispense Tab */}
      {activeTab === 'dispense' && (
        <div>
          {loadingRequests ? (
            <p>Loading pending requests...</p>
          ) : requests.length > 0 ? (
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="p-2 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{req.inventory_item_detail?.generic_name}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {req.quantity} | Status: {req.status}
                    </p>
                  </div>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => openDispenseModal(req)}>
                    Dispense
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No pending requests</p>
          )}
        </div>
      )}

      {/* Dispense Modal */}
      {selectedRequest && (
        <DispenseModal
          isOpen={dispenseOpen}
          onClose={() => setDispenseOpen(false)}
          medicationRequest={selectedRequest}
          onDispenseSuccess={() => {
            fetchRequests();
            fetchInventory();
          }}
        />
      )}
    </div>
  );
};

export default Pharmacy;
