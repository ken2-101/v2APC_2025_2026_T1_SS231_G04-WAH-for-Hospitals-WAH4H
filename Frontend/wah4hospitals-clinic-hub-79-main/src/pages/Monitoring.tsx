import React, { useState } from 'react';
import { MonitoringPatient, VitalSign, ClinicalNote, DietaryOrder, HistoryEvent } from '../types/monitoring';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { PatientMonitoringPage } from '@/components/monitoring/PatientMonitoringPage';

interface MonitoringProps {
  patients: MonitoringPatient[];
  vitalsMap: Record<string, VitalSign[]>;
  notesMap: Record<string, ClinicalNote[]>;
  dietaryMap: Record<string, DietaryOrder>;
  historyMap: Record<string, HistoryEvent[]>;
}

export const Monitoring: React.FC<MonitoringProps> = ({
  patients,
  vitalsMap,
  notesMap,
  dietaryMap,
  historyMap
}) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'patient'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const handleSelectPatient = (p: MonitoringPatient) => {
    setSelectedPatientId(p.id);
    setCurrentView('patient');
  };

  const handleAddVital = (newVital: VitalSign) => {
    if (!selectedPatientId) return;

    // Add to backend via API call here if needed

    // Local update (optional if frontend needs immediate update)
    const currentList = vitalsMap[selectedPatientId] || [];
    vitalsMap[selectedPatientId] = [...currentList, newVital];
  };

  const handleAddNote = (newNote: ClinicalNote) => {
    if (!selectedPatientId) return;

    const currentList = notesMap[selectedPatientId] || [];
    notesMap[selectedPatientId] = [...currentList, newNote];
  };

  const handleUpdateDietary = (order: DietaryOrder) => {
    if (!selectedPatientId) return;
    dietaryMap[selectedPatientId] = order;
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

  return <MonitoringDashboard patients={patients} onSelectPatient={handleSelectPatient} />;
};

export default Monitoring;
