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
  const [newRecordForm, setNewRecordForm] = useState({
    patient: '',
    patientName: '',
    room: '',
    admissionDate: '',
    condition: '',
    physician: '',
    department: '',
    age: '',
    estimatedDischarge: ''
  });

  const [isBillingImportModalOpen, setIsBillingImportModalOpen] = useState(false);
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

  const handleAddNewRecord = () => {
    if (!newRecordForm.patientName || !newRecordForm.room || !newRecordForm.admissionDate ||
      !newRecordForm.condition || !newRecordForm.physician || !newRecordForm.department ||
      !newRecordForm.age) {
      alert('Please fill in all required fields');
      return;
    }

    const newRecord: PendingPatient = {
      id: Date.now(),
      patientName: newRecordForm.patientName,
      room: newRecordForm.room,
      admissionDate: newRecordForm.admissionDate,
      condition: newRecordForm.condition,
      status: 'pending',
      physician: newRecordForm.physician,
      department: newRecordForm.department,
      age: parseInt(newRecordForm.age),
      estimatedDischarge: newRecordForm.estimatedDischarge || '',
      requirements: {
        finalDiagnosis: false,
        physicianSignature: false,
        medicationReconciliation: false,
        dischargeSummary: false,
        billingClearance: false,
        nursingNotes: false,
        followUpScheduled: false
      }
    };

    setPendingDischarges(prev => [...prev, newRecord]);
    setIsAddRecordModalOpen(false);
    setNewRecordForm({
      patient: '',
      patientName: '',
      room: '',
      admissionDate: '',
      condition: '',
      physician: '',
      department: '',
      age: '',
      estimatedDischarge: ''
    });
    alert(`Discharge record created successfully for ${newRecordForm.patientName}`);
  };

  const handleLoadBillingPatients = async () => {
    setIsLoadingBilling(true);
    try {
      const response = await dischargeService.getFromBilling();
      setBillingPatients(response.patients || []);
      setSelectedBillingIds([]);
      setIsBillingImportModalOpen(true);
    } catch (error) {
      console.error('Error loading billing patients:', error);
      alert('Failed to load patients from billing');
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

    try {
      const response = await dischargeService.createFromBilling(selectedBillingIds);
      alert(`Successfully imported ${response.created} patient(s) for discharge`);

      // Reload the discharge records
      // In a real app, you'd fetch from the API here
      if (response.records && response.records.length > 0) {
        const newRecords = response.records.map((record: any) => ({
          id: record.id,
          patientName: record.patientName,
          room: record.room,
          admissionDate: record.admissionDate,
          condition: record.condition,
          status: record.status,
          physician: record.physician,
          department: record.department,
          age: record.age,
          estimatedDischarge: record.estimatedDischarge || '',
          requirements: record.requirements
        }));
        setPendingDischarges(prev => [...prev, ...newRecords]);
      }

      setIsBillingImportModalOpen(false);
      setBillingPatients([]);
      setSelectedBillingIds([]);
    } catch (error) {
      console.error('Error importing from billing:', error);
      alert('Failed to import patients from billing');
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
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoadingBilling ? 'Loading...' : 'Import from Billing'}
          </Button>
          <Button
            onClick={() => setIsAddRecordModalOpen(true)}
            className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Record
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

      {/* Add New Discharge Record Modal */}
      <Dialog open={isAddRecordModalOpen} onOpenChange={setIsAddRecordModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Discharge Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  value={newRecordForm.patientName}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, patientName: e.target.value })}
                  placeholder="Enter patient name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Room *</Label>
                <Input
                  id="room"
                  value={newRecordForm.room}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, room: e.target.value })}
                  placeholder="e.g., 101A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admissionDate">Admission Date *</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={newRecordForm.admissionDate}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, admissionDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={newRecordForm.age}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, age: e.target.value })}
                  placeholder="Enter age"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Input
                  id="condition"
                  value={newRecordForm.condition}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, condition: e.target.value })}
                  placeholder="e.g., Pneumonia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="physician">Physician *</Label>
                <Input
                  id="physician"
                  value={newRecordForm.physician}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, physician: e.target.value })}
                  placeholder="e.g., Dr. Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={newRecordForm.department}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, department: e.target.value })}
                  placeholder="e.g., Cardiology"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDischarge">Estimated Discharge Date</Label>
                <Input
                  id="estimatedDischarge"
                  type="date"
                  value={newRecordForm.estimatedDischarge}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, estimatedDischarge: e.target.value })}
                />
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                New discharge records will be created with "Pending" status. All discharge requirements will need to be completed before the patient can be discharged.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => {
                setIsAddRecordModalOpen(false);
                setNewRecordForm({
                  patient: '',
                  patientName: '',
                  room: '',
                  admissionDate: '',
                  condition: '',
                  physician: '',
                  department: '',
                  age: '',
                  estimatedDischarge: ''
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddNewRecord} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import from Billing Modal */}
      <Dialog open={isBillingImportModalOpen} onOpenChange={setIsBillingImportModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Patients from Billing</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Select patients with billing records to create discharge records. Only patients without existing discharge records are shown.
              </AlertDescription>
            </Alert>

            {billingPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No eligible patients found in billing records.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-medium">
                    {billingPatients.length} patient(s) available | {selectedBillingIds.length} selected
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

                {billingPatients.map((patient) => (
                  <div
                    key={patient.billing_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleToggleBillingPatient(patient.billing_id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Checkbox
                        checked={selectedBillingIds.includes(patient.billing_id)}
                        onCheckedChange={() => handleToggleBillingPatient(patient.billing_id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{patient.patient_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {patient.hospital_id}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Room:</span> {patient.room}
                          </div>
                          <div>
                            <span className="font-medium">Admission:</span> {patient.admission_date}
                          </div>
                          <div>
                            <span className="font-medium">Payment:</span>{' '}
                            <Badge
                              variant="outline"
                              className={
                                patient.payment_status === 'Paid'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : patient.payment_status === 'Partial'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                              }
                            >
                              {patient.payment_status}
                            </Badge>
                          </div>
                        </div>
                        {patient.running_balance && parseFloat(patient.running_balance) > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Balance:</span> ₱{parseFloat(patient.running_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBillingImportModalOpen(false);
                  setBillingPatients([]);
                  setSelectedBillingIds([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportFromBilling}
                disabled={selectedBillingIds.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Import {selectedBillingIds.length} Patient(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discharge;