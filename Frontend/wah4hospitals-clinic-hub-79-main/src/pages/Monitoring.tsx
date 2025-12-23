import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MonitoringAdmission,
  VitalSign,
  ClinicalNote,
  DietaryOrder,
  HistoryEvent,
} from '../types/monitoring';
import { PatientMonitoringPage } from '@/components/monitoring/PatientMonitoringPage';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

// ✅ Detect backend URL dynamically (works in Codespaces & local)
const API_BASE =
  process.env.NODE_ENV === 'development'
    ? 'https://scaling-memory-jj56p55q79g42qwq5-8000.app.github.dev/api'
    : '/api';

const Monitoring: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'patient'>('dashboard');
  const [admissions, setAdmissions] = useState<MonitoringAdmission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<MonitoringAdmission | null>(null);

  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [dietary, setDietary] = useState<DietaryOrder | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);

  // Fetch all admissions
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admissions/`);
        if (Array.isArray(res.data)) {
          // Map API response to MonitoringAdmission
          const mapped: MonitoringAdmission[] = res.data.map((adm: any) => ({
            id: adm.id,
            patientId: adm.patient,
            patientName: adm.patient_details
              ? `${adm.patient_details.first_name} ${adm.patient_details.last_name}`
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
          console.log('Mapped Admissions:', mapped);
          setAdmissions(mapped);
        } else {
          console.error('API did not return an array:', res.data);
        }
      } catch (err) {
        console.error('Error fetching admissions:', err);
      }
    };
    fetchAdmissions();
  }, []);

  // Select an admission
  const handleSelectAdmission = async (adm: MonitoringAdmission) => {
    setSelectedAdmission(adm);
    setCurrentView('patient');

    try {
      const [vitalsRes, notesRes, dietaryRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/monitorings/by_admission/?admission_id=${adm.id}`),
        axios.get(`${API_BASE}/notes/by_admission/?admission_id=${adm.id}`),
        axios.get(`${API_BASE}/dietary/by_admission/?admission_id=${adm.id}`),
        axios.get(`${API_BASE}/history/by_admission/?admission_id=${adm.id}`),
      ]);

      setVitals(Array.isArray(vitalsRes.data) ? vitalsRes.data : []);
      setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
      setDietary(dietaryRes.data || null);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (err) {
      console.error('Error fetching admission details:', err);
    }
  };

  // Add new vital
  const handleAddVital = async (newVital: VitalSign) => {
    if (!selectedAdmission) return;
    try {
      const res = await axios.post(`${API_BASE}/monitorings/`, newVital);
      setVitals((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  // Add new clinical note
  const handleAddNote = async (newNote: ClinicalNote) => {
    if (!selectedAdmission) return;
    try {
      const res = await axios.post(`${API_BASE}/notes/`, newNote);
      setNotes((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  // Update dietary order
  const handleUpdateDietary = async (order: DietaryOrder) => {
    if (!selectedAdmission) return;
    if (!order.id) return; // defensive
    try {
      const res = await axios.put(`${API_BASE}/dietary/${order.id}/`, order);
      setDietary(res.data);
    } catch (err) {
      console.error(err);
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
  return <MonitoringDashboard admissions={admissions} onSelectAdmission={handleSelectAdmission} />;
};

export default Monitoring;
