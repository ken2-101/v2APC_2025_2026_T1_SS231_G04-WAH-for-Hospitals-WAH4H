import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, Package, AlertCircle, Check, Clock, Plus } from 'lucide-react';
import { DispenseModal } from '@/components/pharmacy/DispenseModal';
import { RestockModal } from '@/components/pharmacy/RestockModal';
import { toast } from 'sonner';
import axios from 'axios';

const API_BASE = 'https://scaling-memory-jj56p55q79g42qwq5-8000.app.github.dev/api';

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  inventoryId: string;
  medication: string;
  quantity: number;
  dispensed: number;
  status: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  batch_number: string;
  expiry_date: string;
}

const Pharmacy: React.FC = () => {
  const [activeTab, setActiveTab] = useState('prescriptions');

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      const res = await axios.get<InventoryItem[]>(`${API_BASE}/pharmacy/inventory/`);
      setInventory(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      toast.error('Failed to load inventory');
    }
  };

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get<Prescription[]>(`${API_BASE}/pharmacy/prescriptions/`);
      setPrescriptions(res.data);
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err);
      toast.error('Failed to load prescriptions');
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchPrescriptions();
  }, []);

  const handleDispenseClick = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsDispenseModalOpen(true);
  };

  const handleDispenseSubmit = async (prescriptionId: string, quantityDispensed: number) => {
    try {
      const prescription = prescriptions.find(p => p.id === prescriptionId);
      if (!prescription) return;

      const stock = inventory.find(i => i.id === prescription.inventoryId);
      if (!stock) {
        toast.error('Medicine not found in inventory');
        return;
      }

      // Safety checks
      if (new Date(stock.expiry_date) < new Date()) {
        toast.error('Cannot dispense expired medicine');
        return;
      }

      const remaining = prescription.quantity - prescription.dispensed;
      if (quantityDispensed > remaining) {
        toast.error('Dispense quantity exceeds prescription');
        return;
      }

      if (quantityDispensed > stock.quantity) {
        toast.error('Insufficient stock');
        return;
      }

      // POST dispense to backend
      await axios.post(`${API_BASE}/pharmacy/dispense/`, {
        prescription_id: prescriptionId,
        quantity: quantityDispensed,
      });

      toast.success('Medicine dispensed safely');

      // Refresh data
      fetchInventory();
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to dispense medicine');
    }
  };

  const handleRestockSubmit = async (item: any) => {
    try {
      await axios.post(`${API_BASE}/pharmacy/inventory/`, item);
      toast.success('Stock added');

      // Refresh inventory
      fetchInventory();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add stock');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed')
      return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" /> Completed</Badge>;
    if (status === 'partially-dispensed')
      return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Partial</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="prescriptions"><Pill className="w-4 h-4 mr-1" /> Prescriptions</TabsTrigger>
          <TabsTrigger value="inventory"><Package className="w-4 h-4 mr-1" /> Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptions.map(p => (
                <div key={p.id} className="flex justify-between items-center border-b py-3">
                  <div>
                    <div className="font-semibold">{p.medication}</div>
                    <div className="text-sm text-gray-500">
                      {p.dispensed}/{p.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(p.status)}
                    {p.status !== 'completed' && (
                      <Button size="sm" onClick={() => handleDispenseClick(p)}>
                        Dispense
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Button onClick={() => setIsRestockModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Stock
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {inventory.map(i => (
              <Card key={i.id} className={i.quantity < 100 ? 'border-red-300' : ''}>
                <CardContent className="p-4">
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-sm">Qty: {i.quantity}</div>
                  <div className={`text-sm ${new Date(i.expiry_date) < new Date() ? 'text-red-600 font-bold' : ''}`}>
                    Exp: {i.expiry_date}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <DispenseModal
        isOpen={isDispenseModalOpen}
        onClose={() => setIsDispenseModalOpen(false)}
        prescription={selectedPrescription}
        onDispense={handleDispenseSubmit}
      />

      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        onInventoryUpdate={handleRestockSubmit}
      />
    </div>
  );
};

export default Pharmacy;
