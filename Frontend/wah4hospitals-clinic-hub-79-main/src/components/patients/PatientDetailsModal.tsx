
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import type { Patient } from '../../types/patient';
import {
  PersonalInfoCard,
  ContactInfoCard,
  OccupationCard,
  RoomCard,
  MedicalInfoCard
} from './PatientDetailSections';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ isOpen, onClose, patient }) => {
  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Patient Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {patient.name.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{patient.name}</h3>
              <p className="text-gray-600">Patient ID: {patient.id}</p>
              <Badge className="mt-1">{patient.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PersonalInfoCard patient={patient} />
            <ContactInfoCard patient={patient} />
            <OccupationCard patient={patient} />
            <RoomCard patient={patient} />
          </div>

          <MedicalInfoCard patient={patient} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

