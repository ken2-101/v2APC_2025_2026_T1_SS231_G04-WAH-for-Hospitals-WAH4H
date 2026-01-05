// src/components/pharmacy/DispenseModal.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { InventoryItem, MedicationRequest } from '@/types/pharmacy';

interface DispenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicationRequest: MedicationRequest; // full request object
  onDispenseSuccess: () => void;
}

const API_BASE = 'https://sturdy-adventure-r4pv79wg54qxc5rwx-8000.app.github.dev/api/pharmacy';

export const DispenseModal: React.FC<DispenseModalProps> = ({
  isOpen,
  onClose,
  medicationRequest,
  onDispenseSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(medicationRequest.quantity);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // ------------------ Fetch inventory for this medicine ------------------
  const fetchInventoryItem = async () => {
    try {
      const res = await axios.get<InventoryItem[]>(`${API_BASE}/inventory/`);
      const filtered = res.data.filter(
        (item) =>
          item.id === medicationRequest.inventory_item ||
          item.generic_name === medicationRequest.inventory_item_detail?.generic_name
      );
      setInventory(filtered);
    } catch (err) {
      toast.error('Failed to fetch inventory');
      setInventory([]);
    }
  };

  useEffect(() => {
    setQuantity(medicationRequest.quantity);
    fetchInventoryItem();
  }, [medicationRequest]);

  // ------------------ Handle Dispense ------------------
  const handleDispense = async () => {
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const totalStock = inventory.reduce((acc, i) => acc + i.quantity, 0);
    if (quantity > totalStock) {
      toast.error(`Not enough stock. Available: ${totalStock}`);
      return;
    }

    try {
      // POST to the proper dispense endpoint
      await axios.post(`${API_BASE}/medication-requests/${medicationRequest.id}/dispense/`, {
        quantity,
      });

      toast.success('Medication dispensed and inventory updated');
      onDispenseSuccess(); // refresh parent state
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to dispense medication');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Dispense Medication</DialogTitle>
          <p className="text-sm text-gray-500">
            Dispensing will update the request status to approved and reduce the inventory quantity.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Medicine</Label>
            <div className="font-semibold">
              {medicationRequest.inventory_item_detail
                ? `${medicationRequest.inventory_item_detail.generic_name} (${medicationRequest.inventory_item_detail.brand_name})`
                : 'Unknown Medicine'}
            </div>
          </div>

          <div>
            <Label>Quantity to dispense</Label>
            <Input
              type="number"
              min={1}
              max={inventory.reduce((acc, i) => acc + i.quantity, 0) || 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            {inventory.length > 0 && (
              <p className="text-sm text-gray-500">
                Available stock: {inventory.reduce((acc, i) => acc + i.quantity, 0)}
              </p>
            )}
          </div>

          <div>
            <Label>Inventory Batches</Label>
            <ul className="text-sm text-gray-500 list-disc ml-4">
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <li key={item.id}>
                    Batch {item.batch_number} - Qty: {item.quantity} - Exp: {item.expiry_date}
                  </li>
                ))
              ) : (
                <li>No stock available</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleDispense}
            disabled={
              inventory.length === 0 ||
              quantity <= 0 ||
              quantity > inventory.reduce((acc, i) => acc + i.quantity, 0)
            }
          >
            Approve & Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
