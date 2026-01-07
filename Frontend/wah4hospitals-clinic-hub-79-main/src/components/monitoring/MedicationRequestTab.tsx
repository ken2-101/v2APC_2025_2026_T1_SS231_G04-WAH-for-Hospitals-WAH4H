import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { InventoryItem, MedicationRequest } from '@/types/pharmacy';

interface MedicationRequestTabProps {
  admissionId: string;
}

export const MedicationRequestTab: React.FC<MedicationRequestTabProps> = ({ admissionId }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<MedicationRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const API_BASE =
    import.meta.env.BACKEND_PHARMACY_8000 ||
      import.meta.env.LOCAL_8000
      ? `${import.meta.env.LOCAL_8000}/api/pharmacy`
      : import.meta.env.BACKEND_PHARMACY;

  const PHARMACY_API = `${API_BASE}/inventory/`;
  const REQUEST_API = `${API_BASE}/medication-requests/`;

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      const res = await axios.get<InventoryItem[]>(PHARMACY_API);
      setInventory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch inventory');
    }
  };

  // Fetch requests filtered by admission
  const fetchRequests = async () => {
    try {
      const res = await axios.get<MedicationRequest[]>(`${REQUEST_API}?admission=${admissionId}`);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch medication requests');
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchRequests();
  }, [admissionId]);

  const handleRequest = async () => {
    if (!selectedInventoryId || quantity <= 0) {
      toast.error('Select medicine and quantity');
      return;
    }

    try {
      const payload = {
        admission: Number(admissionId),
        inventory_item: selectedInventoryId,
        quantity,
        notes,
      };

      const res = await axios.post<MedicationRequest>(REQUEST_API, payload);
      setRequests((prev) => [...prev, res.data]);
      toast.success('Request submitted');

      setSelectedInventoryId(null);
      setQuantity(1);
      setNotes('');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit request');
    }
  };

  const getStatusBadge = (status: MedicationRequest['status']) => {
    if (status === 'dispensed') return <Badge className="bg-green-100 text-green-800">Dispensed</Badge>;
    if (status === 'approved') return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
    if (status === 'denied') return <Badge className="bg-red-100 text-red-800">Denied</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Request button */}
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Request Medication
        </Button>
      </div>

      {/* Requests list */}
      {requests.length === 0 && (
        <p className="text-center text-gray-500 py-8">No medication requests yet.</p>
      )}

      {requests.map((req) => (
        <Card key={req.id} className="border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              {req.inventory_item_detail?.generic_name}
              {getStatusBadge(req.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>Quantity: {req.quantity}</CardContent>
          {req.notes && <CardContent>Notes: {req.notes}</CardContent>}
          <CardFooter className="text-xs text-gray-400">Request ID: {req.id}</CardFooter>
        </Card>
      ))}

      {/* Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent aria-describedby="medication-request-description">
          <DialogHeader>
            <DialogTitle>Request Medication</DialogTitle>
            <p id="medication-request-description" className="text-sm text-gray-500">
              Select medicine, quantity, and optional notes
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <select
              className="w-full border rounded p-2"
              value={selectedInventoryId ?? ''}
              onChange={(e) => setSelectedInventoryId(Number(e.target.value))}
            >
              <option value="">Select medicine</option>
              {inventory.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.generic_name} ({m.brand_name}) — Stock: {m.quantity}
                </option>
              ))}
            </select>

            <input
              type="number"
              className="w-full border rounded p-2"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
            />

            <textarea
              className="w-full border rounded p-2"
              placeholder="Optional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
