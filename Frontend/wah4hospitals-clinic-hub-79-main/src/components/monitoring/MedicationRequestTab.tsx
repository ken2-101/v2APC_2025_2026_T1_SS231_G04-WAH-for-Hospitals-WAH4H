import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface MedicationRequestTabProps { admissionId: string; }

interface Medicine { id: string; name: string; quantity: number; }
interface Request { id: number; medicine_name: string; quantity: number; status: string; }

export const MedicationRequestTab: React.FC<MedicationRequestTabProps> = ({ admissionId }) => {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);

    const PHARMACY_API = 'https://scaling-memory-jj56p55q79g42qwq5-8000.app.github.dev/api/pharmacy/inventory/';
    const REQUEST_API = 'https://scaling-memory-jj56p55q79g42qwq5-8000.app.github.dev/api/pharmacy/requests/';

    // Fetch medicines
    useEffect(() => {
        axios.get(PHARMACY_API)
            .then(res => setMedicines(res.data))
            .catch(() => toast.error('Failed to fetch pharmacy inventory'));
    }, []);

    // Fetch requests
    const fetchRequests = () => {
        axios.get(`${REQUEST_API}?admission=${admissionId}`)
            .then(res => setRequests(res.data))
            .catch(() => toast.error('Failed to fetch requests'));
    };

    useEffect(() => { fetchRequests(); }, [admissionId]);

    const handleRequest = () => {
        if (!selectedMedicine || quantity <= 0) {
            toast.error('Select medicine and quantity');
            return;
        }

        axios.post(REQUEST_API, { admission: Number(admissionId), medicine_name: selectedMedicine, quantity })
            .then(res => {
                toast.success('Request submitted');
                setRequests(prev => [res.data, ...prev]);
                setIsModalOpen(false);
                setQuantity(1);
                setSelectedMedicine('');
            })
            .catch(() => toast.error('Failed to submit request'));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Request Medication
                </Button>
            </div>

            {requests.length === 0 && <p className="text-center text-gray-500 py-8">No medication requests yet.</p>}

            {requests.map(req => (
                <Card key={req.id} className="border-l-4 border-l-blue-600">
                    <CardHeader>
                        <CardTitle className="text-lg flex justify-between">
                            {req.medicine_name}
                            <Badge variant="outline">{req.status}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>Quantity: {req.quantity}</CardContent>
                    <CardFooter className="text-xs text-gray-400">Request ID: {req.id}</CardFooter>
                </Card>
            ))}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent aria-describedby="medication-request-description">
                    <DialogHeader>
                        <DialogTitle>Request Medication</DialogTitle>
                        <p id="medication-request-description" className="text-sm text-gray-500">
                            Select medicine and quantity to request
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <select
                            className="w-full border rounded p-2"
                            value={selectedMedicine}
                            onChange={(e) => setSelectedMedicine(e.target.value)}
                        >
                            <option value="">Select medicine</option>
                            {medicines.map(m => (
                                <option key={m.id} value={m.name}>{m.name} (Stock: {m.quantity})</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            className="w-full border rounded p-2"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            min={1}
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
