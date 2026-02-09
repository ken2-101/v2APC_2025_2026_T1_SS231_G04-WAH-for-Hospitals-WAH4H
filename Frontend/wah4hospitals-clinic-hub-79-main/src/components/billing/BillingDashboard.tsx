import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Printer, CreditCard, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';

interface BillingPatient {
    id: number;
    patientName: string;
    encounterId: string; // Admission ID
    runningBalance: number;
    paymentStatus: 'Paid' | 'Pending' | 'Partial';
    lastORDate?: string;
    room: string;
}

interface BillingDashboardProps {
    patients: BillingPatient[];
    onSelectPatient: (id: number) => void;
    onQuickPay: (patient: BillingPatient) => void;
    onDeletePatient?: (id: number) => Promise<void>;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ patients, onSelectPatient, onQuickPay, onDeletePatient }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [deleteId, setDeleteId] = React.useState<number | null>(null);
    const { toast } = useToast();

    const filteredPatients = patients.filter(p =>
        (p.patientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.encounterId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Paid': return <Badge className="bg-green-600 text-white hover:bg-green-700">Paid</Badge>;
            case 'Partial': return <Badge className="bg-yellow-600 text-white hover:bg-yellow-700">Partial</Badge>;
            default: return <Badge variant="outline" className="text-red-600 border-red-600">Pending</Badge>;
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

    const handleDeleteClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId && onDeletePatient) {
            try {
                await onDeletePatient(deleteId);
                toast({
                    title: "Bill Deleted",
                    description: "The billing record currently selected has been successfully deleted.",
                });
            } catch (error) {
                console.error("Failed to delete bill:", error);
                toast({
                    title: "Error",
                    description: "Failed to delete billing record.",
                    variant: "destructive"
                });
            } finally {
                setDeleteId(null);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Billing Dashboard</h1>
                    <p className="text-gray-600">Overview of patient accounts and billing status</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <CardTitle>Pending Billing</CardTitle>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search patient or encounter..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-3">Patient Name</th>
                                    <th className="px-4 py-3">Encounter / Admission</th>
                                    <th className="px-4 py-3">Running Balance</th>
                                    <th className="px-4 py-3">Payment Status</th>
                                    <th className="px-4 py-3">Last OR Date</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            {patient.patientName}
                                            <div className="text-xs text-gray-500">Room: {patient.room}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{patient.encounterId}</td>
                                        <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(patient.runningBalance)}</td>
                                        <td className="px-4 py-3">{getStatusBadge(patient.paymentStatus)}</td>
                                        <td className="px-4 py-3 text-gray-600">{patient.lastORDate || '-'}</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => onSelectPatient(patient.id)}>
                                                View Bill
                                            </Button>
                                            {patient.paymentStatus !== 'Paid' && (
                                                <>
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={(e) => { e.stopPropagation(); onQuickPay(patient); }}>
                                                        <CreditCard className="w-4 h-4 mr-1" /> Pay
                                                    </Button>
                                                    {onDeletePatient && (
                                                        <Button size="sm" variant="destructive" onClick={(e) => handleDeleteClick(e, patient.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredPatients.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the billing record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
