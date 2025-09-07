import React from 'react';
import { Button } from '@/components/ui/button';

interface MedicineItem {
  id: number;
  name: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
}

interface DiagnosticItem {
  id: number;
  name: string;
  cost: number;
}

interface BillingRecord {
  id: number;
  patientId: number;
  isFinalized: boolean;
  finalizedDate?: string;
  patientName: string;
  hospitalId: string;
  admissionDate: string;
  dischargeDate: string;
  roomWard: string;
  roomType: string;
  numberOfDays: number;
  ratePerDay: number;
  attendingPhysicianFee: number;
  specialistFee: number;
  surgeonFee: number;
  otherProfessionalFees: number;
  medicines: MedicineItem[];
  dietType: string;
  mealsPerDay: number;
  dietDuration: number;
  costPerMeal: number;
  diagnostics: DiagnosticItem[];
  suppliesCharge: number;
  procedureCharge: number;
  nursingCharge: number;
  miscellaneousCharge: number;
  discount: number;
  philhealthCoverage: number;
}

interface PatientBillPrintProps {
  billingRecord: BillingRecord;
  onClose?: () => void;
}

const PatientBillPrint: React.FC<PatientBillPrintProps> = ({ billingRecord, onClose }) => {
  // Calculations
  const totalRoomCharge = billingRecord.numberOfDays * billingRecord.ratePerDay;
  const totalProfessionalFees = billingRecord.attendingPhysicianFee + billingRecord.specialistFee + billingRecord.surgeonFee + billingRecord.otherProfessionalFees;
  const totalMedicineCharge = billingRecord.medicines.reduce((total, med) => total + (med.quantity * med.unitPrice), 0);
  const totalDietaryCharge = billingRecord.mealsPerDay * billingRecord.dietDuration * billingRecord.costPerMeal;
  const totalDiagnosticsCharge = billingRecord.diagnostics.reduce((total, diag) => total + diag.cost, 0);
  
  const subtotal = totalRoomCharge + totalProfessionalFees + totalMedicineCharge + 
                  totalDietaryCharge + totalDiagnosticsCharge + billingRecord.suppliesCharge + 
                  billingRecord.procedureCharge + billingRecord.nursingCharge + billingRecord.miscellaneousCharge;
  
  const totalDiscount = billingRecord.discount + billingRecord.philhealthCoverage;
  const finalTotal = subtotal - totalDiscount;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 print:hidden">
        <h1 className="text-2xl font-bold mb-4 text-center">Patient Bill - {billingRecord.patientName}</h1>
        <div className="flex justify-center gap-4">
          <Button onClick={handlePrint}>Print Bill</Button>
          {onClose && (
            <Button onClick={onClose}>Close</Button>
          )}
        </div>
      </div>

      <div className="bg-background">
        {/* Hospital Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-border">
          <h1 className="text-2xl font-bold mb-2">WELLNESS ADVANCED HOSPITAL</h1>
          <p className="text-sm mb-1">123 Healthcare Avenue, Medical District, Metro Manila, Philippines</p>
          <p className="text-sm mb-4">+63 (02) 8123-4567 | emergency@wah.ph</p>
          <h2 className="text-lg font-bold uppercase tracking-wide">HOSPITAL BILL STATEMENT</h2>
        </div>

        {/* Patient Information */}
        <div className="mb-6">
          <h3 className="text-base font-bold mb-3 uppercase">Patient Information</h3>
          <div className="space-y-1 ml-4">
            <p><span className="font-medium">Name:</span> {billingRecord.patientName}</p>
            <p><span className="font-medium">Hospital ID:</span> {billingRecord.hospitalId}</p>
            <p><span className="font-medium">Room/Ward:</span> {billingRecord.roomWard} ({billingRecord.roomType})</p>
          </div>
        </div>

        {/* Stay Information */}
        <div className="mb-6">
          <h3 className="text-base font-bold mb-3 uppercase">Stay Information</h3>
          <div className="space-y-1 ml-4">
            <p><span className="font-medium">Admission Date:</span> {formatDate(billingRecord.admissionDate)}</p>
            <p><span className="font-medium">Discharge Date:</span> {formatDate(billingRecord.dischargeDate)}</p>
            <p><span className="font-medium">Length of Stay:</span> {billingRecord.numberOfDays} days</p>
          </div>
        </div>

        {/* Billing Details */}
        <div className="mb-6">
          <h3 className="text-base font-bold mb-3 uppercase">Billing Details</h3>
          
          {/* Room Charges */}
          <div className="ml-4 mb-4">
            <h4 className="font-semibold mb-2">Room Charges</h4>
            <div className="ml-4 space-y-1">
              <p><span className="font-medium">Room Type:</span> {billingRecord.roomType}</p>
              <p><span className="font-medium">Rate per Day:</span> {formatCurrency(billingRecord.ratePerDay)}</p>
              <p className="font-bold"><span>Total:</span> {formatCurrency(totalRoomCharge)}</p>
            </div>
          </div>

          {/* Professional Fees */}
          <div className="ml-4 mb-4">
            <h4 className="font-semibold mb-2">Professional Fees</h4>
            <div className="ml-4">
              <p className="font-bold"><span>Total Professional Fees:</span> {formatCurrency(totalProfessionalFees)}</p>
            </div>
          </div>

          {/* Other Charges */}
          <div className="ml-4 mb-4">
            <h4 className="font-semibold mb-2">Other Charges</h4>
          </div>
        </div>

        {/* Bill Summary */}
        <div className="mb-6 pt-4 border-t-2 border-border">
          <h3 className="text-base font-bold mb-3 uppercase">Bill Summary</h3>
          <div className="ml-4 space-y-2">
            <p className="text-lg"><span className="font-bold">Subtotal:</span> <span className="font-bold">{formatCurrency(subtotal)}</span></p>
            
            {billingRecord.discount > 0 && (
              <p className="text-lg"><span className="font-bold">Discount:</span> <span className="font-bold">-{formatCurrency(billingRecord.discount)}</span></p>
            )}
            
            {billingRecord.philhealthCoverage > 0 && (
              <p className="text-lg"><span className="font-bold">PhilHealth Coverage:</span> <span className="font-bold">-{formatCurrency(billingRecord.philhealthCoverage)}</span></p>
            )}
            
            <div className="pt-2 border-t border-border">
              <p className="text-xl font-bold"><span>Total Amount Due:</span> <span>{formatCurrency(finalTotal)}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBillPrint;
