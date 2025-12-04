import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DispenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    prescription: any;
    onDispense: (prescriptionId: string, dispensedData: any) => void;
}

export const DispenseModal: React.FC<DispenseModalProps> = ({ isOpen, onClose, prescription, onDispense }) => {
    const [dispenseData, setDispenseData] = useState({
        quantityDispensed: '',
        pharmacistName: '',
        notes: ''
    });

    if (!prescription) return null;

    const handleDispense = () => {
        if (!dispenseData.quantityDispensed || !dispenseData.pharmacistName) {
            toast.error('Please fill in all required fields');
            return;
        }

        const qty = parseInt(dispenseData.quantityDispensed);
        if (qty > prescription.quantity) {
            toast.error('Cannot dispense more than ordered quantity');
            return;
        }

        onDispense(prescription.id, {
            ...dispenseData,
            quantityDispensed: qty,
            status: qty < prescription.quantity ? 'partially-dispensed' : 'completed'
        });
        onClose();
        setDispenseData({ quantityDispensed: '', pharmacistName: '', notes: '' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-600" />
                        Dispense Medicine
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Patient:</span>
                            <span className="font-medium">{prescription.patientName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Medication:</span>
                            <span className="font-medium">{prescription.medication}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Dosage:</span>
                            <span className="font-medium">{prescription.dosage}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Frequency:</span>
                            <span className="font-medium">{prescription.frequency}</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                            <span className="text-gray-600">Quantity Ordered:</span>
                            <span className="font-bold text-blue-700">{prescription.quantity} units</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantityDispensed">Quantity to Dispense</Label>
                        <Input
                            id="quantityDispensed"
                            type="number"
                            value={dispenseData.quantityDispensed}
                            onChange={(e) => setDispenseData(prev => ({ ...prev, quantityDispensed: e.target.value }))}
                            placeholder="Enter quantity"
                        />
                        {parseInt(dispenseData.quantityDispensed) < prescription.quantity && dispenseData.quantityDispensed !== '' && (
                            <p className="text-xs text-orange-600 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" /> Partial dispensing
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pharmacistName">Pharmacist / Med Tech Name</Label>
                        <Input
                            id="pharmacistName"
                            value={dispenseData.pharmacistName}
                            onChange={(e) => setDispenseData(prev => ({ ...prev, pharmacistName: e.target.value }))}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                            id="notes"
                            value={dispenseData.notes}
                            onChange={(e) => setDispenseData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional instructions or notes"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleDispense} className="bg-blue-600 hover:bg-blue-700">Confirm Dispense</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
