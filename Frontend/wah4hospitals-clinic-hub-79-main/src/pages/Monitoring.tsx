import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  MonitoringAdmission,
  VitalSign,
  ClinicalNote,
  DietaryOrder,
  HistoryEvent,
  LabRequest,
  LabResult,
} from '../types/monitoring';
import { PatientMonitoringPage } from '@/components/monitoring/PatientMonitoringPage';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { Activity, Users, AlertTriangle, Heart } from 'lucide-react';
import { admissionService } from '@/services/admissionService';
import monitoringService from '@/services/monitoringService';

const Monitoring: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'patient'>('dashboard');
  const [admissions, setAdmissions] = useState<MonitoringAdmission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<MonitoringAdmission | null>(null);

  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [dietary, setDietary] = useState<DietaryOrder | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({ ward: '', status: '', doctor: '' });

  // Fetch all admissions
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const data = await admissionService.getAll();
        if (Array.isArray(data)) {
          const mapped: MonitoringAdmission[] = data.map((adm: any) => ({
            id: adm.encounter_id, // Use encounter_id as primary ID
            patientId: adm.subject_id,
            patientName: adm.patient_summary
              ? `${adm.patient_summary.last_name}, ${adm.patient_summary.first_name}`
              : 'Unknown Patient',
            room: adm.location_summary?.name || '—',
            doctorName: adm.participant_summary?.[0]?.name || 'Unknown Doctor', // Approximation
            nurseName: 'Unknown Nurse',
            status: adm.status === 'in-progress' ? 'Stable' : 'Observation', // Map status
            encounterType: adm.class_code,
            admittingDiagnosis: adm.hospitalization?.admitting_diagnosis_code || 'N/A',
            reasonForAdmission: adm.reason_code?.[0] || 'N/A',
            admissionCategory: adm.service_type,
            modeOfArrival: adm.hospitalization?.admit_source,
            admissionDate: adm.period_start,
            attendingPhysician: adm.participant_summary?.[0]?.name,
            assignedNurse: 'Unknown',
            ward: adm.location_summary?.name || 'General Ward',
          }));
          setAdmissions(mapped);
        }
      } catch (err) {
        console.error('Error fetching admissions:', err);
      }
    };
    fetchAdmissions();
  }, []);

  // Filter handlers
  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({ ward: '', status: '', doctor: '' });
  };

  // Select an admission
  const handleSelectAdmission = async (adm: MonitoringAdmission) => {
    setSelectedAdmission(adm);
    setCurrentView('patient');

    try {
      // Fetch data using monitoringService
      const [fetchedVitals, fetchedNotes, fetchedDietary, fetchedLabRequests] = await Promise.all([
        monitoringService.getVitals(adm.id),
        monitoringService.getNotes(adm.id),
        monitoringService.getDietary(adm.id),
        monitoringService.getLaboratoryRequests(adm.id)
      ]);

      setVitals(fetchedVitals);
      setNotes(fetchedNotes);
      setDietary(fetchedDietary);
      setLabRequests(fetchedLabRequests);
      // History not yet implemented in service
      setHistory([]);
    } catch (err) {
      console.error('Error fetching admission details:', err);
    }
  };

  // Filtered admissions
  const filteredAdmissions = admissions.filter(admission => {
    const matchesSearch =
      admission.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admission.id.toString().includes(searchTerm);

    const matchesWard = !activeFilters.ward || admission.ward === activeFilters.ward;
    const matchesStatus = !activeFilters.status || admission.status === activeFilters.status;
    const matchesDoctor = !activeFilters.doctor || admission.attendingPhysician === activeFilters.doctor;

    return matchesSearch && matchesWard && matchesStatus && matchesDoctor;
  });

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  // Add new vital (backend-compatible)
  const handleAddVital = async (newVital: Omit<VitalSign, 'id'>) => {
    if (!selectedAdmission) return;
    try {
      await monitoringService.addVital(newVital, selectedAdmission.patientId);
      // Refresh list
      const updatedVitals = await monitoringService.getVitals(selectedAdmission.id);
      setVitals(updatedVitals);
    } catch (err) {
      console.error('Error adding vital:', err);
    }
  };

  // Add new clinical note
  const handleAddNote = async (newNote: ClinicalNote) => {
    if (!selectedAdmission) return;
    try {
      await monitoringService.addNote(newNote, selectedAdmission.patientId);
      // Refresh list
      const updatedNotes = await monitoringService.getNotes(selectedAdmission.id);
      setNotes(updatedNotes);
    } catch (err) {
      console.error(err);
    }
  };

  // Update dietary order
  const handleUpdateDietary = async (order: DietaryOrder) => {
    if (!selectedAdmission) return;
    try {
      await monitoringService.saveDietary(order, selectedAdmission.patientId);
      const updatedDietary = await monitoringService.getDietary(selectedAdmission.id);
      setDietary(updatedDietary);
    } catch (err) {
      console.error('Error updating dietary order:', err);
    }
  };

  // Add laboratory request
  const handleAddLabRequest = async (request: Omit<LabRequest, 'id'>) => {
    if (!selectedAdmission) return;
    try {
      await monitoringService.addLaboratoryRequest(request, selectedAdmission.patientId);
      // Refresh list
      const updatedLabRequests = await monitoringService.getLaboratoryRequests(selectedAdmission.id);
      setLabRequests(updatedLabRequests);
    } catch (err) {
      console.error('Error adding lab request:', err);
    }
  };

  // Update laboratory result  
  const handleUpdateLabResult = async (requestId: string, result: LabResult) => {
    if (!selectedAdmission) return;
    try {
      await monitoringService.updateLabResult(parseInt(requestId), result);
      // Refresh list
      const updatedLabRequests = await monitoringService.getLaboratoryRequests(selectedAdmission.id);
      setLabRequests(updatedLabRequests);
    } catch (err) {
      console.error('Error updating lab result:', err);
    }
  };

  // Render patient page
  if (currentView === 'patient' && selectedAdmission) {
    return (
      <PatientMonitoringPage
        patient={selectedAdmission}
        vitals={vitals}
        notes={notes}
        history={history}
        labRequests={labRequests}
        dietaryOrder={dietary || undefined}
        onBack={() => setCurrentView('dashboard')}
        onAddVital={handleAddVital}
        onAddNote={handleAddNote}
        onUpdateDietary={handleUpdateDietary}
        onAddLabRequest={handleAddLabRequest}
        onUpdateLabResult={handleUpdateLabResult}
      />
    );
  }

  // Render dashboard
  return (
    <div className="space-y-6 pb-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center gap-4 mb-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 border border-white/30">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Patient Monitoring</h1>
            <p className="text-blue-100 text-sm mt-1">Real-time patient care and vital signs tracking</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Active Patients</p>
                <p className="text-3xl font-bold mt-1">{admissions.length}</p>
              </div>
              <Users className="w-8 h-8 text-white/60" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Critical Status</p>
                <p className="text-3xl font-bold mt-1">
                  {admissions.filter(a => a.status === 'Critical').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-300" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Stable Status</p>
                <p className="text-3xl font-bold mt-1">
                  {admissions.filter(a => a.status === 'Stable').length}
                </p>
              </div>
              <Heart className="w-8 h-8 text-green-300" />
            </div>
          </div>
        </div>
      </div>

      <MonitoringDashboard admissions={admissions} onSelectAdmission={handleSelectAdmission} />
    </div>
  );
};

export default Monitoring;
