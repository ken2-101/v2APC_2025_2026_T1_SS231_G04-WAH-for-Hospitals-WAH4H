import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

interface MedicineRequest {
  id: string;
  medicineName: string;
  quantity: number;
  status: string;
  admission_id: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  batch_number: string;
  expiry_date: string;
}

interface DispenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicationRequest: MedicineRequest;
  onDispenseSuccess: () => void;
}

const API_BASE = 'https://scaling-memory-jj56p55q79g42qwq5-8000.app.github.dev/api';

export const DispenseModal: React.FC<DispenseModalProps> = ({
  isOpen,
  onClose,
  medicationRequest,
  onDispenseSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(medicationRequest.quantity);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Fetch all inventory for this medicine
  const fetchInventory = async () => {
    try {
      const res = await axios.get<InventoryItem[]>(`${API_BASE}/pharmacy/inventory/`);
      const filtered = res.data.filter(item => item.name === medicationRequest.medicineName);
      setInventory(filtered);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory');
    }
  };

  useEffect(() => {
    fetchInventory();
    setQuantity(medicationRequest.quantity);
  }, [medicationRequest]);

  const handleDispense = async () => {
    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    let remaining = quantity;

    const inventoryToUse = inventory.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

    for (const item of inventoryToUse) {
      if (remaining <= 0) break;

      const deduct = Math.min(item.quantity, remaining);

      try {
        await axios.post(`${API_BASE}/pharmacy/requests/dispense/`, {
          request_id: medicationRequest.id,
          inventory_id: item.id,
          quantity: deduct,
        });
        remaining -= deduct;
      } catch (err) {
        console.error(err);
        toast.error('Failed to dispense from inventory');
        return;
      }
    }

    toast.success('Medication dispensed and request approved');
    onDispenseSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Approve & Dispense</DialogTitle>
          <p className="text-sm text-gray-500">
            Approving this request will deduct stock from inventory and mark the request as completed.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Medicine</Label>
            <div className="font-semibold">{medicationRequest.medicineName}</div>
          </div>

          <div>
            <Label>Quantity to dispense</Label>
            <Input
              type="number"
              min={1}
              max={medicationRequest.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Available batches</Label>
            <ul className="text-sm text-gray-500 list-disc ml-4">
              {inventory.map(item => (
                <li key={item.id}>
                  Batch {item.batch_number} - Qty: {item.quantity} - Exp: {item.expiry_date}
                </li>
              ))}
              {inventory.length === 0 && <li>No stock available</li>}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleDispense} className="bg-blue-600 hover:bg-blue-700">Approve & Dispense</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
