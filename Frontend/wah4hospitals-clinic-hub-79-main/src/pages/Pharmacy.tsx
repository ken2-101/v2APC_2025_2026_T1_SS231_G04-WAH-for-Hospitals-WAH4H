import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Pill, Package, AlertCircle, Check, Clock, Plus } from 'lucide-react';
import { DispenseModal } from '@/components/pharmacy/DispenseModal';
import { RestockModal } from '@/components/pharmacy/RestockModal';
import { toast } from 'sonner';

const Pharmacy = () => {
    const [activeTab, setActiveTab] = useState('prescriptions');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock Data
    const [prescriptions, setPrescriptions] = useState([
        {
            id: 'RX-2024-001',
            patientName: 'Juan Dela Cruz',
            doctorName: 'Dr. Santos',
            medication: 'Amoxicillin 500mg',
            dosage: '500mg',
            route: 'Oral',
            frequency: '3x a day',
            quantity: 21,
            dispensed: 0,
            status: 'pending',
            date: '2024-05-20'
        },
        {
            id: 'RX-2024-002',
            patientName: 'Maria Santos',
            doctorName: 'Dr. Reyes',
            medication: 'Paracetamol 500mg',
            dosage: '500mg',
            route: 'Oral',
            frequency: 'As needed',
            quantity: 10,
            dispensed: 0,
            status: 'pending',
            date: '2024-05-20'
        },
        {
            id: 'RX-2024-003',
            patientName: 'Pedro Reyes',
            doctorName: 'Dr. Lim',
            medication: 'Metformin 500mg',
            dosage: '500mg',
            route: 'Oral',
            frequency: '2x a day',
            quantity: 60,
            dispensed: 30,
            status: 'partially-dispensed',
            date: '2024-05-19'
        },
        {
            id: 'RX-2024-004',
            patientName: 'Ana Rodriguez',
            doctorName: 'Dr. Santos',
            medication: 'Ibuprofen 400mg',
            dosage: '400mg',
            route: 'Oral',
            frequency: 'Every 6 hours',
            quantity: 15,
            dispensed: 15,
            status: 'completed',
            date: '2024-05-18'
        }
    ]);

    const [inventory, setInventory] = useState([
        { id: 'MED-001', name: 'Amoxicillin 500mg', quantity: 500, batchNumber: 'B-101', expiryDate: '2025-12-31' },
        { id: 'MED-002', name: 'Paracetamol 500mg', quantity: 1000, batchNumber: 'B-102', expiryDate: '2026-06-30' },
        { id: 'MED-003', name: 'Metformin 500mg', quantity: 300, batchNumber: 'B-103', expiryDate: '2025-08-15' },
        { id: 'MED-004', name: 'Ibuprofen 400mg', quantity: 50, batchNumber: 'B-104', expiryDate: '2024-12-01' },
    ]);

    const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
    const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

    const handleDispenseClick = (prescription: any) => {
        setSelectedPrescription(prescription);
        setIsDispenseModalOpen(true);
    };

    const handleDispenseSubmit = (id: string, data: any) => {
        setPrescriptions(prev => prev.map(p => {
            if (p.id === id) {
                const newDispensed = p.dispensed + data.quantityDispensed;
                const newStatus = newDispensed >= p.quantity ? 'completed' : 'partially-dispensed';
                return { ...p, dispensed: newDispensed, status: newStatus };
            }
            return p;
        }));

        // Update inventory
        const medName = prescriptions.find(p => p.id === id)?.medication;
        if (medName) {
            setInventory(prev => prev.map(item => {
                if (item.name === medName) {
                    return { ...item, quantity: Math.max(0, item.quantity - data.quantityDispensed) };
                }
                return item;
            }));
        }

        toast.success('Medicine dispensed successfully');
    };

    const handleRestockSubmit = (item: any) => {
        setInventory(prev => {
            const existing = prev.find(i => i.name === item.name && i.batchNumber === item.batchNumber);
            if (existing) {
                return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i);
            }
            return [...prev, item];
        });
        toast.success('Inventory updated successfully');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" /> Completed</Badge>;
            case 'partially-dispensed':
                return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Partial</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const filteredPrescriptions = prescriptions.filter(p =>
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredInventory = inventory.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
                    <p className="text-gray-600">Manage prescriptions and inventory</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                        />
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                        <Pill className="w-4 h-4" /> Prescriptions
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="flex items-center gap-2">
                        <Package className="w-4 h-4" /> Inventory
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="prescriptions" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Prescription Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm font-medium text-gray-500">
                                            <th className="py-3 px-4">ID</th>
                                            <th className="py-3 px-4">Patient</th>
                                            <th className="py-3 px-4">Doctor</th>
                                            <th className="py-3 px-4">Medication</th>
                                            <th className="py-3 px-4">Qty (Ord/Disp)</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPrescriptions.map((p) => (
                                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">{p.id}</td>
                                                <td className="py-3 px-4">{p.patientName}</td>
                                                <td className="py-3 px-4">{p.doctorName}</td>
                                                <td className="py-3 px-4">
                                                    <div>{p.medication}</div>
                                                    <div className="text-xs text-gray-500">{p.dosage} | {p.frequency}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {p.quantity} / <span className={p.dispensed < p.quantity ? 'text-orange-600' : 'text-green-600'}>{p.dispensed}</span>
                                                </td>
                                                <td className="py-3 px-4">{getStatusBadge(p.status)}</td>
                                                <td className="py-3 px-4">
                                                    {p.status !== 'completed' && (
                                                        <Button size="sm" onClick={() => handleDispenseClick(p)}>
                                                            Dispense
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="inventory" className="mt-6">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setIsRestockModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4 mr-2" /> Add Stock
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {filteredInventory.map((item) => (
                            <Card key={item.id} className={item.quantity < 100 ? 'border-red-200 bg-red-50' : ''}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-white rounded-lg border">
                                            <Pill className="w-5 h-5 text-blue-600" />
                                        </div>
                                        {item.quantity < 100 && (
                                            <Badge variant="destructive">Low Stock</Badge>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-lg">{item.name}</h3>
                                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Quantity:</span>
                                            <span className="font-bold text-gray-900">{item.quantity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Batch:</span>
                                            <span>{item.batchNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Expiry:</span>
                                            <span className={new Date(item.expiryDate) < new Date() ? 'text-red-600 font-bold' : ''}>{item.expiryDate}</span>
                                        </div>
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
                onRestock={handleRestockSubmit}
            />
        </div>
    );
};

export default Pharmacy;
