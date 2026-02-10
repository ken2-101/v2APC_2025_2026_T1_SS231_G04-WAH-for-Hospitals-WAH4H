import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Plus, Pill, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';

// Debug mode - only visible in development
const DEBUG_MODE = import.meta.env.DEV || process.env.NODE_ENV === 'development';

import { InventoryItem, MedicationRequest } from '@/types/pharmacy';
import pharmacyService from '@/services/pharmacyService';

interface MedicationRequestTabProps {
  admissionId: string;
  patientId: string;
}

export const MedicationRequestTab: React.FC<MedicationRequestTabProps> = ({ admissionId, patientId }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<MedicationRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);

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
      const data = await pharmacyService.getInventory();
      setInventory(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch inventory');
    }
  };

  // Fetch requests filtered by admission
  const fetchRequests = async () => {
    try {
      if (!admissionId) return;
      const data = await pharmacyService.getRequestsByAdmission(Number(admissionId));
      setRequests(data);
    } catch (err) {
      console.error(err);
      // toast.error('Failed to fetch medication requests'); // Suppress error for now if admission not found
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
      const selectedItem = inventory.find(i => i.id === selectedInventoryId);

      // TODO: Get requester_id from current user context/auth
      const requesterId = 1; // Hardcoded for now

      const payload = {
        admission: Number(admissionId),
        subject_id: Number(patientId),
        requester_id: requesterId,
        inventory_item: selectedInventoryId,
        inventory_item_detail: selectedItem, // Pass full inventory details
        quantity,
        notes,
        // Helper data for service to construct payload
        medication_code: selectedItem?.item_code || 'MED-UNKNOWN',
        medication_display: selectedItem?.generic_name
      };

      console.log('Submitting medication request:');
      console.log('- Admission ID:', admissionId);
      console.log('- Patient ID:', patientId);
      console.log('- Selected Item:', selectedItem);
      console.log('- Complete Payload:', payload);

      const newReq = await pharmacyService.createRequest(payload);
      setRequests((prev) => [...prev, newReq]);
      toast.success('Request submitted');

      setSelectedInventoryId(null);
      setQuantity(1);
      setNotes('');
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to submit medication request:', err);
      const errorMessage = err.message || 'Failed to submit request';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    try {
      await pharmacyService.deleteRequest(requestToDelete);
      setRequests(prev => prev.filter(r => r.id !== requestToDelete));
      toast.success('Request deleted successfully');
    } catch (err: any) {
      toast.error('Failed to delete request: ' + (err.message || 'Unknown error'));
    } finally {
      setRequestToDelete(null);
    }
  };

  // DEBUG: Simulate pharmacy dispensing (temporary until Pharmacy Module is implemented)
  const handleDebugDispense = async (requestId: number) => {
    if (!DEBUG_MODE) return;

    try {
      // Update request status to 'dispensed' via API
      await pharmacyService.updateRequestStatus(requestId, 'dispensed');

      // Refresh the requests list to reflect the change
      await fetchRequests();

      toast.success('[DEBUG] Medication dispensed successfully');
    } catch (err: any) {
      console.error('Debug dispense failed:', err);
      toast.error('Failed to dispense: ' + (err.message || 'Unknown error'));
    }
  };

  const getStatusBadge = (status: MedicationRequest['status']) => {
    if (status === 'dispensed' || status === 'completed') {
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
    if (status === 'denied' || status === 'cancelled') {
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

  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'denied') return req.status === 'cancelled' || req.status === 'denied';
    if (statusFilter === 'dispensed') return req.status === 'completed' || req.status === 'dispensed';
    return req.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-gray-700">Filter Status:</Label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md text-sm p-2 focus:ring-2 focus:ring-purple-500 hover:border-purple-400 transition-colors"
            style={{ minWidth: '140px' }}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="dispensed">Dispensed</option>
            <option value="denied">Denied</option>
          </select>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 shadow-md transition-all">
          <Plus className="w-4 h-4 mr-2" /> Request Medication
        </Button>
      </div>

      {/* Empty state */}
      {requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg dashed border border-gray-200">
          <div className="bg-purple-50 rounded-full p-4 mb-3">
            <Pill className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-md font-semibold text-gray-900 mb-1">No Requests Found</h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Start by requesting a medication for this patient.
          </p>
        </div>
      )}

      {/* Filtered Empty State */}
      {requests.length > 0 && filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <p>No requests match the selected filter.</p>
          <Button variant="link" onClick={() => setStatusFilter('all')}>Clear Filter</Button>
        </div>
      )}

      {/* Requests list */}
      <div className="space-y-3">
        {filteredRequests.map((req) => (
          <Card key={req.id} className={`shadow-sm hover:shadow-md transition-all border-l-4 ${req.status === 'cancelled' || req.status === 'denied' ? 'border-l-red-500' :
              req.status === 'completed' || req.status === 'dispensed' ? 'border-l-green-500' :
                req.status === 'approved' ? 'border-l-blue-500' :
                  'border-l-yellow-500'
            }`}>
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50/50 to-transparent">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Pill className={`w-5 h-5 ${req.status === 'cancelled' ? 'text-red-500' : 'text-purple-600'
                      }`} />
                    <CardTitle className="text-md font-bold text-gray-900">
                      {req.inventory_item_detail?.generic_name || 'Unknown Medication'}
                    </CardTitle>
                  </div>
                  {req.inventory_item_detail?.brand_name && (
                    <p className="text-xs text-gray-600 ml-8 font-medium">
                      Brand: {req.inventory_item_detail.brand_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(req.status)}
                  {/* DEBUG ONLY: Simulate pharmacy dispensing */}
                  {DEBUG_MODE && req.status !== 'dispensed' && req.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDebugDispense(req.id)}
                      className="bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-700 text-xs"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      [DEBUG] Dispense
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setRequestToDelete(req.id)}
                    title="Delete Request"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Quantity</span>
                  <p className="text-sm font-semibold text-gray-900">{req.quantity}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Request ID</span>
                  <p className="text-sm font-mono text-gray-900">#{req.id}</p>
                </div>
              </div>
              {req.notes && (
                <div className="bg-blue-50 rounded p-3 border-l-2 border-blue-300 text-xs">
                  <span className="font-bold text-blue-700 block mb-1">Notes:</span>
                  <p className="text-gray-700">{req.notes}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2 pb-2 bg-gray-50/80 text-[10px] text-center text-gray-400">
              Requested on {new Date(req.requested_at || '').toLocaleDateString()}
            </CardFooter>
          </Card>
        ))}
      </div>

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

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the medication request from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
