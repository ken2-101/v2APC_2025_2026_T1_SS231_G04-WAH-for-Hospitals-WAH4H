import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card'; // Basic Card used in dashboard container
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import billingService from '@/services/billingService';
import { admissionService } from '@/services/admissionService';

// Components
import PatientBillPrint from '@/components/billing/PatientBillPrint';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { PaymentModal } from '@/components/billing/PaymentModal';
import { PatientSelector } from '@/components/billing/PatientSelector';
import { BillingForm } from '@/components/billing/BillingForm';
import { convertAPIToLocal } from '@/components/billing/utils';
// Types
import { Patient, BillingRecord } from '@/components/billing/types';

const Billing = () => {
  const { toast } = useToast();
  
  // Patient & View State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'billing' | 'print'>('list');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // API Data
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admitted patients from Admissions module
  const [admittedPatients, setAdmittedPatients] = useState<any[]>([]);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // Fetch billing records, dashboard data, and admitted patients on mount
  useEffect(() => {
    fetchBillingData();
    fetchAdmittedPatients();
  }, []);

  const fetchBillingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [records, dashboard] = await Promise.all([
        billingService.getAll(),
        billingService.getDashboard()
      ]);
      setBillingRecords(records.map(convertAPIToLocal));
      setDashboardData(dashboard);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch admitted patients from Admissions module
  const fetchAdmittedPatients = async () => {
    try {
      const admissions = await admissionService.getAll();
      // Filter to only active admissions (not discharged)
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
    setCurrentView('billing');
  };

  const handleQuickPay = (p: Patient) => {
    handlePatientSelect(p);
    setIsPaymentModalOpen(true);
  };

  const handleSaveSuccess = async () => {
    await fetchBillingData();
    setCurrentView('list');
  };

  // --- Render Sections ---

  const existingBilling = selectedPatient ? billingRecords.find(b => b.patientId === selectedPatient.id) : null;

  if (currentView === 'print' && existingBilling) {
    return <PatientBillPrint billingRecord={existingBilling} onClose={() => setCurrentView('billing')} />;
  }

  // Calculate dashboard view data
  const dashboardPatients = dashboardData.map(d => ({
    id: d.id,
    patientName: d.patientName,
    encounterId: d.encounterId,
    runningBalance: Number(d.runningBalance),
    paymentStatus: d.paymentStatus,
    lastORDate: d.lastORDate,
    room: d.room
  }));

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && currentView === 'list' && (
        <Alert>
          <AlertDescription>Loading billing data...</AlertDescription>
        </Alert>
      )}

      {currentView === 'list' && (
          <>
            <PatientSelector 
                show={showPatientSelector}
                onShow={() => setShowPatientSelector(true)}
                admittedPatients={admittedPatients} 
                billingRecords={billingRecords}
                onSelect={handlePatientSelect}
                onCancel={() => setShowPatientSelector(false)}
            />

            {!showPatientSelector && (
              <BillingDashboard 
                patients={dashboardPatients} 
                onSelectPatient={(id) => {
                   const record = billingRecords.find(r => r.id === id);
                   if (record) {
                      const p: Patient = {
                          id: record.patientId,
                          patientName: record.patientName,
                          room: record.roomWard,
                          admissionDate: record.admissionDate,
                          dischargeDate: record.dischargeDate,
                          condition: '',
                          physician: '',
                          department: '',
                          age: 0, 
                          status: 'ready'
                      };
                      handlePatientSelect(p);
                   }
                }}
                onQuickPay={(bp) => {
                   const record = billingRecords.find(r => r.id === bp.id);
                   if (record) {
                      const p: Patient = {
                          id: record.patientId,
                          patientName: record.patientName,
                          room: record.roomWard,
                          admissionDate: record.admissionDate,
                          dischargeDate: record.dischargeDate,
                          condition: '',
                          physician: '',
                          department: '',
                          age: 0, 
                          status: 'ready'
                      };
                      handleQuickPay(p);
                   }
                }}
              />
            )}
          </>
      )}

      {currentView === 'billing' && selectedPatient && (
          <BillingForm 
            patient={selectedPatient}
            billingRecords={billingRecords}
            onSaveSuccess={handleSaveSuccess}
            onCancel={() => setCurrentView('list')}
            onPrint={() => setCurrentView('print')}
          />
      )}

      {/* Payment Modal remains here as it's overlay */}
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
            onPaymentSuccess={() => {
                fetchBillingData();
                setIsPaymentModalOpen(false);
            }}
          />
      )}
    </div>
  );
};

export default Billing;
