import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, Package, AlertCircle, Check, Clock, Plus } from 'lucide-react';
import { DispenseModal } from '@/components/pharmacy/DispenseModal';
import { RestockModal } from '@/components/pharmacy/RestockModal';
import { toast } from 'sonner';
import axios from 'axios';

const API_BASE = 'https://scaling-memory-jj56p55q79g42qwq5-8000.app.github.dev/api/pharmacy';

interface Prescription {
  id: string;
  patientName: string;
  medication: string;
  quantity: number;
  dispensed: number;
  status: string;
}

interface MedicationRequest {
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

const Pharmacy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'inventory' | 'requests'>('prescriptions');

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [requests, setRequests] = useState<MedicationRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [selectedRequest, setSelectedRequest] = useState<MedicationRequest | null>(null);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      const res = await axios.get<InventoryItem[]>(`${API_BASE}/inventory/`);
      setInventory(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory');
    }
  };

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get<Prescription[]>(`${API_BASE}/prescriptions/`);
      setPrescriptions(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load prescriptions');
    }
  };

  // Fetch medication requests
  const fetchRequests = async () => {
    try {
      const res = await axios.get<MedicationRequest[]>(`${API_BASE}/requests/`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load medication requests');
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchPrescriptions();
    fetchRequests();
  }, []);

  const handleDispenseClick = (request: MedicationRequest) => {
    setSelectedRequest(request);
    setIsDispenseModalOpen(true);
  };

  const handleRestockSubmit = async (item: any) => {
    try {
      await axios.post(`${API_BASE}/inventory/`, item);
      toast.success('Stock updated');
      fetchInventory();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stock');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" /> Completed</Badge>;
    if (status === 'partially-dispensed') return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Partial</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'prescriptions' | 'inventory' | 'requests')}
      >
        <TabsList>
          <TabsTrigger value="prescriptions"><Pill className="w-4 h-4 mr-1" /> Prescriptions</TabsTrigger>
          <TabsTrigger value="inventory"><Package className="w-4 h-4 mr-1" /> Inventory</TabsTrigger>
          <TabsTrigger value="requests"><Plus className="w-4 h-4 mr-1" /> Medication Requests</TabsTrigger>
        </TabsList>

        {/* Prescriptions */}
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
                    <div className="text-sm text-gray-500">{p.dispensed}/{p.quantity}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(p.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory */}
        <TabsContent value="inventory">
          <Button onClick={() => setIsRestockModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Stock
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {inventory.map(i => (
              <Card key={i.id} className={i.quantity < 100 ? 'border-red-300' : ''}>
                <CardContent>
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-sm">Qty: {i.quantity}</div>
                  <div className={`text-sm ${new Date(i.expiry_date) < new Date() ? 'text-red-600 font-bold' : ''}`}>Exp: {i.expiry_date}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Medication Requests */}
        <TabsContent value="requests">
          {requests.length === 0 && (
            <p className="text-center text-gray-500 py-8">No medication requests yet.</p>
          )}
          {requests.map(req => (
            <Card key={req.id} className="border-l-4 border-l-blue-600">
              <CardHeader>
                <CardTitle className="text-lg flex justify-between">
                  {req.medicineName}
                  <Badge variant="outline">{req.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>Quantity: {req.quantity}</CardContent>
              <CardFooter className="text-xs text-gray-400">Request ID: {req.id}</CardFooter>
              {req.status !== 'completed' && (
                <Button className="mt-2" onClick={() => handleDispenseClick(req)}>Dispense</Button>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedRequest && (
        <DispenseModal
          isOpen={isDispenseModalOpen}
          onClose={() => setIsDispenseModalOpen(false)}
          medicationRequest={selectedRequest}
          onDispenseSuccess={() => {
            fetchRequests();
            fetchInventory();
          }}
        />
      )}

      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        onInventoryUpdate={handleRestockSubmit}
      />
    </div>
  );
};

export default Pharmacy;
