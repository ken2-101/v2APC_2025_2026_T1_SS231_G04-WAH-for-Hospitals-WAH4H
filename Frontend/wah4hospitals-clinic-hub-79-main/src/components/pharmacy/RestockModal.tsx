import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { InventoryItem } from '@/types/pharmacy';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInventoryUpdate: (item: InventoryItem) => void; // Updated type: full InventoryItem
}

const API_BASE = 'https://curly-couscous-wrgjv6x7j6v4hgvrw-8000.app.github.dev/api/pharmacy';

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  onInventoryUpdate,
}) => {
  const [itemData, setItemData] = useState({
    generic_name: '',
    brand_name: '',
    description: '',
    quantity: '',
    batch_number: '',
    expiry_date: '',
  });

  const handleRestock = async () => {
    const quantity = Number(itemData.quantity);

    // Validation
    if (!itemData.generic_name || !itemData.batch_number || !itemData.expiry_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    if (new Date(itemData.expiry_date) <= new Date()) {
      toast.error('Expiry date must be in the future');
      return;
    }

    try {
      // Call backend to add stock
      const payload = {
        generic_name: itemData.generic_name,
        brand_name: itemData.brand_name,
        description: itemData.description,
        quantity,
        batch_number: itemData.batch_number,
        expiry_date: itemData.expiry_date,
      };

      const res = await axios.post<InventoryItem>(`${API_BASE}/inventory/`, payload);

      // Notify parent to update inventory state
      onInventoryUpdate(res.data);

      toast.success('Stock added successfully');
      setItemData({
        generic_name: '',
        brand_name: '',
        description: '',
        quantity: '',
        batch_number: '',
        expiry_date: '',
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to add stock');
    }
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
            <Label htmlFor="generic_name">Medicine Name</Label>
            <Input
              id="generic_name"
              value={itemData.generic_name}
              onChange={(e) =>
                setItemData((prev) => ({ ...prev, generic_name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand_name">Brand Name (Optional)</Label>
            <Input
              id="brand_name"
              value={itemData.brand_name}
              onChange={(e) =>
                setItemData((prev) => ({ ...prev, brand_name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={itemData.description}
              onChange={(e) =>
                setItemData((prev) => ({ ...prev, description: e.target.value }))
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
            <Label htmlFor="batch_number">Batch Number</Label>
            <Input
              id="batch_number"
              value={itemData.batch_number}
              onChange={(e) =>
                setItemData((prev) => ({ ...prev, batch_number: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              id="expiry_date"
              type="date"
              value={itemData.expiry_date}
              onChange={(e) =>
                setItemData((prev) => ({ ...prev, expiry_date: e.target.value }))
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

export default RestockModal;
