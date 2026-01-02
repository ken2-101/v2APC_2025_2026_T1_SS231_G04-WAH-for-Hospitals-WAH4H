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

// Detect backend URL dynamically
const API_BASE =
  process.env.NODE_ENV === 'development'
    ? 'https://glowing-orbit-wrgjv6x7jpq929j9p-8000.app.github.dev/api'
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
  return <MonitoringDashboard admissions={admissions} onSelectAdmission={handleSelectAdmission} />;
};

export default Monitoring;
