import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Invoice } from '@/services/billingService';
import { FileText, Printer } from 'lucide-react';

interface InvoiceDetailModalProps {
    invoice: Invoice | null;
    isOpen: boolean;
    onClose: () => void;
    onPrint?: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoice, isOpen, onClose, onPrint }) => {
    if (!invoice) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle>Invoice Details</DialogTitle>
                            <DialogDescription>
                                Invoice #{invoice.identifier} • {new Date(invoice.invoice_datetime).toLocaleDateString()}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 my-4">
                    {/* Status Badge */}
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${invoice.status === 'balanced' ? 'bg-green-100 text-green-700' :
                                invoice.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'}`}>
                            {invoice.status ? invoice.status.toUpperCase() : 'UNKNOWN'}
                        </span>
                    </div>

                    {/* Line Items Table */}
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.line_items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-1 rounded-full ${item.sequence === 'LAB' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {item.sequence}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">₱{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            ₱{Number(item.net_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Totals */}
                    <div className="flex flex-col gap-2 items-end pt-4 border-t">
                        <div className="flex justify-between w-full max-w-xs">
                            <span className="text-gray-500">Subtotal:</span>
                            <span className="font-medium">₱{Number(invoice.total_net_value).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-full max-w-xs text-lg font-bold text-gray-900 mt-2">
                            <span>Total Due:</span>
                            <span>₱{Number(invoice.total_net_value).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        variant="ghost"
                        className="gap-2"
                        onClick={() => onPrint && onPrint()}
                    >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
