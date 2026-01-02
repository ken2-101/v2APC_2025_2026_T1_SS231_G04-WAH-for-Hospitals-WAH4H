import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

export interface DispenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: any; // selected prescription
  onDispense: (prescriptionId: string, quantity: number) => void;
}

export const DispenseModal: React.FC<DispenseModalProps> = ({
  isOpen,
  onClose,
  prescription,
  onDispense,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [availableStock, setAvailableStock] = useState(0);

  useEffect(() => {
    if (prescription) {
      // fetch current stock of this medicine from backend
      axios
        .get(`/api/pharmacy/inventory/${prescription.inventoryId}/`)
        .then((res) => setAvailableStock(res.data.quantity || 0))
        .catch(() => {
          toast.error('Failed to fetch inventory stock');
          setAvailableStock(0);
        });
    }
  }, [prescription]);

  const handleSubmit = () => {
    if (!prescription) return;

    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    if (quantity > availableStock) {
      toast.error('Quantity exceeds available stock');
      return;
    }

    onDispense(prescription.id, quantity);
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Dispense Medicine</DialogTitle>
        </DialogHeader>

        {prescription && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Medicine</Label>
              <div className="font-semibold">{prescription.medication}</div>
            </div>

            <div className="space-y-2">
              <Label>Quantity (Available: {availableStock})</Label>
              <Input
                type="number"
                min={1}
                max={availableStock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Dispense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
