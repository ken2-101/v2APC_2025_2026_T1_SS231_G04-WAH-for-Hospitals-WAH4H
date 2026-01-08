import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserX, FileText, CheckCircle, Search, Filter, X, Plus, AlertTriangle, Users, Download } from 'lucide-react';
import { PrintButton } from '@/components/ui/PrintButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { DischargeStatusBadge } from '@/components/discharge/DischargeStatusBadge';
import { PendingItemsSection } from '@/components/discharge/PendingItemsSection';
import { DischargedPatientsReport } from '@/components/discharge/DischargedPatientsReport';
import { dischargeService } from '@/services/dischargeService';

interface DischargeRequirements {
  finalDiagnosis: boolean;
  physicianSignature: boolean;
  medicationReconciliation: boolean;
  dischargeSummary: boolean;
  billingClearance: boolean;
  nursingNotes: boolean;
  followUpScheduled: boolean;
}

interface PendingPatient {
  id: number;
  patientName: string;
  room: string;
  admissionDate: string;
  condition: string;
  status: 'pending' | 'ready' | 'discharged';
  physician: string;
  department: string;
  age: number;
  estimatedDischarge: string;
  requirements: DischargeRequirements;
}

interface DischargedPatient {
  id: number;
  patientName: string;
  room: string;
  admissionDate: string;
  dischargeDate: string;
  condition: string;
  physician: string;
  department: string;
  age: number;
  finalDiagnosis: string;
  dischargeSummary: string;
  followUpRequired: boolean;
  followUpPlan?: string;
}

const Discharge = () => {
  const [pendingDischarges, setPendingDischarges] = useState<PendingPatient[]>([]);

  const [dischargedPatients, setDischargedPatients] = useState<DischargedPatient[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    department: [] as string[],
    condition: [] as string[]
  });

  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PendingPatient | null>(null);
  const [dischargeForm, setDischargeForm] = useState({
    patientId: '',
    finalDiagnosis: '',
    hospitalStaySummary: '',
    dischargeMedications: '',
    dischargeInstructions: '',
    followUpPlan: '',
    billingStatus: '',
    pendingItems: ''
  });

  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [billingPatients, setBillingPatients] = useState<any[]>([]);
  const [selectedBillingIds, setSelectedBillingIds] = useState<number[]>([]);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

  const handlePrintDischarge = () => {
    console.log('Printing discharge report...');
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType as keyof typeof prev].includes(value)
        ? prev[filterType as keyof typeof prev].filter(item => item !== value)
        : [...prev[filterType as keyof typeof prev], value]
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      status: [],
      department: [],
      condition: []
    });
  };

  const handleProcessDischarge = (patient: PendingPatient) => {
    setSelectedPatient(patient);
    setDischargeForm({
      patientId: patient.patientName,
      finalDiagnosis: '',
      hospitalStaySummary: '',
      dischargeMedications: '',
      dischargeInstructions: '',
      followUpPlan: '',
      billingStatus: 'pending',
      pendingItems: ''
    });
    setIsDischargeModalOpen(true);
  };

  const handleLoadBillingPatients = async () => {
    setIsLoadingBilling(true);
    try {
      const response = await dischargeService.getFromBilling();
      setBillingPatients(response.patients || []);
      setSelectedBillingIds([]);
      setIsAddRecordModalOpen(true);
    } catch (error) {
      console.error('Error loading billing patients:', error);
      alert('Failed to load patients from billing. Please ensure billing records are finalized.');
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const handleToggleBillingPatient = (billingId: number) => {
    setSelectedBillingIds(prev =>
      prev.includes(billingId)
        ? prev.filter(id => id !== billingId)
        : [...prev, billingId]
    );
  };

  const handleImportFromBilling = async () => {
    if (selectedBillingIds.length === 0) {
      alert('Please select at least one patient to import');
      return;
    }

    setIsLoadingBilling(true);
    try {
      const response = await dischargeService.createFromBilling(selectedBillingIds);
      
      if (response.errors && response.errors.length > 0) {
        const errorMessages = response.errors.map((err: any) => err.error).join('\n');
        alert(`Some imports failed:\n${errorMessages}\n\nSuccessfully imported: ${response.created} patient(s)`);
      } else {
        alert(`Successfully imported ${response.created} patient(s) for discharge processing`);
      }

      // Reload pending discharges
      const pendingData = await dischargeService.getPending();
      setPendingDischarges(pendingData);

      setIsAddRecordModalOpen(false);
      setBillingPatients([]);
      setSelectedBillingIds([]);
    } catch (error: any) {
      console.error('Error importing from billing:', error);
      alert(error?.response?.data?.error || 'Failed to import patients from billing');
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const handleSubmitDischarge = () => {
    if (!selectedPatient) return;

    if (!dischargeForm.finalDiagnosis || !dischargeForm.hospitalStaySummary) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if all required items are completed
    const allRequiredCompleted = selectedPatient.requirements &&
      selectedPatient.requirements.finalDiagnosis &&
      selectedPatient.requirements.physicianSignature &&
      selectedPatient.requirements.medicationReconciliation &&
      selectedPatient.requirements.dischargeSummary &&
      selectedPatient.requirements.billingClearance;

    if (!allRequiredCompleted) {
      alert('All required discharge items must be completed before final discharge');
      return;
    }

    // Move patient to discharged list
    const dischargedPatient: DischargedPatient = {
      id: Date.now(),
      patientName: selectedPatient.patientName,
      room: selectedPatient.room,
      admissionDate: selectedPatient.admissionDate,
      dischargeDate: new Date().toISOString().split('T')[0],
      condition: selectedPatient.condition,
      physician: selectedPatient.physician,
      department: selectedPatient.department,
      age: selectedPatient.age,
      finalDiagnosis: dischargeForm.finalDiagnosis,
      dischargeSummary: dischargeForm.hospitalStaySummary,
      followUpRequired: !!dischargeForm.followUpPlan,
      followUpPlan: dischargeForm.followUpPlan
    };

    setDischargedPatients(prev => [...prev, dischargedPatient]);
    setPendingDischarges(prev => prev.filter(p => p.id !== selectedPatient.id));

    alert(`Discharge completed successfully for ${selectedPatient.patientName}`);
    setIsDischargeModalOpen(false);
    setSelectedPatient(null);
    setDischargeForm({
      patientId: '',
      finalDiagnosis: '',
      hospitalStaySummary: '',
      dischargeMedications: '',
      dischargeInstructions: '',
      followUpPlan: '',
      billingStatus: '',
      pendingItems: ''
    });
  };

  const canPrint = () => {
    return dischargedPatients.length > 0;
  };

  const filteredDischarges = pendingDischarges.filter(patient => {
    const matchesSearch = patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.physician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.includes(patient.status);
    const matchesDepartment = activeFilters.department.length === 0 || activeFilters.department.includes(patient.department);
    const matchesCondition = activeFilters.condition.length === 0 || activeFilters.condition.includes(patient.condition);

    return matchesSearch && matchesStatus && matchesDepartment && matchesCondition;
  });

  const hasActiveFilters = Object.values(activeFilters).some(filter => filter.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Discharge Management</h1>
          <p className="text-muted-foreground">Manage patient discharge procedures with comprehensive status tracking</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleLoadBillingPatients}
            disabled={isLoadingBilling}
            className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
          >
            {isLoadingBilling ? (
              <>
                <AlertTriangle className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </>
            )}
          </Button>
          {canPrint() ? (
            <PrintButton
              onPrint={handlePrintDischarge}
              className="bg-green-600 hover:bg-green-700"
            >
              Print Available - {dischargedPatients.length} Patients
            </PrintButton>
          ) : (
            <Button disabled variant="outline" className="cursor-not-allowed">
              <FileText className="w-4 h-4 mr-2" />
              No Discharged Patients to Print
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Active Discharges
          </TabsTrigger>
          <TabsTrigger value="discharged" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Discharged Patients ({dischargedPatients.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <UserX className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending Discharges</p>
                    <p className="text-2xl font-bold text-foreground">{pendingDischarges.filter(p => p.status === 'pending').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Ready for Discharge</p>
                    <p className="text-2xl font-bold text-foreground">{pendingDischarges.filter(p => p.status === 'ready').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Discharged Today</p>
                    <p className="text-2xl font-bold text-foreground">
                      {dischargedPatients.filter(p => p.dischargeDate === new Date().toISOString().split('T')[0]).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                    <p className="text-2xl font-bold text-foreground">{pendingDischarges.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle>Active Discharge Queue</CardTitle>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search patients, room, condition..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                            {hasActiveFilters && (
                              <Badge className="ml-2 bg-primary/10 text-primary text-xs">
                                {Object.values(activeFilters).flat().length}
                              </Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-popover">
                          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                          <DropdownMenuCheckboxItem
                            checked={activeFilters.status.includes('ready')}
                            onCheckedChange={() => handleFilterChange('status', 'ready')}
                          >
                            Ready for Discharge
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={activeFilters.status.includes('pending')}
                            onCheckedChange={() => handleFilterChange('status', 'pending')}
                          >
                            Pending Clearance
                          </DropdownMenuCheckboxItem>
                          {hasActiveFilters && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={clearFilters} className="text-destructive">
                                <X className="w-4 h-4 mr-2" />
                                Clear All Filters
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredDischarges.map((patient) => (
                      <div key={patient.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{patient.patientName}</h3>
                          <DischargeStatusBadge status={patient.status} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium text-foreground">Room:</span> {patient.room}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Condition:</span> {patient.condition}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Department:</span> {patient.department}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Physician:</span> {patient.physician}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleProcessDischarge(patient)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {patient.status === 'ready' ? 'Complete Discharge' : 'Review & Update'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredDischarges.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No discharge records found matching your criteria.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              {selectedPatient && (
                <PendingItemsSection
                  requirements={selectedPatient.requirements}
                  className="mb-6"
                />
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const readyPatients = pendingDischarges.filter(p => p.status === 'ready');
                      if (readyPatients.length > 0) {
                        handleProcessDischarge(readyPatients[0]);
                      }
                    }}
                    disabled={pendingDischarges.filter(p => p.status === 'ready').length === 0}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Process Next Ready Patient
                  </Button>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Printing is only available for fully discharged patients in the "Discharged Patients" tab.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discharged" className="space-y-6">
          <DischargedPatientsReport dischargedPatients={dischargedPatients} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{dischargedPatients.length}</p>
                  <p className="text-sm text-muted-foreground">Total Discharged</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingDischarges.filter(p => p.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Items</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {dischargedPatients.filter(p => p.followUpRequired).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Follow-up Required</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round((dischargedPatients.length / (dischargedPatients.length + pendingDischarges.length)) * 100) || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Discharge Process Modal */}
      <Dialog open={isDischargeModalOpen} onOpenChange={setIsDischargeModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Discharge - {selectedPatient?.patientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {selectedPatient && (
              <PendingItemsSection
                requirements={selectedPatient.requirements}
                className="mb-6"
              />
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="finalDiagnosis">Final Diagnosis *</Label>
                <Textarea
                  id="finalDiagnosis"
                  value={dischargeForm.finalDiagnosis}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, finalDiagnosis: e.target.value })}
                  placeholder="Enter the final diagnosis..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalStaySummary">Summary of Hospital Stay *</Label>
                <Textarea
                  id="hospitalStaySummary"
                  value={dischargeForm.hospitalStaySummary}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, hospitalStaySummary: e.target.value })}
                  placeholder="Provide a comprehensive summary of the patient's hospital stay..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpPlan">Follow-Up Plan</Label>
                <Textarea
                  id="followUpPlan"
                  value={dischargeForm.followUpPlan}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, followUpPlan: e.target.value })}
                  placeholder="Specify follow-up appointments, tests, or procedures needed..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsDischargeModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitDischarge} className="bg-primary hover:bg-primary/90">
                Complete Discharge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Discharge Record Modal - Import from Billing */}
      <Dialog open={isAddRecordModalOpen} onOpenChange={setIsAddRecordModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Patients from Billing for Discharge</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Only patients with finalized billing records are eligible for discharge processing
            </p>
          </DialogHeader>
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>Hospital Policy:</strong> Discharge records can only be created from finalized billing records. 
                Select patients below to add them to the discharge queue.
              </AlertDescription>
            </Alert>

            {billingPatients.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No eligible patients found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  All patients with finalized billing have been added to discharge queue
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-medium">
                    {billingPatients.length} eligible patient(s) | {selectedBillingIds.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedBillingIds.length === billingPatients.length) {
                        setSelectedBillingIds([]);
                      } else {
                        setSelectedBillingIds(billingPatients.map(p => p.billing_id));
                      }
                    }}
                  >
                    {selectedBillingIds.length === billingPatients.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {billingPatients.map((patient) => (
                    <div
                      key={patient.billing_id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all cursor-pointer ${
                        selectedBillingIds.includes(patient.billing_id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => handleToggleBillingPatient(patient.billing_id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                          checked={selectedBillingIds.includes(patient.billing_id)}
                          onCheckedChange={() => handleToggleBillingPatient(patient.billing_id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-base">{patient.patient_name}</h4>
                            <Badge variant="outline" className="text-xs">
                              ID: {patient.hospital_id}
                            </Badge>
                            {patient.is_finalized && (
                              <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Billing Finalized
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Room:</span>
                              <span className="ml-1 font-medium">{patient.room}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Age:</span>
                              <span className="ml-1 font-medium">{patient.age} yrs</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Department:</span>
                              <span className="ml-1 font-medium">{patient.department}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Physician:</span>
                              <span className="ml-1 font-medium">{patient.attending_physician}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Condition:</span>
                            <span className="ml-1 font-medium">{patient.condition}</span>
                          </div>
                          {patient.total_amount && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Total Bill:</span>
                              <span className="ml-1 font-semibold text-green-600">
                                ₱{parseFloat(patient.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddRecordModalOpen(false);
                  setBillingPatients([]);
                  setSelectedBillingIds([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImportFromBilling}
                disabled={selectedBillingIds.length === 0 || isLoadingBilling}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoadingBilling ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Import {selectedBillingIds.length} Patient{selectedBillingIds.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discharge;