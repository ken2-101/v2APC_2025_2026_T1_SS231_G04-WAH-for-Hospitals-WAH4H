import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, DollarSign, FileText, FlaskConical, Pill } from 'lucide-react';
import billingService from '@/services/billingService';

interface BillingDashboardProps {
    subjectId: number | null;
    onInvoiceGenerated?: () => void;
}

interface PatientSummary {
    subject_id: number;
    billed_total: number;
    unbilled_lab_total: number;
    unbilled_pharmacy_total: number;
    unbilled_total: number;
    grand_total: number;
}

export const PatientBillingSummary: React.FC<BillingDashboardProps> = ({ subjectId, onInvoiceGenerated }) => {
    const [summary, setSummary] = useState<PatientSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (subjectId) {
            fetchSummary(subjectId);
        } else {
            setSummary(null);
        }
    }, [subjectId]);

    const fetchSummary = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await billingService.getPatientSummary(id);
            setSummary(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load billing summary.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInvoice = async () => {
        if (!subjectId) return;

        setGenerating(true);
        setError(null);
        setSuccessMsg(null);

        try {
            await billingService.generateInvoice(subjectId);
            setSuccessMsg("Invoice successfully generated from pending orders.");
            // Refresh summary
            await fetchSummary(subjectId);
            if (onInvoiceGenerated) {
                onInvoiceGenerated();
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 400 && err.response.data?.message === "No pending orders found") {
                setError("No pending orders found to bill.");
            } else {
                setError("Failed to generate invoice. Please try again.");
            }
        } finally {
            setGenerating(false);
        }
    };

    if (!subjectId) {
        return (
            <div className="text-center p-8 text-gray-500">
                <h3 className="text-lg font-medium">Select a patient to view billing billing summary</h3>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!summary) return null;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {successMsg && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                    <FlaskConical className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMsg}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{summary.billed_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Finalized Invoices</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unbilled Lab</CardTitle>
                        <FlaskConical className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{summary.unbilled_lab_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Pending Results</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unbilled Pharmacy</CardTitle>
                        <Pill className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{summary.unbilled_pharmacy_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Dispensed Meds</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Grand Total Liability</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">₱{summary.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-primary/80">Total to be paid</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button
                    size="lg"
                    onClick={handleGenerateInvoice}
                    disabled={generating || summary.unbilled_total <= 0}
                    className="bg-primary hover:bg-primary/90"
                >
                    {generating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Invoice...
                        </>
                    ) : (
                        <>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Invoice from Pending Orders
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
