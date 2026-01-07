import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  MonitoringAdmission,
  VitalSign,
  ClinicalNote,
  DietaryOrder,
  HistoryEvent,
} from '../types/monitoring';
import { PatientMonitoringPage } from '@/components/monitoring/PatientMonitoringPage';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { MonitoringFilters } from '@/components/monitoring/MonitoringFilters';

// Detect backend URL dynamically
const API_BASE =
  import.meta.env.BACKEND_MONITORING_8000 ||
    import.meta.env.LOCAL_8000
    ? `${import.meta.env.LOCAL_8000}/api`
    : import.meta.env.BACKEND_MONITORING;

const Monitoring: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'patient'>('dashboard');
  const [admissions, setAdmissions] = useState<MonitoringAdmission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<MonitoringAdmission | null>(null);

  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [dietary, setDietary] = useState<DietaryOrder | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({ ward: '', status: '', doctor: '' });

  // Fetch all admissions
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admissions/`);
        if (Array.isArray(res.data)) {
          const mapped: MonitoringAdmission[] = res.data.map((adm: any) => ({
            id: adm.id,
            patientId: adm.patient,
            patientName: adm.patient_details
              ? `${adm.patient_details.last_name}, ${adm.patient_details.first_name}`
              : 'Unknown Patient',
            room: adm.room || '—',
            doctorName: adm.attending_physician || 'Unknown Doctor',
            nurseName: adm.assigned_nurse || 'Unknown Nurse',
            status: 'Stable', // default
            encounterType: adm.encounter_type,
            admittingDiagnosis: adm.admitting_diagnosis,
            reasonForAdmission: adm.reason_for_admission,
            admissionCategory: adm.admission_category,
            modeOfArrival: adm.mode_of_arrival,
            admissionDate: adm.admission_date,
            attendingPhysician: adm.attending_physician,
            assignedNurse: adm.assigned_nurse,
            ward: adm.ward,
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
      const [vitalsRes, notesRes, dietaryRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/monitoring/vitals/?admission=${adm.id}`),
        axios.get(`${API_BASE}/monitoring/notes/?admission=${adm.id}`),
        axios.get(`${API_BASE}/monitoring/dietary-orders/?admission=${adm.id}`),
        axios.get(`${API_BASE}/monitoring/history/?admission=${adm.id}`),
      ]);

      setVitals(Array.isArray(vitalsRes.data) ? vitalsRes.data : []);
      setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
      setDietary(dietaryRes.data || null);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
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
      const payload = {
        admission: newVital.admissionId,
        date_time: newVital.dateTime,
        blood_pressure: newVital.bloodPressure,
        heart_rate: newVital.heartRate,
        respiratory_rate: newVital.respiratoryRate,
        temperature: newVital.temperature,
        oxygen_saturation: newVital.oxygenSaturation,
        staff_name: newVital.staffName,
      };
      const res = await axios.post(`${API_BASE}/monitoring/vitals/`, payload);
      setVitals((prev) => [...prev, res.data]);
    } catch (err: any) {
      console.error('Error adding vital:', err.response?.data || err);
    }
  };

  // Add new clinical note
  const handleAddNote = async (newNote: ClinicalNote) => {
    if (!selectedAdmission) return;
    try {
      const payload = {
        admission: newNote.admissionId,
        date_time: newNote.dateTime,
        type: newNote.type,
        subjective: newNote.subjective,
        objective: newNote.objective,
        assessment: newNote.assessment,
        plan: newNote.plan,
        provider_name: newNote.providerName,
      };
      const res = await axios.post(`${API_BASE}/monitoring/notes/`, payload);
      setNotes((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  // Update dietary order
  const handleUpdateDietary = async (order: DietaryOrder) => {
    if (!selectedAdmission) return;

    const payload = {
      admission: order.admissionId,
      diet_type: order.dietType,
      allergies: order.allergies,
      npo_response: order.npoResponse,
      activity_level: order.activityLevel,
      ordered_by: order.orderedBy,
    };

    try {
      if (order.id) {
        const res = await axios.put(`${API_BASE}/monitoring/dietary-orders/${order.id}/`, payload);
        setDietary(res.data);
      } else {
        const res = await axios.post(`${API_BASE}/monitoring/dietary-orders/`, payload);
        setDietary(res.data);
      }
    } catch (err) {
      console.error('Error updating dietary order:', err);
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
        dietaryOrder={dietary || undefined}
        onBack={() => setCurrentView('dashboard')}
        onAddVital={handleAddVital}
        onAddNote={handleAddNote}
        onUpdateDietary={handleUpdateDietary}
      />
    );
  }

  // Render dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Monitoring</h1>
        <p className="text-gray-600">Track vital signs, clinical notes, and dietary orders for admitted patients</p>
      </div>

      {/* Monitoring Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="mb-2 md:mb-0">Patients Under Monitoring</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patient name or ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <MonitoringFilters
                activeFilters={activeFilters}
                handleFilterChange={handleFilterChange}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MonitoringDashboard
            admissions={filteredAdmissions}
            onSelectAdmission={handleSelectAdmission}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Monitoring;
