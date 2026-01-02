import React, { useState } from 'react';
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
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

export interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInventoryUpdate: (item: any) => void; // backend call handled in parent
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  onInventoryUpdate,
}) => {
  const [itemData, setItemData] = useState({
    name: '',
    quantity: '',
    batchNumber: '',
    expiryDate: '',
  });

  const handleRestock = () => {
    const quantity = Number(itemData.quantity);
    const expiry = new Date(itemData.expiryDate);

    // Validation
    if (!itemData.name || !itemData.batchNumber || !itemData.expiryDate) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    if (expiry <= new Date()) {
      toast.error('Expiry date must be in the future');
      return;
    }

    onInventoryUpdate({
      name: itemData.name.trim(),
      quantity,
      batchNumber: itemData.batchNumber.trim(),
      expiryDate: itemData.expiryDate,
    });

    toast.success('Stock added successfully');
    setItemData({ name: '', quantity: '', batchNumber: '', expiryDate: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-green-600" />
            Restock Inventory
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medicine Name</Label>
            <Input
              id="name"
              value={itemData.name}
              onChange={(e) =>
                setItemData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={itemData.quantity}
              onChange={(e) =>
                setItemData((prev) => ({ ...prev, quantity: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchNumber">Batch Number</Label>
            <Input
              id="batchNumber"
              value={itemData.batchNumber}
              onChange={(e) =>
                setItemData((prev) => ({ ...prev, batchNumber: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={itemData.expiryDate}
              onChange={(e) =>
                setItemData((prev) => ({ ...prev, expiryDate: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleRestock}
            className="bg-green-600 hover:bg-green-700"
          >
            Add Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
