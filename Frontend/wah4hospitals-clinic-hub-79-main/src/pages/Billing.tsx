import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Receipt, Plus, Trash2, CheckCircle, Lock, FileText, Printer, CreditCard } from 'lucide-react';
import PatientBillPrint from '@/components/billing/PatientBillPrint';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { PaymentModal } from '@/components/billing/PaymentModal';
import { Checkbox } from '@/components/ui/checkbox';

interface Patient {
  id: number;
  patientName: string;
  room: string;
  admissionDate: string;
  condition: string;
  physician: string;
  department: string;
  age: number;
  status: 'pending' | 'ready' | 'discharged';
  dischargeDate?: string;
}

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

const Billing = () => {
  // Patient & View State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'billing' | 'print'>('list');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Sample Data
  const [patients] = useState<Patient[]>([
    {
      id: 1,
      patientName: 'Maria Santos',
      room: '202B',
      admissionDate: '2024-05-28',
      condition: 'Diabetes',
      status: 'ready',
      physician: 'Dr. Juan Cruz',
      department: 'Endocrinology',
      age: 45,
      dischargeDate: '2024-06-10'
    },
    {
      id: 2,
      patientName: 'Pedro Reyes',
      room: '301C',
      admissionDate: '2024-05-30',
      condition: 'COVID-19',
      status: 'discharged',
      physician: 'Dr. Ana Lopez',
      department: 'Infectious Disease',
      age: 38,
      dischargeDate: '2024-06-12'
    },
    {
      id: 3,
      patientName: 'Carmen dela Cruz',
      room: '105A',
      admissionDate: '2024-06-01',
      condition: 'Heart Surgery',
      status: 'pending',
      physician: 'Dr. Roberto Silva',
      department: 'Cardiology',
      age: 62,
    }
  ]);

  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [roomWard, setRoomWard] = useState('');

  const [roomType, setRoomType] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [ratePerDay, setRatePerDay] = useState(0);

  const [attendingPhysicianFee, setAttendingPhysicianFee] = useState(0);
  const [specialistFee, setSpecialistFee] = useState(0);
  const [surgeonFee, setSurgeonFee] = useState(0);
  const [otherProfessionalFees, setOtherProfessionalFees] = useState(0);

  const [medicines, setMedicines] = useState<MedicineItem[]>([]);

  const [dietType, setDietType] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(0);
  const [dietDuration, setDietDuration] = useState(0);
  const [costPerMeal, setCostPerMeal] = useState(0);

  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);

  const [suppliesCharge, setSuppliesCharge] = useState(0);
  const [procedureCharge, setProcedureCharge] = useState(0);
  const [nursingCharge, setNursingCharge] = useState(0);
  const [miscellaneousCharge, setMiscellaneousCharge] = useState(0);

  const [discount, setDiscount] = useState(0);
  const [philhealthCoverage, setPhilhealthCoverage] = useState(0);

  // Discount Flags
  const [isSenior, setIsSenior] = useState(false);
  const [isPWD, setIsPWD] = useState(false);
  const [isPhilHealthMember, setIsPhilHealthMember] = useState(false);

  // --- Derived State (Calculations) ---
  const totalRoomCharge = numberOfDays * ratePerDay;
  const totalProfessionalFees = attendingPhysicianFee + specialistFee + surgeonFee + otherProfessionalFees;
  const totalMedicineCharge = medicines.reduce((total, med) => total + (med.quantity * med.unitPrice), 0);
  const totalDietaryCharge = mealsPerDay * dietDuration * costPerMeal;
  const totalDiagnosticsCharge = diagnostics.reduce((total, diag) => total + diag.cost, 0);

  const subtotal = totalRoomCharge + totalProfessionalFees + totalMedicineCharge +
    totalDietaryCharge + totalDiagnosticsCharge + suppliesCharge +
    procedureCharge + nursingCharge + miscellaneousCharge;

  const outOfPocketTotal = subtotal - discount - philhealthCoverage;

  const existingBilling = selectedPatient ? billingRecords.find(b => b.patientId === selectedPatient.id) : null;
  const isFinalized = existingBilling?.isFinalized || false;

  // --- Effects ---

  // Auto-calculate discounts
  useEffect(() => {
    let newDiscount = 0;
    // Mock Policy: 20% discount on Vatable items (Room, Prof Fees, Meds, Diagnostics)
    const vatableAmount = totalRoomCharge + totalProfessionalFees + totalMedicineCharge + totalDiagnosticsCharge;

    if (isSenior || isPWD) {
      newDiscount = vatableAmount * 0.20;
    }

    // Only update if it's different to avoid loops (though strict mode might run twice)
    // We also don't want to overwrite manual discount if user keyed it in, but here we assume auto-calc overrides
    setDiscount(newDiscount);
  }, [isSenior, isPWD, totalRoomCharge, totalProfessionalFees, totalMedicineCharge, totalDiagnosticsCharge]);

  // --- Handlers ---

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView('billing');

    const existing = billingRecords.find(b => b.patientId === patient.id);
    if (existing) {
      // Load Existing
      setPatientName(existing.patientName);
      setHospitalId(existing.hospitalId);
      setAdmissionDate(existing.admissionDate);
      setDischargeDate(existing.dischargeDate);
      setRoomWard(existing.roomWard);
      setRoomType(existing.roomType);
      setNumberOfDays(existing.numberOfDays);
      setRatePerDay(existing.ratePerDay);
      setAttendingPhysicianFee(existing.attendingPhysicianFee);
      setSpecialistFee(existing.specialistFee);
      setSurgeonFee(existing.surgeonFee);
      setOtherProfessionalFees(existing.otherProfessionalFees);
      setMedicines(existing.medicines);
      setDietType(existing.dietType);
      setMealsPerDay(existing.mealsPerDay);
      setDietDuration(existing.dietDuration);
      setCostPerMeal(existing.costPerMeal);
      setDiagnostics(existing.diagnostics);
      setSuppliesCharge(existing.suppliesCharge);
      setProcedureCharge(existing.procedureCharge);
      setNursingCharge(existing.nursingCharge);
      setMiscellaneousCharge(existing.miscellaneousCharge);
      setDiscount(existing.discount);
      setPhilhealthCoverage(existing.philhealthCoverage);
    } else {
      // New Bill
      setPatientName(patient.patientName);
      setHospitalId(patient.id.toString());
      setAdmissionDate(patient.admissionDate);
      setDischargeDate(patient.dischargeDate || '');
      setRoomWard(patient.room);
      resetBillingForm();

      // Mock Auto-Add Lab/Pharmacy
      setMedicines([
        { id: 1, name: 'Paracetamol 500mg', dosage: '500mg', quantity: 10, unitPrice: 5.00 },
        { id: 2, name: 'Amoxicillin 500mg', dosage: '500mg', quantity: 21, unitPrice: 15.00 }
      ]);
      setDiagnostics([
        { id: 101, name: 'CBC (Complete Blood Count)', cost: 350 },
        { id: 102, name: 'Urinalysis', cost: 150 }
      ]);
      setSuppliesCharge(500);
      setRoomType('private');
      setRatePerDay(2500);
      // Rough days calc
      const days = Math.ceil((new Date().getTime() - new Date(patient.admissionDate).getTime()) / (1000 * 3600 * 24));
      setNumberOfDays(days > 0 ? days : 1);
    }
  };

  const resetBillingForm = () => {
    setRoomType('');
    setNumberOfDays(0);
    setRatePerDay(0);
    setAttendingPhysicianFee(0);
    setSpecialistFee(0);
    setSurgeonFee(0);
    setOtherProfessionalFees(0);
    setMedicines([]);
    setDietType('');
    setMealsPerDay(0);
    setDietDuration(0);
    setCostPerMeal(0);
    setDiagnostics([]);
    setSuppliesCharge(0);
    setProcedureCharge(0);
    setNursingCharge(0);
    setMiscellaneousCharge(0);
    setDiscount(0);
    setPhilhealthCoverage(0);
    setIsSenior(false);
    setIsPWD(false);
    setIsPhilHealthMember(false);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { id: Date.now(), name: '', dosage: '', quantity: 0, unitPrice: 0 }]);
  };

  const removeMedicine = (id: number) => {
    setMedicines(medicines.filter(med => med.id !== id));
  };

  const updateMedicine = (id: number, field: keyof MedicineItem, value: any) => {
    setMedicines(medicines.map(med => med.id === id ? { ...med, [field]: value } : med));
  };

  const addDiagnostic = () => {
    setDiagnostics([...diagnostics, { id: Date.now(), name: '', cost: 0 }]);
  };

  const removeDiagnostic = (id: number) => {
    setDiagnostics(diagnostics.filter(diag => diag.id !== id));
  };

  const updateDiagnostic = (id: number, field: keyof DiagnosticItem, value: any) => {
    setDiagnostics(diagnostics.map(diag => diag.id === id ? { ...diag, [field]: value } : diag));
  };

  const handleSaveBill = () => {
    if (!selectedPatient) return;
    const record: BillingRecord = {
      id: existingBilling?.id || Date.now(),
      patientId: selectedPatient.id,
      isFinalized: true,
      finalizedDate: new Date().toISOString(),
      patientName, hospitalId, admissionDate, dischargeDate, roomWard,
      roomType, numberOfDays, ratePerDay,
      attendingPhysicianFee, specialistFee, surgeonFee, otherProfessionalFees,
      medicines, dietType, mealsPerDay, dietDuration, costPerMeal,
      diagnostics, suppliesCharge, procedureCharge, nursingCharge, miscellaneousCharge,
      discount, philhealthCoverage
    };

    if (existingBilling) {
      setBillingRecords(prev => prev.map(b => b.id === existingBilling.id ? record : b));
    } else {
      setBillingRecords(prev => [...prev, record]);
    }
    alert('Billing record finalized.');
  };

  const handlePrintBill = () => {
    if (!isFinalized) {
      alert('Please save the bill first before printing.');
      return;
    }
    setCurrentView('print');
  };

  const handleQuickPay = (p: Patient) => {
    handlePatientSelect(p);
    setIsPaymentModalOpen(true);
  };

  // --- Render Sections ---

  if (currentView === 'print' && existingBilling) {
    return <PatientBillPrint billingRecord={existingBilling} onClose={() => setCurrentView('billing')} />;
  }

  if (currentView === 'list') {
    const dashboardPatients = patients.map(p => {
      const billing = billingRecords.find(b => b.patientId === p.id);
      const balance = billing ? 15000 : 5000; // Mock balance logic
      const paymentStatus = billing?.isFinalized ? 'Paid' : 'Pending';
      return {
        ...p,
        encounterId: `ENC-${202400 + p.id}`,
        runningBalance: balance,
        paymentStatus: paymentStatus as 'Paid' | 'Pending' | 'Partial',
        lastORDate: billing?.finalizedDate ? billing.finalizedDate.split('T')[0] : undefined,
        // Required by BillingDashboard Props? No, BillingPatient extends BillingDashboard props
      };
    });

    return (
      <BillingDashboard
        patients={dashboardPatients}
        onSelectPatient={(id) => {
          const p = patients.find(pat => pat.id === id);
          if (p) handlePatientSelect(p);
        }}
        onQuickPay={(p) => handleQuickPay(p as any)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Billing Record</h1>
          <p className="text-gray-600">Patient: {selectedPatient?.patientName} - {selectedPatient?.room}</p>
        </div>
        <Button variant="outline" onClick={() => { setCurrentView('list'); setSelectedPatient(null); }}>
          Back to Dashboard
        </Button>
      </div>

      {isFinalized && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Finalized</AlertTitle>
          <AlertDescription>
            This billing record has been finalized on {new Date(existingBilling!.finalizedDate!).toLocaleDateString()}.
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Patient Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Name</Label><Input value={patientName} onChange={e => setPatientName(e.target.value)} disabled={isFinalized} /></div>
          <div><Label>Hospital ID</Label><Input value={hospitalId} onChange={e => setHospitalId(e.target.value)} disabled={isFinalized} /></div>
          <div><Label>Admission</Label><Input type="date" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} disabled={isFinalized} /></div>
          <div><Label>Discharge</Label><Input type="date" value={dischargeDate} onChange={e => setDischargeDate(e.target.value)} disabled={isFinalized} /></div>
          <div className="md:col-span-2"><Label>Room/Ward</Label><Input value={roomWard} onChange={e => setRoomWard(e.target.value)} disabled={isFinalized} /></div>
        </CardContent>
      </Card>

      {/* Room Charges */}
      <Card>
        <CardHeader><CardTitle>Room Charges</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Type</Label>
            <Select value={roomType} onValueChange={setRoomType} disabled={isFinalized}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="ward">Ward</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Days</Label><Input type="number" value={numberOfDays} onChange={e => setNumberOfDays(Number(e.target.value))} disabled={isFinalized} /></div>
          <div><Label>Rate</Label><Input type="number" value={ratePerDay} onChange={e => setRatePerDay(Number(e.target.value))} disabled={isFinalized} /></div>
          <div><Label>Total</Label><Input value={totalRoomCharge.toFixed(2)} disabled /></div>
        </CardContent>
      </Card>

      {/* Prof Fees */}
      <Card>
        <CardHeader><CardTitle>Professional Fees</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Attending</Label><Input type="number" value={attendingPhysicianFee} onChange={e => setAttendingPhysicianFee(Number(e.target.value))} disabled={isFinalized} /></div>
          <div><Label>Specialist</Label><Input type="number" value={specialistFee} onChange={e => setSpecialistFee(Number(e.target.value))} disabled={isFinalized} /></div>
          <div><Label>Surgeon</Label><Input type="number" value={surgeonFee} onChange={e => setSurgeonFee(Number(e.target.value))} disabled={isFinalized} /></div>
          <div><Label>Others</Label><Input type="number" value={otherProfessionalFees} onChange={e => setOtherProfessionalFees(Number(e.target.value))} disabled={isFinalized} /></div>
        </CardContent>
      </Card>

      {/* Medicines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            Medicines
            {!isFinalized && <Button size="sm" onClick={addMedicine}><Plus className="w-4 h-4 mr-2" />Add</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicines.map(med => (
            <div key={med.id} className="grid grid-cols-5 gap-2 border p-2 rounded">
              <div className="col-span-1"><Label>Name</Label><Input value={med.name} onChange={e => updateMedicine(med.id, 'name', e.target.value)} disabled={isFinalized} /></div>
              <div className="col-span-1"><Label>Dosage</Label><Input value={med.dosage} onChange={e => updateMedicine(med.id, 'dosage', e.target.value)} disabled={isFinalized} /></div>
              <div><Label>Qty</Label><Input type="number" value={med.quantity} onChange={e => updateMedicine(med.id, 'quantity', Number(e.target.value))} disabled={isFinalized} /></div>
              <div><Label>Price</Label><Input type="number" value={med.unitPrice} onChange={e => updateMedicine(med.id, 'unitPrice', Number(e.target.value))} disabled={isFinalized} /></div>
              <div className="flex items-end">{!isFinalized && <Button variant="destructive" size="sm" onClick={() => removeMedicine(med.id)}><Trash2 className="w-4 h-4" /></Button>}</div>
            </div>
          ))}
          <div className="text-right font-bold">Total Meds: ₱{totalMedicineCharge.toFixed(2)}</div>
        </CardContent>
      </Card>

      {/* Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            Diagnostics
            {!isFinalized && <Button size="sm" onClick={addDiagnostic}><Plus className="w-4 h-4 mr-2" />Add</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnostics.map(diag => (
            <div key={diag.id} className="grid grid-cols-3 gap-2 border p-2 rounded">
              <div className="col-span-2"><Label>Name</Label><Input value={diag.name} onChange={e => updateDiagnostic(diag.id, 'name', e.target.value)} disabled={isFinalized} /></div>
              <div className="flex gap-2 items-end">
                <div className="flex-1"><Label>Cost</Label><Input type="number" value={diag.cost} onChange={e => updateDiagnostic(diag.id, 'cost', Number(e.target.value))} disabled={isFinalized} /></div>
                {!isFinalized && <Button variant="destructive" size="sm" onClick={() => removeDiagnostic(diag.id)}><Trash2 className="w-4 h-4" /></Button>}
              </div>
            </div>
          ))}
          <div className="text-right font-bold">Total Diagnostics: ₱{totalDiagnosticsCharge.toFixed(2)}</div>
        </CardContent>
      </Card>

      {/* Other Charges */}
      <Card>
        <CardHeader><CardTitle>Other Charges</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><Label>Supplies</Label><Input type="number" value={suppliesCharge} onChange={e => setSuppliesCharge(Number(e.target.value))} disabled={isFinalized} /></div>
          <div><Label>Procedures</Label><Input type="number" value={procedureCharge} onChange={e => setProcedureCharge(Number(e.target.value))} disabled={isFinalized} /></div>
          <div><Label>Nursing</Label><Input type="number" value={nursingCharge} onChange={e => setNursingCharge(Number(e.target.value))} disabled={isFinalized} /></div>
          <div><Label>Misc</Label><Input type="number" value={miscellaneousCharge} onChange={e => setMiscellaneousCharge(Number(e.target.value))} disabled={isFinalized} /></div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Billing Summary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">Discounts & Coverage</h3>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="senior" checked={isSenior} onCheckedChange={(c) => !isFinalized && setIsSenior(c === true)} disabled={isFinalized} />
                <Label htmlFor="senior">Senior Citizen</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="pwd" checked={isPWD} onCheckedChange={(c) => !isFinalized && setIsPWD(c === true)} disabled={isFinalized} />
                <Label htmlFor="pwd">PWD</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ph" checked={isPhilHealthMember} onCheckedChange={(c) => !isFinalized && setIsPhilHealthMember(c === true)} disabled={isFinalized} />
                <Label htmlFor="ph">PhilHealth Member</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Discount Amount</Label><Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} disabled={isFinalized} /></div>
              <div><Label>PhilHealth Coverage</Label><Input type="number" value={philhealthCoverage} onChange={e => setPhilhealthCoverage(Number(e.target.value))} disabled={isFinalized} /></div>
            </div>
          </div>
          <Separator />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Room:</span><span>₱{totalRoomCharge.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Prof Fees:</span><span>₱{totalProfessionalFees.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Meds:</span><span>₱{totalMedicineCharge.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Dietary:</span><span>₱{totalDietaryCharge.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Diagnostics:</span><span>₱{totalDiagnosticsCharge.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Others:</span><span>₱{(suppliesCharge + procedureCharge + nursingCharge + miscellaneousCharge).toFixed(2)}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold"><span>Subtotal:</span><span>₱{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-red-600"><span>Less Discount:</span><span>-₱{discount.toFixed(2)}</span></div>
            <div className="flex justify-between text-red-600"><span>Less PhilHealth:</span><span>-₱{philhealthCoverage.toFixed(2)}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between text-xl font-bold"><span>Net Payable:</span><span>₱{outOfPocketTotal.toFixed(2)}</span></div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button className="flex-1" onClick={handleSaveBill} disabled={isFinalized}>
              {isFinalized ? 'Finalized' : 'Save & Finalize'}
            </Button>
            {isFinalized && (
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => setIsPaymentModalOpen(true)}>
                <CreditCard className="w-4 h-4 mr-2" /> Pay
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={handlePrintBill} disabled={!isFinalized}>
              <Printer className="w-4 h-4 mr-2" /> Print Bill
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        patientName={patientName}
        totalBalance={outOfPocketTotal}
        onPaymentSuccess={(data) => {
          alert(`Payment Processed! OR: ${data.orNumber}`);
          // Logic to update status would go here
        }}
      />
    </div>
  );
};

export default Billing;
