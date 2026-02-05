import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Receipt, Plus, Trash2, CheckCircle, Lock, FileText, Printer, Save, RefreshCw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { DiscountCheckboxGroup, DiscountType } from './DiscountCheckboxGroup';
import { Patient, BillingRecord, MedicineItem, DiagnosticItem } from './types';
import billingService, { BillingRecord as APIBillingRecord } from '@/services/billingService';
import { fetchPharmacyCharges, fetchLaboratoryCharges, convertAPIToLocal, convertLocalToAPI } from './utils';

interface BillingFormProps {
    patient: Patient;
    billingRecords: BillingRecord[];
    onSaveSuccess: () => void;
    onCancel: () => void;
    onPrint: () => void;
}

export const BillingForm: React.FC<BillingFormProps> = ({
    patient,
    billingRecords,
    onSaveSuccess,
    onCancel,
    onPrint
}) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingCharges, setLoadingCharges] = useState(false);

    // Track data fetch status
    const [pharmacyDataFetched, setPharmacyDataFetched] = useState(false);
    const [laboratoryDataFetched, setLaboratoryDataFetched] = useState(false);
    const [pharmacyFetchTime, setPharmacyFetchTime] = useState<string | null>(null);
    const [laboratoryFetchTime, setLaboratoryFetchTime] = useState<string | null>(null);
    const [pharmacyItemCount, setPharmacyItemCount] = useState(0);
    const [laboratoryItemCount, setLaboratoryItemCount] = useState(0);

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

    const [selectedDiscount, setSelectedDiscount] = useState<DiscountType>(null);

    // Derived values for backward compatibility
    const isSenior = selectedDiscount === 'senior';
    const isPWD = selectedDiscount === 'pwd';
    const isPhilHealthMember = selectedDiscount === 'philhealth';

    // Calculation derived state
    const totalRoomCharge = numberOfDays * ratePerDay;
    const totalProfessionalFees = attendingPhysicianFee + specialistFee + surgeonFee + otherProfessionalFees;
    const totalMedicineCharge = medicines.reduce((total, med) => total + (med.quantity * med.unitPrice), 0);
    const totalDietaryCharge = mealsPerDay * dietDuration * costPerMeal;
    const totalDiagnosticsCharge = diagnostics.reduce((total, diag) => total + diag.cost, 0);

    const subtotal = totalRoomCharge + totalProfessionalFees + totalMedicineCharge +
        totalDietaryCharge + totalDiagnosticsCharge + suppliesCharge +
        procedureCharge + nursingCharge + miscellaneousCharge;

    const outOfPocketTotal = subtotal - discount - philhealthCoverage;

    const existingBilling = billingRecords.find(b => b.patientId === patient.id);
    const isFinalized = existingBilling?.isFinalized || false;

    // State for Edit Mode
    const [isEditing, setIsEditing] = useState(!existingBilling);

    // Initialize Edit Mode based on existingBilling
    useEffect(() => {
        setIsEditing(!existingBilling);
    }, [existingBilling?.id]); // Only re-run if ID changes (loading new bill vs existing)

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
        setSelectedDiscount(null);

        setPharmacyDataFetched(false);
        setLaboratoryDataFetched(false);
        setPharmacyFetchTime(null);
        setLaboratoryFetchTime(null);
        setPharmacyItemCount(0);
        setLaboratoryItemCount(0);
    };

    // Load data when patient changes
    useEffect(() => {
        const loadPatientData = async () => {
            if (existingBilling) {
                // Load existing
                setPatientName(existingBilling.patientName);
                setHospitalId(existingBilling.hospitalId);
                setAdmissionDate(existingBilling.admissionDate);
                setDischargeDate(existingBilling.dischargeDate);
                setRoomWard(existingBilling.roomWard);
                setRoomType(existingBilling.roomType);
                setNumberOfDays(existingBilling.numberOfDays);
                setRatePerDay(existingBilling.ratePerDay);
                setAttendingPhysicianFee(existingBilling.attendingPhysicianFee);
                setSpecialistFee(existingBilling.specialistFee);
                setSurgeonFee(existingBilling.surgeonFee);
                setOtherProfessionalFees(existingBilling.otherProfessionalFees);
                setMedicines(existingBilling.medicines);
                setDietType(existingBilling.dietType);
                setMealsPerDay(existingBilling.mealsPerDay);
                setDietDuration(existingBilling.dietDuration);
                setCostPerMeal(existingBilling.costPerMeal);
                setDiagnostics(existingBilling.diagnostics);
                setSuppliesCharge(existingBilling.suppliesCharge);
                setProcedureCharge(existingBilling.procedureCharge);
                setNursingCharge(existingBilling.nursingCharge);
                setMiscellaneousCharge(existingBilling.miscellaneousCharge);
                setDiscount(existingBilling.discount);
                setPhilhealthCoverage(existingBilling.philhealthCoverage);
            } else {
                // Initialize new
                resetBillingForm();
                setLoadingCharges(true);

                // Default fields from patient prop
                setHospitalId(patient.id.toString());
                setPatientName(patient.patientName);
                setAdmissionDate(patient.admissionDate);
                setDischargeDate(patient.dischargeDate || '');
                setRoomWard(patient.room);

                // Calculate days
                const startDate = new Date(patient.admissionDate);
                const endDate = patient.dischargeDate ? new Date(patient.dischargeDate) : new Date();
                if (!isNaN(startDate.getTime())) {
                    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
                    setNumberOfDays(days > 0 ? days : 1);
                }

                // Default Fees & Room
                // We'd need more logic here if we want to infer Room Type from the string "room"
                // For now, implementing basic defaults
                if (patient.room.toLowerCase().includes('private')) {
                    setRoomType('Private');
                    setRatePerDay(3000);
                } else if (patient.room.toLowerCase().includes('semi')) {
                    setRoomType('Semi-Private');
                    setRatePerDay(2000);
                } else {
                    setRoomType('Ward');
                    setRatePerDay(1500);
                }
                
                // Fetch external charges
                try {
                    const [pharmacyItems, labItems] = await Promise.all([
                        fetchPharmacyCharges(patient.id),
                        fetchLaboratoryCharges(patient.id)
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

                    // Diet defaults
                    setDietType('Regular');
                    setMealsPerDay(3);
                    setDietDuration(numberOfDays || 1);
                    setCostPerMeal(150);

                } catch (err) {
                    console.error("Error loading external charges", err);
                } finally {
                    setLoadingCharges(false);
                }
            }
        };

        loadPatientData();
    }, [patient, existingBilling]);

    // Discount auto-calculation
    useEffect(() => {
        let newDiscount = 0;
        const vatableAmount = totalRoomCharge + totalProfessionalFees + totalMedicineCharge + totalDiagnosticsCharge;

        if (selectedDiscount === 'senior' || selectedDiscount === 'pwd') {
            newDiscount = vatableAmount * 0.20;
        }
        setDiscount(newDiscount);
    }, [selectedDiscount, totalRoomCharge, totalProfessionalFees, totalMedicineCharge, totalDiagnosticsCharge]);


    const handleSaveBill = async () => {
        if (!patient.id || patient.id === 0) {
             toast({
                variant: 'destructive',
                title: 'Data Error',
                description: 'Invalid Patient ID. Cannot proceed with billing. Please select a patient with valid data.',
            });
            return;
        }

        if (!patientName || !hospitalId || !admissionDate) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fill in all required patient information fields.',
            });
            return;
        }

        if (!dischargeDate) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Discharge date is required. Please enter the patient discharge date.',
            });
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const record: Partial<BillingRecord> = {
                patientId: patient.id,
                patientName, hospitalId, admissionDate, dischargeDate, roomWard,
                roomType, numberOfDays, ratePerDay,
                attendingPhysicianFee, specialistFee, surgeonFee, otherProfessionalFees,
                medicines, dietType, mealsPerDay, dietDuration, costPerMeal,
                diagnostics, suppliesCharge, procedureCharge, nursingCharge, miscellaneousCharge,
                discount, philhealthCoverage
            };

            const apiData = convertLocalToAPI(record, selectedDiscount);

            if (existingBilling) {
                const updated = await billingService.update(existingBilling.id, apiData);
                const localRecord = convertAPIToLocal(updated);
                toast({ title: 'Success', description: 'Billing record updated.' });
                // If we're editing, we might want to exit edit mode or just notify
                setIsEditing(false);
                onSaveSuccess();
            } else {
                const created = await billingService.create(apiData);
                const localRecord = convertAPIToLocal(created);
                toast({ title: 'Success', description: 'Billing record created.' });
                onSaveSuccess();
            }
        } catch (err: any) {
            console.error('Error saving billing record:', err);
            let errorMessage = 'Failed to save billing record.';
             if (err.response?.data) {
                const errors = err.response.data;
                if (typeof errors === 'object') {
                  errorMessage += " " + Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(', ');
                } else {
                  errorMessage += " " + errors;
                }
             }
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const addMedicine = () => setMedicines([...medicines, { id: Date.now(), name: '', dosage: '', quantity: 0, unitPrice: 0 }]);
    const removeMedicine = (id: number) => setMedicines(medicines.filter(m => m.id !== id));
    const updateMedicine = (id: number, field: keyof MedicineItem, value: any) => {
        setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const addDiagnostic = () => setDiagnostics([...diagnostics, { id: Date.now(), name: '', cost: 0 }]);
    const removeDiagnostic = (id: number) => setDiagnostics(diagnostics.filter(d => d.id !== id));
    const updateDiagnostic = (id: number, field: keyof DiagnosticItem, value: any) => {
        setDiagnostics(diagnostics.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 sticky top-0 z-10">
                <div>
                   <div className="flex items-center gap-3">
                       <h2 className="text-2xl font-bold flex items-center gap-2">
                           <Receipt className="w-6 h-6 text-primary" />
                           Patient Billing Statement
                       </h2>
                       {existingBilling?.paymentStatus && (
                           <Badge className={
                               existingBilling.paymentStatus === 'Paid' ? 'bg-green-600' : 
                               existingBilling.paymentStatus === 'Partial' ? 'bg-yellow-600' : 'bg-gray-500'
                           }>
                               {existingBilling.paymentStatus}
                           </Badge>
                       )}
                   </div>
                    <p className="text-gray-500">
                        {existingBilling ? `View Bill #${existingBilling.id}` : 'Creating New Bill'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    {existingBilling && !isEditing && (
                         <Button 
                            variant="secondary" 
                            onClick={() => setIsEditing(true)}
                            disabled={existingBilling.paymentStatus === 'Paid'}
                         >
                            <FileText className="w-4 h-4 mr-2" />
                            Edit Bill
                        </Button>
                    )}
                    <Button variant="outline" onClick={onPrint} disabled={!isFinalized}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print Bill
                    </Button>
                    {isEditing && (
                        <Button onClick={handleSaveBill} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                            <Save className="w-4 h-4 mr-2" />
                            {isLoading ? 'Saving...' : (existingBilling ? 'Update Bill' : 'Save & Finalize')}
                        </Button>
                    )}
                </div>
            </div>

            {loadingCharges && (
                 <Alert className="bg-blue-50 border-blue-200">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <AlertTitle>Fetching Charges</AlertTitle>
                    <AlertDescription>
                        Retrieving pharmacy and laboratory records...
                    </AlertDescription>
                 </Alert>
            )}

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Left Column: Patient Info & Professional Fees */}
                 <div className="space-y-6">
                      <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Patient Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="patientName">Patient Name</Label>
                                <Input id="patientName" value={patientName} onChange={e => setPatientName(e.target.value)} disabled={!isEditing} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="hospitalId">Hospital ID</Label>
                                    <Input id="hospitalId" value={hospitalId} onChange={e => setHospitalId(e.target.value)} disabled={!isEditing} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="roomWard">Room/Ward</Label>
                                    <Input id="roomWard" value={roomWard} onChange={e => setRoomWard(e.target.value)} disabled={!isEditing} />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="admissionDate">Admission Date</Label>
                                    <Input id="admissionDate" type="date" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} disabled={!isEditing} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dischargeDate">Discharge Date</Label>
                                    <Input id="dischargeDate" type="date" value={dischargeDate} onChange={e => setDischargeDate(e.target.value)} disabled={!isEditing} />
                                </div>
                             </div>
                        </CardContent>
                      </Card>

                      <Card>
                          <CardHeader>
                              <CardTitle className="text-lg">Room Charges</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                      <Label>Room Type</Label>
                                      <Select value={roomType} onValueChange={setRoomType} disabled={!isEditing}>
                                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="Ward">Ward</SelectItem>
                                              <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                                              <SelectItem value="Private">Private</SelectItem>
                                              <SelectItem value="Suite">Suite</SelectItem>
                                          </SelectContent>
                                      </Select>
                                  </div>
                                  <div className="grid gap-2">
                                      <Label>No. of Days</Label>
                                      <Input type="number" value={numberOfDays} onChange={e => setNumberOfDays(Number(e.target.value))} disabled={!isEditing} />
                                  </div>
                                  <div className="grid gap-2">
                                      <Label>Rate per Day</Label>
                                      <Input type="number" value={ratePerDay} onChange={e => setRatePerDay(Number(e.target.value))} disabled={!isEditing} />
                                  </div>
                                  <div className="grid gap-2">
                                      <Label>Total</Label>
                                      <div className="p-2 bg-gray-100 rounded text-right font-medium">
                                          PHP {totalRoomCharge.toFixed(2)}
                                      </div>
                                  </div>
                              </div>
                          </CardContent>
                      </Card>

                      <Card>
                          <CardHeader><CardTitle className="text-lg">Professional Fees</CardTitle></CardHeader>
                          <CardContent className="space-y-4">
                               <div className="grid gap-2">
                                   <Label>Attending Physician</Label>
                                   <Input type="number" value={attendingPhysicianFee} onChange={e => setAttendingPhysicianFee(Number(e.target.value))} disabled={!isEditing} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Specialist</Label>
                                   <Input type="number" value={specialistFee} onChange={e => setSpecialistFee(Number(e.target.value))} disabled={!isEditing} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Surgeon</Label>
                                   <Input type="number" value={surgeonFee} onChange={e => setSurgeonFee(Number(e.target.value))} disabled={!isEditing} />
                               </div>
                               <div className="grid gap-2">
                                   <Label>Other Fees</Label>
                                   <Input type="number" value={otherProfessionalFees} onChange={e => setOtherProfessionalFees(Number(e.target.value))} disabled={!isEditing} />
                               </div>
                               <div className="pt-2 border-t flex justify-between font-medium">
                                   <span>Total PF:</span>
                                   <span>PHP {totalProfessionalFees.toFixed(2)}</span>
                               </div>
                          </CardContent>
                      </Card>
                 </div>

                 {/* Middle Column: Medicines & Diagnostics */}
                 <div className="space-y-6">
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-lg">Medicines</CardTitle>
                              {isEditing && <Button variant="ghost" size="sm" onClick={addMedicine}><Plus className="w-4 h-4" /></Button>}
                          </CardHeader>
                          <CardContent className="space-y-4">
                              {pharmacyDataFetched && (
                                  <Alert className="mb-2 bg-green-50 text-green-800 border-green-200">
                                      <CheckCircle className="h-4 w-4" />
                                      <AlertDescription>
                                          Imported {pharmacyItemCount} items from Pharmacy
                                      </AlertDescription>
                                  </Alert>
                              )}
                              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                  {medicines.map((med) => (
                                      <div key={med.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                                          <div className="col-span-12 md:col-span-4">
                                              <Input placeholder="Name" value={med.name} onChange={e => updateMedicine(med.id, 'name', e.target.value)} className="h-8 text-sm" disabled={!isEditing} />
                                          </div>
                                          <div className="col-span-6 md:col-span-3">
                                              <Input type="number" placeholder="Qty" value={med.quantity} onChange={e => updateMedicine(med.id, 'quantity', Number(e.target.value))} className="h-8 text-sm" disabled={!isEditing} />
                                          </div>
                                           <div className="col-span-6 md:col-span-3">
                                              <Input type="number" placeholder="Price" value={med.unitPrice} onChange={e => updateMedicine(med.id, 'unitPrice', Number(e.target.value))} className="h-8 text-sm" disabled={!isEditing} />
                                          </div>
                                          <div className="col-span-12 md:col-span-2 flex justify-end">
                                               {isEditing && (
                                                   <Button variant="ghost" size="icon" onClick={() => removeMedicine(med.id)} className="h-8 w-8 text-red-500 hover:text-red-700">
                                                       <Trash2 className="w-4 h-4" />
                                                   </Button>
                                               )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              <div className="text-right font-medium">
                                  Total: PHP {totalMedicineCharge.toFixed(2)}
                              </div>
                          </CardContent>
                      </Card>

                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-lg">Diagnostics / Labs</CardTitle>
                              {isEditing && <Button variant="ghost" size="sm" onClick={addDiagnostic}><Plus className="w-4 h-4" /></Button>}
                          </CardHeader>
                          <CardContent className="space-y-4">
                               {laboratoryDataFetched && (
                                  <Alert className="mb-2 bg-green-50 text-green-800 border-green-200">
                                      <CheckCircle className="h-4 w-4" />
                                      <AlertDescription>
                                          Imported {laboratoryItemCount} items from Lab
                                      </AlertDescription>
                                  </Alert>
                              )}
                              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                  {diagnostics.map((diag) => (
                                      <div key={diag.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                                          <div className="col-span-8">
                                              <Input placeholder="Test Name" value={diag.name} onChange={e => updateDiagnostic(diag.id, 'name', e.target.value)} className="h-8 text-sm" disabled={!isEditing} />
                                          </div>
                                          <div className="col-span-3">
                                              <Input type="number" placeholder="Cost" value={diag.cost} onChange={e => updateDiagnostic(diag.id, 'cost', Number(e.target.value))} className="h-8 text-sm" disabled={!isEditing} />
                                          </div>
                                           <div className="col-span-1 flex justify-end">
                                               {isEditing && (
                                                   <Button variant="ghost" size="icon" onClick={() => removeDiagnostic(diag.id)} className="h-8 w-8 text-red-500">
                                                       <Trash2 className="w-4 h-4" />
                                                   </Button>
                                               )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                               <div className="text-right font-medium">
                                  Total: PHP {totalDiagnosticsCharge.toFixed(2)}
                              </div>
                          </CardContent>
                      </Card>
                 </div>

                 {/* Right Column: Other Charges & Summary */}
                 <div className="space-y-6">
                      <Card>
                          <CardHeader><CardTitle className="text-lg">Other Charges</CardTitle></CardHeader>
                          <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label>Dietary</Label>
                                        <div className="flex gap-2">
                                            <Input placeholder="Type" value={dietType} onChange={e => setDietType(e.target.value)} className="w-1/3" disabled={!isEditing} />
                                            <Input type="number" placeholder="Meals/Day" value={mealsPerDay} onChange={e => setMealsPerDay(Number(e.target.value))} className="w-1/4" disabled={!isEditing} />
                                            <Input type="number" placeholder="Cost" value={costPerMeal} onChange={e => setCostPerMeal(Number(e.target.value))} className="w-1/3" disabled={!isEditing} />
                                        </div>
                                         <div className="text-xs text-right mt-1 text-gray-500">Total: {totalDietaryCharge.toFixed(2)}</div>
                                    </div>
                                     <div className="grid gap-2">
                                        <Label>Supplies</Label>
                                        <Input type="number" value={suppliesCharge} onChange={e => setSuppliesCharge(Number(e.target.value))} disabled={!isEditing} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Procedures</Label>
                                        <Input type="number" value={procedureCharge} onChange={e => setProcedureCharge(Number(e.target.value))} disabled={!isEditing} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Nursing</Label>
                                        <Input type="number" value={nursingCharge} onChange={e => setNursingCharge(Number(e.target.value))} disabled={!isEditing} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Misc</Label>
                                        <Input type="number" value={miscellaneousCharge} onChange={e => setMiscellaneousCharge(Number(e.target.value))} disabled={!isEditing} />
                                    </div>
                                </div>
                          </CardContent>
                      </Card>

                      <Card className="bg-slate-50 border-slate-200">
                          <CardHeader><CardTitle className="text-lg">Summary & Discounts</CardTitle></CardHeader>
                          <CardContent className="space-y-4">
                              <div className={!isEditing ? "opacity-50 pointer-events-none" : ""}>
                                   <DiscountCheckboxGroup selectedDiscount={selectedDiscount} onDiscountChange={setSelectedDiscount} />
                              </div>

                              <div className="space-y-2 pt-4 border-t border-slate-200">
                                   <div className="flex justify-between">
                                       <span>Subtotal</span>
                                       <span>{subtotal.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span>
                                   </div>
                                    <div className="flex justify-between items-center text-red-600">
                                       <span>Discount</span>
                                       <div className="w-32">
                                           <Input type="number" className="h-8 text-right" value={discount} onChange={e => setDiscount(Number(e.target.value))} disabled={!isEditing} />
                                       </div>
                                   </div>
                                    <div className="flex justify-between items-center text-blue-600">
                                       <span>PhilHealth</span>
                                        <div className="w-32">
                                           <Input type="number" className="h-8 text-right" value={philhealthCoverage} onChange={e => setPhilhealthCoverage(Number(e.target.value))} disabled={!isEditing} />
                                       </div>
                                   </div>
                                   <Separator className="my-2" />
                                   <div className="flex justify-between font-bold text-xl">
                                       <span>Total Amount</span>
                                       <span>{Math.max(0, outOfPocketTotal).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span>
                                   </div>
                              </div>
                          </CardContent>
                      </Card>
                 </div>
             </div>
        </div>
    );
};
