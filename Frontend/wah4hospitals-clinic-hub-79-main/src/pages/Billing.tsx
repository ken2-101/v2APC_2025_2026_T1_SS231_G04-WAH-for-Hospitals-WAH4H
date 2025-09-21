import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Receipt, Plus, Trash2, Users, Search, FileText, CheckCircle, Lock, Printer } from 'lucide-react';
import PatientBillPrint from '@/components/billing/PatientBillPrint';

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

const Billing = () => {
  // Patient management
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'billing' | 'print'>('list');
  
  // Sample patient data (in real app, this would come from your patient database)
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

  // Billing records storage
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  
  // Current billing form state
  const [patientName, setPatientName] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [roomWard, setRoomWard] = useState('');
  
  // Room Charges
  const [roomType, setRoomType] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [ratePerDay, setRatePerDay] = useState(0);
  
  // Professional Fees
  const [attendingPhysicianFee, setAttendingPhysicianFee] = useState(0);
  const [specialistFee, setSpecialistFee] = useState(0);
  const [surgeonFee, setSurgeonFee] = useState(0);
  const [otherProfessionalFees, setOtherProfessionalFees] = useState(0);
  
  // Medicines
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  
  // Dietary
  const [dietType, setDietType] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(0);
  const [dietDuration, setDietDuration] = useState(0);
  const [costPerMeal, setCostPerMeal] = useState(0);
  
  // Diagnostics
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  
  // Other charges
  const [suppliesCharge, setSuppliesCharge] = useState(0);
  const [procedureCharge, setProcedureCharge] = useState(0);
  const [nursingCharge, setNursingCharge] = useState(0);
  const [miscellaneousCharge, setMiscellaneousCharge] = useState(0);
  
  // Billing Summary
  const [discount, setDiscount] = useState(0);
  const [philhealthCoverage, setPhilhealthCoverage] = useState(0);

  const addMedicine = () => {
    setMedicines([...medicines, { id: Date.now(), name: '', dosage: '', quantity: 0, unitPrice: 0 }]);
  };

  const removeMedicine = (id: number) => {
    setMedicines(medicines.filter(med => med.id !== id));
  };

  const updateMedicine = (id: number, field: keyof MedicineItem, value: any) => {
    setMedicines(medicines.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const addDiagnostic = () => {
    setDiagnostics([...diagnostics, { id: Date.now(), name: '', cost: 0 }]);
  };

  const removeDiagnostic = (id: number) => {
    setDiagnostics(diagnostics.filter(diag => diag.id !== id));
  };

  const updateDiagnostic = (id: number, field: keyof DiagnosticItem, value: any) => {
    setDiagnostics(diagnostics.map(diag => 
      diag.id === id ? { ...diag, [field]: value } : diag
    ));
  };

  // Calculations
  const totalRoomCharge = numberOfDays * ratePerDay;
  const totalProfessionalFees = attendingPhysicianFee + specialistFee + surgeonFee + otherProfessionalFees;
  const totalMedicineCharge = medicines.reduce((total, med) => total + (med.quantity * med.unitPrice), 0);
  const totalDietaryCharge = mealsPerDay * dietDuration * costPerMeal;
  const totalDiagnosticsCharge = diagnostics.reduce((total, diag) => total + diag.cost, 0);
  
  const subtotal = totalRoomCharge + totalProfessionalFees + totalMedicineCharge + 
                  totalDietaryCharge + totalDiagnosticsCharge + suppliesCharge + 
                  procedureCharge + nursingCharge + miscellaneousCharge;
  
  const outOfPocketTotal = subtotal - discount - philhealthCoverage;

  // Get existing billing record for selected patient
  const existingBilling = selectedPatient ? billingRecords.find(b => b.patientId === selectedPatient.id) : null;
  const isFinalized = existingBilling?.isFinalized || false;

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView('billing');
    
    // Load existing billing data if available
    const existing = billingRecords.find(b => b.patientId === patient.id);
    if (existing) {
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
      // Initialize with patient data
      setPatientName(patient.patientName);
      setHospitalId(patient.id.toString());
      setAdmissionDate(patient.admissionDate);
      setDischargeDate(patient.dischargeDate || '');
      setRoomWard(patient.room);
      // Reset other fields
      resetBillingForm();
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
  };

  const handleSaveBill = () => {
    if (!selectedPatient) return;

    const billingRecord: BillingRecord = {
      id: existingBilling?.id || Date.now(),
      patientId: selectedPatient.id,
      isFinalized: true,
      finalizedDate: new Date().toISOString(),
      patientName,
      hospitalId,
      admissionDate,
      dischargeDate,
      roomWard,
      roomType,
      numberOfDays,
      ratePerDay,
      attendingPhysicianFee,
      specialistFee,
      surgeonFee,
      otherProfessionalFees,
      medicines,
      dietType,
      mealsPerDay,
      dietDuration,
      costPerMeal,
      diagnostics,
      suppliesCharge,
      procedureCharge,
      nursingCharge,
      miscellaneousCharge,
      discount,
      philhealthCoverage
    };

    if (existingBilling) {
      setBillingRecords(prev => prev.map(b => b.id === existingBilling.id ? billingRecord : b));
    } else {
      setBillingRecords(prev => [...prev, billingRecord]);
    }

    alert('Billing record has been finalized and saved!');
  };

  const handlePrintBill = () => {
    if (!isFinalized) {
      alert('Please save the bill first before printing.');
      return;
    }
    setCurrentView('print');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPatient(null);
  };

  const handleBackToBilling = () => {
    setCurrentView('billing');
  };

  const handleQuickPrint = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the patient
    const billing = billingRecords.find(b => b.patientId === patient.id);
    if (billing && billing.isFinalized) {
      setSelectedPatient(patient);
      setCurrentView('print');
    }
  };

  // Handle print view
  if (currentView === 'print' && existingBilling) {
    return <PatientBillPrint billingRecord={existingBilling} onClose={handleBackToBilling} />;
  }

  if (currentView === 'list') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Billing Management</h1>
          <p className="text-gray-600">Select a patient to manage their billing information</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients by name, room, or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Patients ({filteredPatients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPatients.map((patient) => {
                const hasBilling = billingRecords.some(b => b.patientId === patient.id);
                const isFinalized = billingRecords.find(b => b.patientId === patient.id)?.isFinalized;
                
                return (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{patient.patientName}</h3>
                        <Badge variant={patient.status === 'discharged' ? 'default' : patient.status === 'ready' ? 'secondary' : 'outline'}>
                          {patient.status}
                        </Badge>
                        {isFinalized && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Lock className="w-3 h-3 mr-1" />
                            Finalized
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
                        <span>Room: {patient.room}</span>
                        <span>Age: {patient.age}</span>
                        <span>Condition: {patient.condition}</span>
                        <span>Physician: {patient.physician}</span>
                      </div>
                    </div>
                    <div className="text-right flex gap-2"
                    onClick={() => handlePatientSelect(patient)}>
                      <Button variant="outline" size="sm">
                        
                        {hasBilling ? 'View Billing' : 'Create Bill'}
                      </Button>
                      {isFinalized && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={(e) => handleQuickPrint(patient, e)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Print
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredPatients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No patients found matching your search criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Billing Record</h1>
          <p className="text-gray-600">Patient: {selectedPatient?.patientName} - Room {selectedPatient?.room}</p>
        </div>
        <Button variant="outline" onClick={handleBackToList}>
          Back to Patient List
        </Button>
      </div>

      {isFinalized && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This billing record has been finalized on {existingBilling?.finalizedDate ? new Date(existingBilling.finalizedDate).toLocaleDateString() : 'Unknown'}. 
            Changes cannot be made to finalized records.
          </AlertDescription>
        </Alert>
      )}

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="patient-name">Patient Name</Label>
            <Input
              id="patient-name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              disabled={isFinalized}
            />
          </div>
          <div>
            <Label htmlFor="hospital-id">Hospital ID / Case Number</Label>
            <Input
              id="hospital-id"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              disabled={isFinalized}
            />
          </div>
          <div>
            <Label htmlFor="admission-date">Admission Date</Label>
            <Input
              id="admission-date"
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              disabled={isFinalized}
            />
          </div>
          <div>
            <Label htmlFor="discharge-date">Discharge Date</Label>
            <Input
              id="discharge-date"
              type="date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
              disabled={isFinalized}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="room-ward">Room/Ward</Label>
            <Input
              id="room-ward"
              value={roomWard}
              onChange={(e) => setRoomWard(e.target.value)}
              disabled={isFinalized}
            />
          </div>
        </CardContent>
      </Card>

      {/* Room Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Room Charges</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="room-type">Room Type</Label>
            <Select value={roomType} onValueChange={setRoomType} disabled={isFinalized}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="semi-private">Semi-Private</SelectItem>
                <SelectItem value="ward">Ward</SelectItem>
                <SelectItem value="icu">ICU</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="days">Number of Days</Label>
            <Input
              id="days"
              type="number"
              value={numberOfDays}
              onChange={(e) => setNumberOfDays(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="rate">Rate per Day ₱</Label>
            <Input
              id="rate"
              type="number"
              value={ratePerDay}
              onChange={(e) => setRatePerDay(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Total Room Charge</Label>
            <Input value={`₱${totalRoomCharge.toFixed(2)}`} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Professional Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Fees</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="attending-fee">Attending Physician ₱</Label>
            <Input
              id="attending-fee"
              type="number"
              value={attendingPhysicianFee}
              onChange={(e) => setAttendingPhysicianFee(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="specialist-fee">Specialist ₱</Label>
            <Input
              id="specialist-fee"
              type="number"
              value={specialistFee}
              onChange={(e) => setSpecialistFee(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="surgeon-fee">Surgeon / Anesthesiologist ₱</Label>
            <Input
              id="surgeon-fee"
              type="number"
              value={surgeonFee}
              onChange={(e) => setSurgeonFee(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="other-fees">Others ₱</Label>
            <Input
              id="other-fees"
              type="number"
              value={otherProfessionalFees}
              onChange={(e) => setOtherProfessionalFees(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Medicines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Medicines
            <Button onClick={addMedicine} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicines.map((medicine) => (
            <div key={medicine.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
              <div>
                <Label>Medication Name</Label>
                <Input
                  value={medicine.name}
                  onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                />
              </div>
              <div>
                <Label>Dosage & Frequency</Label>
                <Input
                  value={medicine.dosage}
                  onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={medicine.quantity}
                  onChange={(e) => updateMedicine(medicine.id, 'quantity', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Unit Price</Label>
                <Input
                  type="number"
                  value={medicine.unitPrice}
                  onChange={(e) => updateMedicine(medicine.id, 'unitPrice', Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeMedicine(medicine.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="text-right">
            <strong>Total Medicine Charge: ₱{totalMedicineCharge.toFixed(2)}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Intake */}
      <Card>
        <CardHeader>
          <CardTitle>Dietary Intake</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="diet-type">Type of Diet</Label>
            <Select value={dietType} onValueChange={setDietType}>
              <SelectTrigger>
                <SelectValue placeholder="Select diet type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="soft">Soft</SelectItem>
                <SelectItem value="diabetic">Diabetic</SelectItem>
                <SelectItem value="renal">Renal</SelectItem>
                <SelectItem value="cardiac">Cardiac</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="meals-per-day">Meals per Day</Label>
            <div className="flex justify-center pb-2">
              <Input
                id="meals-per-day"
                type="number"
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(Number(e.target.value))}
              />
              <span className="text-2xl text-gray-500 mx-4 mt-0.5">&times;</span>
            </div>
          </div>
                    
          <div>
            <Label htmlFor="diet-duration">Duration (days)</Label>
            <div className="flex justify-center pb-2 ">
            <Input
              id="diet-duration"
              type="number"
              value={dietDuration}
              onChange={(e) => setDietDuration(Number(e.target.value))}
            />
              <span className="text-2xl text-gray-500 mx-4 mt-0.5">&times;</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="cost-per-meal">Cost per Meal ₱</Label>
            <Input
              id="cost-per-meal"
              type="number"
              value={costPerMeal}
              onChange={(e) => setCostPerMeal(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-4 text-right">
            <strong>Total Dietary Charge: ₱{totalDietaryCharge.toFixed(2)}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Diagnostics
            <Button onClick={addDiagnostic} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Test
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnostics.map((diagnostic) => (
            <div key={diagnostic.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="md:col-span-2">
                <Label>Test Name</Label>
                <Input
                  value={diagnostic.name}
                  onChange={(e) => updateDiagnostic(diagnostic.id, 'name', e.target.value)}
                  placeholder="e.g., X-ray, CT Scan, Blood Test"
                />
              </div>
              <div>
                <Label>Cost</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={diagnostic.cost}
                    onChange={(e) => updateDiagnostic(diagnostic.id, 'cost', Number(e.target.value))}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeDiagnostic(diagnostic.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <div className="text-right">
            <strong>Total Diagnostics Charge: ₱{totalDiagnosticsCharge.toFixed(2)}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Other Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Other Charges</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplies">Supplies Charge ₱</Label>
            <Input
              id="supplies"
              type="number"
              value={suppliesCharge}
              onChange={(e) => setSuppliesCharge(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="procedures">Procedures / Surgery ₱</Label>
            <Input
              id="procedures"
              type="number"
              value={procedureCharge}
              onChange={(e) => setProcedureCharge(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="nursing">Nursing and Monitoring ₱</Label>
            <Input
              id="nursing"
              type="number"
              value={nursingCharge}
              onChange={(e) => setNursingCharge(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="miscellaneous">Miscellaneous ₱</Label>
            <Input
              id="miscellaneous"
              type="number"
              value={miscellaneousCharge}
              onChange={(e) => setMiscellaneousCharge(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Billing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-discount">
            <div>
              <Label htmlFor="discount">Discounts / Deductions  ₱</Label>
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="philhealth">PhilHealth / Insurance Coverage</Label>
              <Input
                id="philhealth"
                type="number"
                value={philhealthCoverage}
                onChange={(e) => setPhilhealthCoverage(Number(e.target.value))}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Room Charges:</span>
              <span>₱{totalRoomCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Professional Fees:</span>
              <span>₱{totalProfessionalFees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Medicines:</span>
              <span>₱{totalMedicineCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dietary:</span>
              <span>₱{totalDietaryCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Diagnostics:</span>
              <span>₱{totalDiagnosticsCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Charges:</span>
              <span>₱{(suppliesCharge + procedureCharge + nursingCharge + miscellaneousCharge).toFixed(2)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold">
              <span>Subtotal:</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Less: Discounts:</span>
              <span>-₱{discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Less: PhilHealth/Insurance:</span>
              <span>-₱{philhealthCoverage.toFixed(2)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Out-of-Pocket Total:</span>
              <span>₱{outOfPocketTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button 
              className="flex-1" 
              onClick={handleSaveBill}
              disabled={isFinalized}
            >
              {isFinalized ? 'Bill Finalized' : 'Save & Finalize Bill'}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handlePrintBill}
              disabled={!isFinalized}
            >
              <FileText className="w-4 h-4 mr-2" />
              Print Bill
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
