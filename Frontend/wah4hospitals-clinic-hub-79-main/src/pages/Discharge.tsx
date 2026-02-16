import React, { useState, useEffect } from 'react';
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
import type { PendingPatient, DischargedPatient, DischargeRequirements } from '@/types/discharge';

const Discharge = () => {
  const [pendingDischarges, setPendingDischarges] = useState<PendingPatient[]>([]);
  const [dischargedPatients, setDischargedPatients] = useState<DischargedPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PendingPatient | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    department: [] as string[],
    condition: [] as string[]
  });
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

  const handleRequirementChange = async (requirement: keyof DischargeRequirements, checked: boolean) => {
    if (!selectedPatient) return;

    try {
      await dischargeService.updateRequirements(selectedPatient.id, {
        [requirement]: checked
      });

      // Update local state
      const updatedPending = pendingDischarges.map(p => {
        if (p.id === selectedPatient.id) {
          const newRequirements = { ...p.requirements, [requirement]: checked } as DischargeRequirements;
          return { ...p, requirements: newRequirements };
        }
        return p;
      });
      setPendingDischarges(updatedPending);
      
      if (selectedPatient) {
        setSelectedPatient({
          ...selectedPatient,
          requirements: { ...selectedPatient.requirements, [requirement]: checked } as DischargeRequirements
        });
      }
    } catch (error) {
      console.error('Error updating requirement:', error);
      alert('Failed to update requirement status');
    }
  };

  // Load pending discharges and discharged patients on mount
  useEffect(() => {
    loadDischargeData();
  }, []);

  const loadDischargeData = async () => {
    try {
      setIsLoading(true);
      const [pendingData, dischargedData] = await Promise.all([
        dischargeService.getPending(),
        dischargeService.getDischarged()
      ]);
      setPendingDischarges(pendingData);
      setDischargedPatients(dischargedData);
    } catch (error) {
      console.error('Error loading discharge data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      alert('Failed to load patients from billing records. Please try again.');
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
      alert('Please select at least one patient to add');
      return;
    }

    setIsLoadingBilling(true);
    try {
      const response = await dischargeService.createFromBilling(selectedBillingIds);
      
      if (response.errors && response.errors.length > 0) {
        const errorMessages = response.errors.map((err: any) => err.error).join('\n');
        alert(`Some records could not be added:\n${errorMessages}\n\nSuccessfully added: ${response.created} patient(s)`);
      } else {
        alert(`Successfully added ${response.created} patient(s) to discharge queue`);
      }

      // Reload pending discharges
      await loadDischargeData();

      setIsAddRecordModalOpen(false);
      setBillingPatients([]);
      setSelectedBillingIds([]);
    } catch (error: any) {
      console.error('Error importing from billing:', error);
      alert(error?.response?.data?.error || 'Failed to add patients from billing');
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const handleSubmitDischarge = async () => {
    if (!selectedPatient || !selectedPatient.id) return;

    if (!dischargeForm.finalDiagnosis || !dischargeForm.hospitalStaySummary) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if all required items from other modules are completed
    // Requirements: billing_cleared, medication_reconciliation, nursing_notes
    const requirements = (selectedPatient.requirements || {}) as DischargeRequirements;
    const allRequiredCompleted = 
      requirements.billing_cleared && 
      requirements.medication_reconciliation &&
      requirements.nursing_notes;

    if (!allRequiredCompleted) {
      alert('All required items from external modules must be completed before final discharge');
      return;
    }

    try {
      // Complete discharge via API
      await dischargeService.completeDischarge(selectedPatient.id, {
        finalDiagnosis: dischargeForm.finalDiagnosis,
        hospitalStaySummary: dischargeForm.hospitalStaySummary,
        dischargeInstructions: dischargeForm.dischargeInstructions,
        followUpPlan: dischargeForm.followUpPlan
      });

      alert(`Discharge completed successfully for ${selectedPatient.patientName}`);
      
      // Reload discharge data
      await loadDischargeData();
      
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
    } catch (error: any) {
      console.error('Error completing discharge:', error);
      alert(error?.response?.data?.error || 'Failed to complete discharge. Please try again.');
    }
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
          <TabsTrigger value="active" className="flex items-center justify-center gap-2 py-3 sm:py-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="truncate">Active Discharges</span>
          </TabsTrigger>
          <TabsTrigger value="discharged" className="flex items-center justify-center gap-2 py-3 sm:py-2">
            <CheckCircle className="w-4 h-4" />
            <span className="truncate">Discharged ({dischargedPatients.length})</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center justify-center gap-2 py-3 sm:py-2">
            <Users className="w-4 h-4" />
            <span className="truncate">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <CardTitle>Active Discharge Queue</CardTitle>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search patients..."
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3 className="font-semibold text-lg">{patient.patientName}</h3>
                          <DischargeStatusBadge status={patient.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
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
                        <div className="flex justify-end pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleProcessDischarge(patient)}
                            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
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
                  onRequirementChange={handleRequirementChange}
                  className="mb-6"
                />
              )}

              {/* Quick Actions removed as requested */}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discharged" className="space-y-6">
          <DischargedPatientsReport dischargedPatients={dischargedPatients} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                onRequirementChange={handleRequirementChange}
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
            <DialogTitle>Add Discharge Record from Billing</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Select patients from existing billing records to create discharge records
            </p>
          </DialogHeader>
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                Select patients below to add them to the discharge queue for processing
              </AlertDescription>
            </Alert>

            {billingPatients.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No patients available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  All billing records have been added to discharge queue
                </p>
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

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {billingPatients.map((patient) => (
                    <div
                      key={patient.billing_id}
                      className={`flex items-start p-4 border-2 rounded-lg transition-all cursor-pointer ${
                        selectedBillingIds.includes(patient.billing_id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => handleToggleBillingPatient(patient.billing_id)}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <Checkbox
                          checked={selectedBillingIds.includes(patient.billing_id)}
                          onCheckedChange={() => handleToggleBillingPatient(patient.billing_id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-base">{patient.patient_name}</h4>
                            <Badge variant="outline" className="text-xs">
                              ID: {patient.hospital_id}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Room:</span>
                              <span className="ml-2 font-medium">{patient.room}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Age:</span>
                              <span className="ml-2 font-medium">{patient.age} years</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Department:</span>
                              <span className="ml-2 font-medium">{patient.department}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Admission:</span>
                              <span className="ml-2 font-medium">{patient.admission_date}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Physician:</span>
                              <span className="ml-2 font-medium">{patient.attending_physician}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Condition:</span>
                              <span className="ml-2 font-medium">{patient.condition}</span>
                            </div>
                          </div>
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
                    Add {selectedBillingIds.length} Record{selectedBillingIds.length !== 1 ? 's' : ''}
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