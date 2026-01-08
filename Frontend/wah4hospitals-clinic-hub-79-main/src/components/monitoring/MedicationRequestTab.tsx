import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pill } from 'lucide-react';
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
    if (status === 'dispensed') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold px-3 py-1">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Dispensed
        </Badge>
      );
    }
    if (status === 'approved') {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold px-3 py-1">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Approved
        </Badge>
      );
    }
    if (status === 'denied') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold px-3 py-1">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          Denied
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-semibold px-3 py-1">
        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
        Pending
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Request button */}
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Request Medication
        </Button>
      </div>

      {/* Empty state */}
      {requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-purple-50 rounded-full p-6 mb-4">
            <Pill className="w-12 h-12 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medication Requests</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            No medication requests have been submitted for this patient yet. Click "Request Medication" to begin.
          </p>
        </div>
      )}

      {/* Requests list */}
      {requests.map((req) => (
        <Card key={req.id} className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50/50 to-transparent">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Pill className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg font-bold text-gray-900">
                    {req.inventory_item_detail?.generic_name || 'Unknown Medication'}
                  </CardTitle>
                </div>
                {req.inventory_item_detail?.brand_name && (
                  <p className="text-sm text-gray-600 ml-8">
                    Brand: {req.inventory_item_detail.brand_name}
                  </p>
                )}
              </div>
              {getStatusBadge(req.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Quantity</span>
                <p className="text-lg font-semibold text-gray-900 mt-1">{req.quantity}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Request ID</span>
                <p className="text-sm font-mono text-gray-900 mt-1">#{req.id}</p>
              </div>
            </div>
            {req.notes && (
              <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                <span className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Notes</span>
                <p className="text-sm text-gray-700 mt-1">{req.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-3 border-t bg-gray-50/50 text-xs text-gray-500">
            Request ID: #{req.id}
          </CardFooter>
        </Card>
      ))}

      {/* Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent aria-describedby="medication-request-description" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Pill className="w-6 h-6 text-purple-600" />
              Request Medication
            </DialogTitle>
            <p id="medication-request-description" className="text-sm text-gray-600 mt-2">
              Select medication from pharmacy inventory and specify quantity needed
            </p>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Select Medication</Label>
              <select
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={selectedInventoryId ?? ''}
                onChange={(e) => setSelectedInventoryId(Number(e.target.value))}
              >
                <option value="">-- Choose medication from inventory --</option>
                {inventory.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.generic_name} ({m.brand_name}) — Available: {m.quantity} units
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Quantity Needed</Label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
                placeholder="Enter quantity"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Notes (Optional)</Label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                placeholder="Add any special instructions or notes for the pharmacist..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequest} className="bg-purple-600 hover:bg-purple-700">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
