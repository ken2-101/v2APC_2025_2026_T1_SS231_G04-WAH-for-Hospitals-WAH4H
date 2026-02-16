import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Receipt, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import billingService from '@/services/billingService';
import { admissionService } from '@/services/admissionService';

// Components
import PatientBillPrint from '@/components/billing/PatientBillPrint';
import { PatientBillingSummary } from '@/components/billing/PatientBillingSummary';
import { PaymentModal } from '@/components/billing/PaymentModal';
import { PatientSelector } from '@/components/billing/PatientSelector';
import { BillingForm } from '@/components/billing/BillingForm';
import { convertAPIToLocal } from '@/components/billing/utils';

// Types
import type { Patient, BillingRecord } from '@/components/billing/types';

const Billing = () => {
  const { toast } = useToast();

  // Patient & View State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'billing' | 'print'>('list');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // API Data
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admitted patients from Admissions module
  const [admittedPatients, setAdmittedPatients] = useState<any[]>([]);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // Fetch billing records and admitted patients on mount
  useEffect(() => {
    fetchBillingData();
    fetchAdmittedPatients();
  }, []);

  // Auto-open patient selector if no patient is selected and patients are loaded
  useEffect(() => {
    if (!selectedPatient && admittedPatients.length > 0 && !showPatientSelector && !isLoading) {
      setShowPatientSelector(true);
    }
  }, [admittedPatients, selectedPatient, showPatientSelector, isLoading]);

  const fetchBillingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await billingService.getAll();
      setBillingRecords(records.map(convertAPIToLocal));
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setBillingRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdmittedPatients = async () => {
    try {
      const admissions = await admissionService.getAll();
      const activeAdmissions = admissions.filter((adm: any) =>
        ['active', 'in-progress', 'admitted', 'finished'].includes(adm.status?.toLowerCase())
      );
      setAdmittedPatients(activeAdmissions);
    } catch (err) {
      console.error('Error fetching admitted patients:', err);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
  };

  const handleSaveSuccess = async () => {
    await fetchBillingData();
    setCurrentView('list');
    toast({
      title: "Success",
      description: "Billing record saved successfully.",
    });
  };

  const existingBilling = selectedPatient ? billingRecords.find(b => b.patientId === selectedPatient.id) : null;

  // Print View
  if (currentView === 'print' && existingBilling) {
    return <PatientBillPrint billingRecord={existingBilling} onClose={() => setCurrentView('list')} />;
  }

  // Billing Form View
  if (currentView === 'billing' && selectedPatient) {
    return (
      <BillingForm
        patient={selectedPatient}
        billingRecords={billingRecords}
        onSaveSuccess={handleSaveSuccess}
        onCancel={() => setCurrentView('list')}
        onPrint={() => setCurrentView('print')}
      />
    );
  }

  // Main List View
  return (
    <div className="space-y-6">
      {/* Glass Card Header */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #45017c 0%, #0a9bff 100%)' }}>
              <Receipt className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
              <p className="text-gray-600 mt-0.5">Patient billing management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats in header */}
            {!selectedPatient && (
              <div className="flex gap-3 text-sm text-gray-600">
                <div>
                  <span className="font-semibold text-purple-600">{admittedPatients.length}</span> Patient{admittedPatients.length !== 1 ? 's' : ''}
                </div>
                <div className="text-gray-300">•</div>
                <div>
                  <span className="font-semibold text-blue-600">{billingRecords.length}</span> Record{billingRecords.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {selectedPatient && (
              <Button
                variant="outline"
                onClick={() => setSelectedPatient(null)}
                className="gap-2 border-gray-300 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Patient Selected - Show Summary and Actions */}
      {selectedPatient && (
        <div className="space-y-6">
          {/* Patient Card - Front and Center */}
          <Card className="border-purple-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Patient</div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPatient.patientName}</h2>
                  <div className="flex gap-3 mt-2 text-sm text-gray-600">
                    <span>ID: {selectedPatient.id}</span>
                    <span>•</span>
                    <span>Room: {selectedPatient.room}</span>
                  </div>
                </div>
                <Button
                  onClick={() => setCurrentView('billing')}
                  className="text-white shadow-md hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #45017c 0%, #0a9bff 100%)' }}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing Summary */}
          <PatientBillingSummary
            subjectId={selectedPatient.id}
            onInvoiceGenerated={fetchBillingData}
          />
        </div>
      )}

      {/* Patient Selector Modal */}
      {showPatientSelector && (
        <PatientSelector
          show={showPatientSelector}
          onShow={() => setShowPatientSelector(true)}
          admittedPatients={admittedPatients}
          billingRecords={billingRecords}
          onSelect={handlePatientSelect}
          onCancel={() => setShowPatientSelector(false)}
        />
      )}

      {/* Payment Modal */}
      {selectedPatient && existingBilling && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          patientName={selectedPatient.patientName}
          totalBalance={(() => {
            const b = existingBilling;
            const totalRoom = b.numberOfDays * b.ratePerDay;
            const totalProf = b.attendingPhysicianFee + b.specialistFee + b.surgeonFee + b.otherProfessionalFees;
            const totalMeds = b.medicines.reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0);
            const totalDiags = b.diagnostics.reduce((acc, d) => acc + d.cost, 0);
            const totalDiet = b.mealsPerDay * b.dietDuration * b.costPerMeal;
            const subtotal = totalRoom + totalProf + totalMeds + totalDiags + totalDiet +
              b.suppliesCharge + b.procedureCharge + b.nursingCharge + b.miscellaneousCharge;
            return Math.max(0, subtotal - b.discount - b.philhealthCoverage);
          })()}
          onPaymentSuccess={async (paymentData) => {
            try {
              if (existingBilling && existingBilling.id) {
                setIsLoading(true);
                const apiPaymentData = {
                  amount: paymentData.amount,
                  payment_method: paymentData.method,
                  payment_date: paymentData.date,
                  or_number: paymentData.orNumber,
                  cashier: paymentData.cashier,
                  paymentIdentifier: paymentData.orNumber
                };

                await billingService.addPayment(existingBilling.id, apiPaymentData as any);

                toast({
                  title: "Payment Recorded",
                  description: "Payment has been successfully processed.",
                });

                await fetchBillingData();
              }
            } catch (err) {
              console.error("Error saving payment:", err);
              toast({
                variant: "destructive",
                title: "Payment Error",
                description: "Failed to save payment record.",
              });
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default Billing;
