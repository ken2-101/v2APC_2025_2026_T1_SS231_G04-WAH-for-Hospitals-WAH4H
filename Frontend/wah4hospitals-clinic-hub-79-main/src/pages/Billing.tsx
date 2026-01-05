import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Receipt, Plus, Trash2, CheckCircle, Lock, FileText, Printer, CreditCard, RefreshCw, Users } from 'lucide-react';
import PatientBillPrint from '@/components/billing/PatientBillPrint';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { PaymentModal } from '@/components/billing/PaymentModal';
import { Checkbox } from '@/components/ui/checkbox';
import billingService, { BillingRecord as APIBillingRecord, MedicineItem as APIMedicine, DiagnosticItem as APIDiagnostic } from '@/services/billingService';
import { admissionService } from '@/services/admissionService';
import axios from 'axios';

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
  paymentStatus?: 'Paid' | 'Pending' | 'Partial';
  payments?: Array<{ id?: number; or_number: string; amount: number | string }>;
}

const Billing = () => {
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
  const [loadingCharges, setLoadingCharges] = useState(false);

  // Track data fetch status
  const [pharmacyDataFetched, setPharmacyDataFetched] = useState(false);
  const [laboratoryDataFetched, setLaboratoryDataFetched] = useState(false);
  const [pharmacyFetchTime, setPharmacyFetchTime] = useState<string | null>(null);
  const [laboratoryFetchTime, setLaboratoryFetchTime] = useState<string | null>(null);
  const [pharmacyItemCount, setPharmacyItemCount] = useState(0);
  const [laboratoryItemCount, setLaboratoryItemCount] = useState(0);

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
        adm.status === 'Active' || adm.status === 'active'
      );
      setAdmittedPatients(activeAdmissions);
    } catch (err) {
      console.error('Error fetching admitted patients:', err);
    }
  };

  // Fetch pharmacy dispensed items for a patient/admission
  const fetchPharmacyCharges = async (admissionId: number) => {
    try {
      const API_BASE =
        import.meta.env.BACKEND_PHARMACY_8000 ||
        (import.meta.env.LOCAL_8000 ? `${import.meta.env.LOCAL_8000}/api/pharmacy` : import.meta.env.BACKEND_PHARMACY);
      const response = await axios.get(`${API_BASE}/medication-requests/?admission=${admissionId}&status=dispensed`);

      const pharmacyItems: MedicineItem[] = response.data.map((item: any, index: number) => ({
        id: Date.now() + index,
        name: item.medication_name || item.item_name,
        dosage: item.dosage || item.strength || 'N/A',
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.unit_price || item.price || '0')
      }));

      return pharmacyItems;
    } catch (err) {
      console.error('Error fetching pharmacy charges:', err);
      return [];
    }
  };

  // Fetch laboratory completed tests for a patient/admission
  const fetchLaboratoryCharges = async (admissionId: number) => {
    try {
      const API_BASE =
        import.meta.env.BACKEND_LABORATORY_8000 ||
        (import.meta.env.LOCAL_8000 ? `${import.meta.env.LOCAL_8000}/api/laboratory` : import.meta.env.BACKEND_LABORATORY);
      const response = await axios.get(`${API_BASE}/requests/?admission=${admissionId}&status=completed`);

      const labItems: DiagnosticItem[] = response.data.results ?
        response.data.results.map((item: any, index: number) => ({
          id: Date.now() + index + 1000,
          name: item.test_type || item.test_name || 'Lab Test',
          cost: parseFloat(item.cost || item.price || '0')
        })) :
        response.data.map((item: any, index: number) => ({
          id: Date.now() + index + 1000,
          name: item.test_type || item.test_name || 'Lab Test',
          cost: parseFloat(item.cost || item.price || '0')
        }));

      return labItems;
    } catch (err) {
      console.error('Error fetching laboratory charges:', err);
      return [];
    }
  };

  // Convert API response to local format
  const convertAPIToLocal = (api: APIBillingRecord): BillingRecord => {
    return {
      id: api.id!,
      patientId: api.patient || 0,
      isFinalized: api.is_finalized,
      finalizedDate: api.finalized_date || undefined,
      patientName: api.patient_name,
      hospitalId: api.hospital_id,
      admissionDate: api.admission_date,
      dischargeDate: api.discharge_date,
      roomWard: api.room_ward,
      roomType: api.room_type,
      numberOfDays: api.number_of_days,
      ratePerDay: Number(api.rate_per_day),
      attendingPhysicianFee: Number(api.attending_physician_fee),
      specialistFee: Number(api.specialist_fee),
      surgeonFee: Number(api.surgeon_fee),
      otherProfessionalFees: Number(api.other_professional_fees),
      medicines: api.medicines.map(m => ({
        id: m.id!,
        name: m.name,
        dosage: m.dosage,
        quantity: m.quantity,
        unitPrice: Number(m.unit_price)
      })),
      dietType: api.diet_type,
      mealsPerDay: api.meals_per_day,
      dietDuration: api.diet_duration,
      costPerMeal: Number(api.cost_per_meal),
      diagnostics: api.diagnostics.map(d => ({
        id: d.id!,
        name: d.name,
        cost: Number(d.cost)
      })),
      suppliesCharge: Number(api.supplies_charge),
      procedureCharge: Number(api.procedure_charge),
      nursingCharge: Number(api.nursing_charge),
      miscellaneousCharge: Number(api.miscellaneous_charge),
      discount: Number(api.discount),
      philhealthCoverage: Number(api.philhealth_coverage),
      paymentStatus: api.payment_status,
      payments: api.payments
    };
  };

  // Convert local format to API format
  const convertLocalToAPI = (local: Partial<BillingRecord>): Partial<APIBillingRecord> => {
    // Helper function to format date as YYYY-MM-DD
    const formatDate = (dateStr: string | undefined): string => {
      if (!dateStr) return '';

      // If already in correct format (YYYY-MM-DD), return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // Otherwise, parse and format
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      patient: local.patientId,
      patient_name: local.patientName || '',
      hospital_id: local.hospitalId || '',
      admission_date: formatDate(local.admissionDate),
      discharge_date: formatDate(local.dischargeDate),
      room_ward: local.roomWard || '',
      room_type: local.roomType || '',
      number_of_days: local.numberOfDays || 0,
      rate_per_day: (local.ratePerDay || 0).toString(),
      attending_physician_fee: (local.attendingPhysicianFee || 0).toString(),
      specialist_fee: (local.specialistFee || 0).toString(),
      surgeon_fee: (local.surgeonFee || 0).toString(),
      other_professional_fees: (local.otherProfessionalFees || 0).toString(),
      diet_type: local.dietType || '',
      meals_per_day: local.mealsPerDay || 0,
      diet_duration: local.dietDuration || 0,
      cost_per_meal: (local.costPerMeal || 0).toString(),
      supplies_charge: (local.suppliesCharge || 0).toString(),
      procedure_charge: (local.procedureCharge || 0).toString(),
      nursing_charge: (local.nursingCharge || 0).toString(),
      miscellaneous_charge: (local.miscellaneousCharge || 0).toString(),
      discount: (local.discount || 0).toString(),
      philhealth_coverage: (local.philhealthCoverage || 0).toString(),
      is_senior: isSenior,
      is_pwd: isPWD,
      is_philhealth_member: isPhilHealthMember,
      medicines: local.medicines?.map(m => ({
        name: m.name,
        dosage: m.dosage,
        quantity: m.quantity,
        unit_price: m.unitPrice.toString()
      })) || [],
      diagnostics: local.diagnostics?.map(d => ({
        name: d.name,
        cost: d.cost.toString()
      })) || []
    };
  };

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

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView('billing');

    const existing = billingRecords.find(b => b.patientId === patient.id);
    if (existing) {
      // Load Existing billing record
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
      // New Bill - populate from patient/admission data and fetch charges
      resetBillingForm();

      // Auto-fetch charges from other modules
      setLoadingCharges(true);
      try {
        // Find the admission record to get admission ID and full patient details
        const admission = admittedPatients.find((adm: any) =>
          parseInt(adm.patient) === patient.id ||
          adm.id === patient.id
        );

        if (admission) {
          // Populate patient information from admission
          const patientDetails = admission.patient_details;

          // Use patient_id instead of numeric id
          setHospitalId(patientDetails?.patient_id || patient.id.toString());
          setPatientName(patient.patientName);
          setAdmissionDate(admission.admission_date);
          setDischargeDate(admission.discharge_date || '');
          setRoomWard(`${admission.ward || ''} ${admission.room || ''} ${admission.bed || ''}`.trim());

          // Calculate days between admission and today (or discharge date if available)
          const endDate = admission.discharge_date ? new Date(admission.discharge_date) : new Date();
          const days = Math.ceil((endDate.getTime() - new Date(admission.admission_date).getTime()) / (1000 * 3600 * 24));
          setNumberOfDays(days > 0 ? days : 1);

          // Auto-detect PhilHealth membership from patient records
          if (patientDetails?.philhealth_id && patientDetails.philhealth_id.trim() !== '') {
            setIsPhilHealthMember(true);
            // Set default PhilHealth coverage (can be adjusted manually)
            setPhilhealthCoverage(15000); // Default coverage amount
          }

          // Fetch charges from Pharmacy and Laboratory modules
          const [pharmacyItems, labItems] = await Promise.all([
            fetchPharmacyCharges(admission.id),
            fetchLaboratoryCharges(admission.id)
          ]);

          if (pharmacyItems.length > 0) {
            setMedicines(pharmacyItems);
            setPharmacyDataFetched(true);
            setPharmacyFetchTime(new Date().toLocaleTimeString());
            setPharmacyItemCount(pharmacyItems.length);
          }

          if (labItems.length > 0) {
            setDiagnostics(labItems);
            setLaboratoryDataFetched(true);
            setLaboratoryFetchTime(new Date().toLocaleTimeString());
            setLaboratoryItemCount(labItems.length);
          }

          // Set default room rate based on ward type
          if (admission.ward || admission.room) {
            const ward = (admission.ward || admission.room || '').toLowerCase();
            if (ward.includes('private')) {
              setRoomType('Private');
              setRatePerDay(3000);
            } else if (ward.includes('semi')) {
              setRoomType('Semi-Private');
              setRatePerDay(2000);
            } else {
              setRoomType('Ward');
              setRatePerDay(1500);
            }
          }

          // Set attending physician fee if available
          if (admission.attending_physician && admission.attending_physician.trim() !== '') {
            setAttendingPhysicianFee(5000); // Default physician fee
          }

          // Set default dietary charges based on admission duration
          setDietType('Regular');
          setMealsPerDay(3);
          setDietDuration(days > 0 ? days : 1);
          setCostPerMeal(150); // Default meal cost
        }
      } catch (err) {
        console.error('Error loading charges:', err);
      } finally {
        setLoadingCharges(false);
      }
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

    // Reset fetch indicators
    setPharmacyDataFetched(false);
    setLaboratoryDataFetched(false);
    setPharmacyFetchTime(null);
    setLaboratoryFetchTime(null);
    setPharmacyItemCount(0);
    setLaboratoryItemCount(0);
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

  const handleSaveBill = async () => {
    if (!selectedPatient) return;

    // Validation
    if (!patientName || !hospitalId || !admissionDate) {
      alert('Please fill in all required patient information fields.');
      return;
    }

    if (!dischargeDate) {
      alert('Discharge date is required. Please enter the patient discharge date.');
      return;
    }

    if (!roomType) {
      alert('Please select a room type.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const record: Partial<BillingRecord> = {
        patientId: selectedPatient.id,
        patientName, hospitalId, admissionDate, dischargeDate, roomWard,
        roomType, numberOfDays, ratePerDay,
        attendingPhysicianFee, specialistFee, surgeonFee, otherProfessionalFees,
        medicines, dietType, mealsPerDay, dietDuration, costPerMeal,
        diagnostics, suppliesCharge, procedureCharge, nursingCharge, miscellaneousCharge,
        discount, philhealthCoverage
      };

      const apiData = convertLocalToAPI(record);

      if (existingBilling) {
        // Update existing billing record
        const updated = await billingService.update(existingBilling.id, apiData);
        const localRecord = convertAPIToLocal(updated);
        setBillingRecords(prev => prev.map(b => b.id === existingBilling.id ? localRecord : b));
        alert('✓ Billing record updated and finalized successfully.');
      } else {
        // Create new billing record
        const created = await billingService.create(apiData);
        const localRecord = convertAPIToLocal(created);
        setBillingRecords(prev => [...prev, localRecord]);
        alert('✓ Billing record created and finalized successfully.');
      }

      // Refresh dashboard data
      await fetchBillingData();
    } catch (err: any) {
      console.error('Error saving billing record:', err);

      // Extract detailed error message
      let errorMessage = 'Failed to save billing record. ';
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorDetails = Object.entries(errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          errorMessage += errorDetails;
        } else {
          errorMessage += errors;
        }
      } else if (err.message) {
        errorMessage += err.message;
      }

      setError(errorMessage);
      alert('❌ Error: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
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
    // Use dashboard data from API
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
        {isLoading && (
          <Alert>
            <AlertDescription>Loading billing data...</AlertDescription>
          </Alert>
        )}

        {/* Patient Selection Card - For Creating New Bills */}
        {!showPatientSelector ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Billing Management</CardTitle>
                <Button
                  onClick={() => setShowPatientSelector(true)}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Create New Bill
                </Button>
              </div>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Select Patient for Billing</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowPatientSelector(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {admittedPatients.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No admitted patients found. Patients must be admitted first before creating a bill.
                    </AlertDescription>
                  </Alert>
                ) : (
                  admittedPatients.map((admission: any) => {
                    const patientName = admission.patient_name ||
                      `${admission.patient_details?.first_name || ''} ${admission.patient_details?.last_name || ''}`.trim() ||
                      'Unknown Patient';

                    const alreadyBilled = billingRecords.some(b =>
                      b.hospitalId === admission.admission_id ||
                      b.patientId === admission.patient_id
                    );

                    return (
                      <div
                        key={admission.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${alreadyBilled
                          ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                          : 'hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
                          }`}
                        onClick={() => {
                          if (!alreadyBilled) {
                            // Calculate age from date_of_birth if available
                            let age = 0;
                            if (admission.patient_details?.date_of_birth) {
                              const birthDate = new Date(admission.patient_details.date_of_birth);
                              const today = new Date();
                              age = today.getFullYear() - birthDate.getFullYear();
                              const monthDiff = today.getMonth() - birthDate.getMonth();
                              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                age--;
                              }
                            }

                            const patient: Patient = {
                              id: parseInt(admission.patient) || admission.id,
                              patientName: patientName,
                              room: admission.room || admission.ward || admission.bed || 'N/A',
                              admissionDate: admission.admission_date,
                              dischargeDate: admission.discharge_date,
                              condition: admission.admitting_diagnosis || admission.diagnosis || '',
                              physician: admission.attending_physician || '',
                              department: admission.department || '',
                              age: age,
                              status: 'ready'
                            };
                            handlePatientSelect(patient);
                            setShowPatientSelector(false);
                          }
                        }}
                      >
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {patientName}
                            {alreadyBilled && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Billed
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Admission: {admission.admission_id} • Room: {admission.room || admission.ward || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Admitted: {new Date(admission.admission_date).toLocaleDateString()} •
                            Diagnosis: {admission.admitting_diagnosis || admission.diagnosis || 'N/A'}
                          </p>
                        </div>
                        <Badge variant={alreadyBilled ? 'outline' : 'secondary'}>
                          {alreadyBilled ? 'View Bill' : 'Create Bill'}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <BillingDashboard
          patients={dashboardPatients}
          onSelectPatient={(id) => {
            // Load the billing record by ID
            const billing = billingRecords.find(b => b.id === id);
            if (billing) {
              // Create a patient object from billing data
              const patient: Patient = {
                id: billing.patientId,
                patientName: billing.patientName,
                room: billing.roomWard,
                admissionDate: billing.admissionDate,
                dischargeDate: billing.dischargeDate,
                condition: '',
                physician: '',
                department: '',
                age: 0,
                status: 'ready'
              };
              handlePatientSelect(patient);
            }
          }}
          onQuickPay={(p) => {
            // Find billing record by ID from dashboard
            const billing = billingRecords.find(b => b.id === p.id);
            if (billing) {
              const patient: Patient = {
                id: billing.patientId,
                patientName: billing.patientName,
                room: billing.roomWard,
                admissionDate: billing.admissionDate,
                dischargeDate: billing.dischargeDate,
                condition: '',
                physician: '',
                department: '',
                age: 0,
                status: 'ready'
              };
              handleQuickPay(patient);
            }
          }}
        />
      </div>
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>Processing...</AlertDescription>
        </Alert>
      )}

      {loadingCharges && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <AlertTitle className="text-blue-900">Fetching Charges</AlertTitle>
          <AlertDescription className="text-blue-700">
            Loading pharmacy medications and laboratory tests from hospital modules...
          </AlertDescription>
        </Alert>
      )}

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
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Information automatically populated from Admission records</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Patient Name</Label><Input value={patientName} disabled className="bg-gray-50" /></div>
          <div><Label>Patient ID</Label><Input value={hospitalId} disabled className="bg-gray-50" /></div>
          <div><Label>Admission Date</Label><Input type="date" value={admissionDate} disabled className="bg-gray-50" /></div>
          <div>
            <Label>Discharge Date <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={dischargeDate}
              onChange={e => setDischargeDate(e.target.value)}
              disabled={isFinalized}
              required
            />
          </div>
          <div className="md:col-span-2"><Label>Room/Ward/Bed</Label><Input value={roomWard} disabled className="bg-gray-50" /></div>
        </CardContent>
      </Card>

      {/* Room Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Room Charges</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Days automatically calculated from admission dates</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Room Type <span className="text-red-500">*</span></Label>
            <Select value={roomType} onValueChange={setRoomType} disabled={isFinalized}>
              <SelectTrigger><SelectValue placeholder="Select room type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                <SelectItem value="Ward">Ward</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Days</Label><Input type="number" value={numberOfDays} disabled className="bg-gray-50" /></div>
          <div><Label>Rate/Day</Label><Input type="number" value={ratePerDay} onChange={e => setRatePerDay(Number(e.target.value))} disabled={isFinalized} /></div>
          <div><Label>Total</Label><Input value={`₱${totalRoomCharge.toFixed(2)}`} disabled className="font-semibold" /></div>
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
          <CardTitle className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>Medicines</span>
                {pharmacyDataFetched && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {pharmacyItemCount} items loaded
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1 font-normal">
                Automatically loaded from Pharmacy module (dispensed medications)
                {pharmacyFetchTime && (
                  <span className="ml-2 text-xs text-blue-600">• Last fetched: {pharmacyFetchTime}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {!isFinalized && selectedPatient && (
                <Button
                  size="sm"
                  variant={pharmacyDataFetched ? "outline" : "default"}
                  onClick={async () => {
                    setLoadingCharges(true);
                    try {
                      const admission = admittedPatients.find((adm: any) =>
                        parseInt(adm.patient) === selectedPatient.id || adm.id === selectedPatient.id
                      );
                      if (admission) {
                        const items = await fetchPharmacyCharges(admission.id);
                        setMedicines(items);
                        setPharmacyDataFetched(true);
                        setPharmacyFetchTime(new Date().toLocaleTimeString());
                        setPharmacyItemCount(items.length);

                        if (items.length > 0) {
                          alert(`✓ Loaded ${items.length} medicine items from Pharmacy`);
                        } else {
                          alert('No dispensed medicines found in Pharmacy module');
                        }
                      }
                    } catch (err) {
                      alert('Failed to load pharmacy charges');
                    } finally {
                      setLoadingCharges(false);
                    }
                  }}
                  disabled={loadingCharges}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingCharges ? 'animate-spin' : ''}`} />
                  {pharmacyDataFetched ? 'Refresh Pharmacy' : 'Load from Pharmacy'}
                </Button>
              )}
              {!isFinalized && <Button size="sm" onClick={addMedicine}><Plus className="w-4 h-4 mr-2" />Add</Button>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicines.length === 0 && !isFinalized && (
            <Alert className="border-gray-200 bg-gray-50">
              <AlertDescription className="text-gray-600">
                No medicines added yet. Click "Load from Pharmacy" to fetch dispensed medications or "Add" to enter manually.
              </AlertDescription>
            </Alert>
          )}
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
          <CardTitle className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>Diagnostics / Laboratory</span>
                {laboratoryDataFetched && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {laboratoryItemCount} tests loaded
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1 font-normal">
                Automatically loaded from Laboratory module (completed tests)
                {laboratoryFetchTime && (
                  <span className="ml-2 text-xs text-blue-600">• Last fetched: {laboratoryFetchTime}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {!isFinalized && selectedPatient && (
                <Button
                  size="sm"
                  variant={laboratoryDataFetched ? "outline" : "default"}
                  onClick={async () => {
                    setLoadingCharges(true);
                    try {
                      const admission = admittedPatients.find((adm: any) =>
                        parseInt(adm.patient) === selectedPatient.id || adm.id === selectedPatient.id
                      );
                      if (admission) {
                        const items = await fetchLaboratoryCharges(admission.id);
                        setDiagnostics(items);
                        setLaboratoryDataFetched(true);
                        setLaboratoryFetchTime(new Date().toLocaleTimeString());
                        setLaboratoryItemCount(items.length);

                        if (items.length > 0) {
                          alert(`✓ Loaded ${items.length} lab tests from Laboratory`);
                        } else {
                          alert('No completed lab tests found in Laboratory module');
                        }
                      }
                    } catch (err) {
                      alert('Failed to load laboratory charges');
                    } finally {
                      setLoadingCharges(false);
                    }
                  }}
                  disabled={loadingCharges}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingCharges ? 'animate-spin' : ''}`} />
                  {laboratoryDataFetched ? 'Refresh Laboratory' : 'Load from Laboratory'}
                </Button>
              )}
              {!isFinalized && <Button size="sm" onClick={addDiagnostic}><Plus className="w-4 h-4 mr-2" />Add</Button>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnostics.length === 0 && !isFinalized && (
            <Alert className="border-gray-200 bg-gray-50">
              <AlertDescription className="text-gray-600">
                No diagnostic tests added yet. Click "Load from Laboratory" to fetch completed tests or "Add" to enter manually.
              </AlertDescription>
            </Alert>
          )}
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrintBill}
              disabled={!isFinalized && existingBilling?.paymentStatus !== 'Paid'}
            >
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
        onPaymentSuccess={async (data) => {
          if (!existingBilling) {
            alert('Please save the billing record first before adding payment.');
            return;
          }

          setIsLoading(true);
          try {
            // Ensure date is in YYYY-MM-DD format, not ISO datetime
            const paymentDate = data.date.split('T')[0];

            const response = await billingService.addPayment(existingBilling.id, {
              amount: data.amount,
              payment_method: data.method,
              cashier: data.cashier,
              payment_date: paymentDate
            });

            // Extract the OR number from the created payment (in the updated billing record)
            const payments = response.payments || [];
            const latestPayment = payments[payments.length - 1];
            const orNumber = latestPayment?.or_number || 'Unknown';

            alert(`Payment Processed! OR Number: ${orNumber}`);
            // Refresh billing data to get updated balance
            await fetchBillingData();
            setIsPaymentModalOpen(false);
          } catch (err: any) {
            console.error('Error processing payment:', err);
            const errorMessage = err?.response?.data?.error || err?.response?.data?.detail || err?.message || 'Failed to process payment. Please try again.';
            alert(`Payment Error: ${errorMessage}`);
          } finally {
            setIsLoading(false);
          }
        }}
      />
    </div>
  );
};

export default Billing;
