import React, { useState } from 'react';
import { MonitoringPatient, VitalSign, ClinicalNote, DietaryOrder, HistoryEvent } from '../types/monitoring';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { PatientMonitoringPage } from '@/components/monitoring/PatientMonitoringPage';

const Monitoring = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'patient'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // --- Mock Data Store ---

  const [patients, setPatients] = useState<MonitoringPatient[]>([
    {
      id: 'P-101',
      patientName: 'Juan Dela Cruz',
      room: '201-A',
      doctorName: 'Dr. Santos',
      nurseName: 'Nurse Joy',
      status: 'Stable',
      lastVitals: { id: 'v1', dateTime: '2024-06-12T08:00:00', bloodPressure: '120/80', heartRate: 72, respiratoryRate: 16, temperature: 36.5, oxygenSaturation: 98, staffName: 'Nurse Joy' },
      lastNote: { id: 'n1', dateTime: '2024-06-12T09:00:00', type: 'Progress', subjective: '', objective: '', assessment: 'Stable condition', plan: '', providerName: 'Dr. Santos' }
    },
    {
      id: 'P-102',
      patientName: 'Maria Clara',
      room: 'ICU-05',
      doctorName: 'Dr. Rizal',
      nurseName: 'Nurse Glaiza',
      status: 'Critical',
      lastVitals: { id: 'v2', dateTime: '2024-06-12T10:30:00', bloodPressure: '160/95', heartRate: 105, respiratoryRate: 24, temperature: 38.2, oxygenSaturation: 92, staffName: 'Nurse Glaiza' },
      lastNote: { id: 'n2', dateTime: '2024-06-12T11:00:00', type: 'SOAP', subjective: 'Difficulty breathing', objective: 'Low O2, High Feber', assessment: 'Sepsis alert', plan: 'Start antibiotics', providerName: 'Dr. Rizal' }
    }
  ]);

  const [vitalsMap, setVitalsMap] = useState<Record<string, VitalSign[]>>({
    'P-101': [
      { id: 'v1', dateTime: '2024-06-12T08:00:00', bloodPressure: '120/80', heartRate: 72, respiratoryRate: 16, temperature: 36.5, oxygenSaturation: 98, staffName: 'Nurse Joy' },
      { id: 'v0', dateTime: '2024-06-11T20:00:00', bloodPressure: '118/78', heartRate: 70, respiratoryRate: 15, temperature: 36.6, oxygenSaturation: 99, staffName: 'Nurse Night' }
    ],
    'P-102': [
      { id: 'v2', dateTime: '2024-06-12T10:30:00', bloodPressure: '160/95', heartRate: 105, respiratoryRate: 24, temperature: 38.2, oxygenSaturation: 92, staffName: 'Nurse Glaiza' }
    ]
  });

  const [notesMap, setNotesMap] = useState<Record<string, ClinicalNote[]>>({
    'P-101': [
      { id: 'n1', dateTime: '2024-06-12T09:00:00', type: 'Progress', subjective: '', objective: '', assessment: 'Stable condition', plan: 'Continue meds', providerName: 'Dr. Santos' }
    ],
    'P-102': [
      { id: 'n2', dateTime: '2024-06-12T11:00:00', type: 'SOAP', subjective: 'Difficulty breathing', objective: 'Low O2, High Fever', assessment: 'Sepsis alert', plan: 'Start antibiotics', providerName: 'Dr. Rizal' }
    ]
  });

  const [dietaryMap, setDietaryMap] = useState<Record<string, DietaryOrder>>({
    'P-101': { dietType: 'Regular', allergies: [], npoResponse: false, activityLevel: 'Ad Lib', lastUpdated: '2024-06-10T10:00:00', orderedBy: 'Dr. Santos' },
    'P-102': { dietType: 'N/A', allergies: ['Penicillin'], npoResponse: true, activityLevel: 'Bed Rest', lastUpdated: '2024-06-12T08:00:00', orderedBy: 'Dr. Rizal' }
  });

  const [historyMap, setHistoryMap] = useState<Record<string, HistoryEvent[]>>({
    'P-101': [
      { id: 'h1', dateTime: '2024-06-10T08:00:00', category: 'Admission', description: 'Patient admitted for observation', details: 'Room 201-A' },
      { id: 'h2', dateTime: '2024-06-12T08:00:00', category: 'Vitals', description: 'Routine Vitals Check' },
      { id: 'h3', dateTime: '2024-06-12T09:00:00', category: 'Note', description: 'Dr. Santos Rounds' }
    ]
  });

  // --- Handlers ---

  const handleSelectPatient = (p: MonitoringPatient) => {
    setSelectedPatientId(p.id);
    setCurrentView('patient');
  };

  const handleAddVital = (newVital: VitalSign) => {
    if (!selectedPatientId) return;

    // Update local map
    const currentList = vitalsMap[selectedPatientId] || [];
    const newList = [...currentList, newVital];
    setVitalsMap({ ...vitalsMap, [selectedPatientId]: newList });

    // Update Patient List Summary
    setPatients(prev => prev.map(p =>
      p.id === selectedPatientId ? { ...p, lastVitals: newVital } : p
    ));

    // Add to history
    handleAddHistory(selectedPatientId, {
      id: Date.now().toString(),
      dateTime: newVital.dateTime,
      category: 'Vitals',
      description: `Vitals Recorded: BP ${newVital.bloodPressure}`,
      details: `Recorded by ${newVital.staffName}`
    });
  };

  const handleAddNote = (newNote: ClinicalNote) => {
    if (!selectedPatientId) return;

    const currentList = notesMap[selectedPatientId] || [];
    setNotesMap({ ...notesMap, [selectedPatientId]: [...currentList, newNote] });

    setPatients(prev => prev.map(p =>
      p.id === selectedPatientId ? { ...p, lastNote: newNote } : p
    ));

    handleAddHistory(selectedPatientId, {
      id: Date.now().toString(),
      dateTime: newNote.dateTime,
      category: 'Note',
      description: `${newNote.type} Note Added`,
      details: `By ${newNote.providerName}`
    });
  };

  const handleUpdateDietary = (order: DietaryOrder) => {
    if (!selectedPatientId) return;
    setDietaryMap({ ...dietaryMap, [selectedPatientId]: order });

    handleAddHistory(selectedPatientId, {
      id: Date.now().toString(),
      dateTime: order.lastUpdated,
      category: 'Procedure', // Using procedure icon for generic updates or create new category
      description: 'Dietary Orders Updated',
      details: `Diet: ${order.dietType}, NPO: ${order.npoResponse ? 'Yes' : 'No'}`
    });
  };

  const handleAddHistory = (pid: string, event: HistoryEvent) => {
    const currentHistory = historyMap[pid] || [];
    setHistoryMap({ ...historyMap, [pid]: [...currentHistory, event] });
  };


  if (currentView === 'patient' && selectedPatientId) {
    const patient = patients.find(p => p.id === selectedPatientId);
    if (patient) {
      return (
        <PatientMonitoringPage
          patient={patient}
          vitals={vitalsMap[selectedPatientId] || []}
          notes={notesMap[selectedPatientId] || []}
          history={historyMap[selectedPatientId] || []}
          dietaryOrder={dietaryMap[selectedPatientId]}
          onBack={() => setCurrentView('dashboard')}
          onAddVital={handleAddVital}
          onAddNote={handleAddNote}
          onUpdateDietary={handleUpdateDietary}
        />
      );
    }
  }

  return (
    <MonitoringDashboard
      patients={patients}
      onSelectPatient={handleSelectPatient}
    />
  );
};

export default Monitoring;
