import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Phone, Briefcase, Home, Heart, LucideIcon } from 'lucide-react';
import type { Patient } from '../../types/patient';

interface DetailCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  children: React.ReactNode;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, icon: Icon, iconColor, children }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h4 className="font-semibold">{title}</h4>
      </div>
      {children}
    </CardContent>
  </Card>
);

interface DetailItemProps {
  label: string;
  value: string | number;
  className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, className = "font-medium" }) => (
  <div className="space-y-1">
    <span className="text-gray-600 text-xs">{label}:</span>
    <p className={className}>{value}</p>
  </div>
);

export const PersonalInfoCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <DetailCard title="Personal Information" icon={Calendar} iconColor="text-blue-600">
    <div className="space-y-3 text-sm">
      <DetailItem label="First Name" value={patient.name.split(' ')[0]} />
      <DetailItem label="Last Name" value={patient.name.split(' ').slice(1).join(' ')} />
      <DetailItem label="Age" value={`${patient.age} years old`} />
      <DetailItem label="Gender" value={patient.gender} />
      <DetailItem label="Civil Status" value={patient.civil_status} />
    </div>
  </DetailCard>
);

export const ContactInfoCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <DetailCard title="Contact Information" icon={Phone} iconColor="text-green-600">
    <div className="space-y-3 text-sm">
      <DetailItem label="Contact Number" value={patient.phone} />
      {/* Note: Email is not in the Patient type definition, handling gracefully if it exists in data but not type */}
      <DetailItem label="Email" value={(patient as any).email || 'Not provided'} />
      <DetailItem label="Complete Address" value={patient.address} />
    </div>
  </DetailCard>
);

export const OccupationCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <DetailCard title="Occupation" icon={Briefcase} iconColor="text-purple-600">
    <div className="text-sm">
      <p className="text-gray-700">{patient.occupation}</p>
    </div>
  </DetailCard>
);

export const RoomCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <DetailCard title="Room Assignment" icon={Home} iconColor="text-orange-600">
    <div className="text-sm space-y-2">
      <DetailItem label="Room" value={patient.room} />
      <DetailItem label="Department" value={patient.department} />
    </div>
  </DetailCard>
);

export const MedicalInfoCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <DetailCard title="Medical Information" icon={Heart} iconColor="text-red-600">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="space-y-3">
        <DetailItem label="Admission Date" value={patient.admission_date} />
        <DetailItem label="Condition" value={patient.condition} />
        <DetailItem label="Attending Physician" value={patient.physician} />
      </div>
      <div className="space-y-3">
        <DetailItem 
          label="PhilHealth Member" 
          value={patient.philhealth_id && patient.philhealth_id !== 'Not provided' ? 'Yes' : 'No'} 
        />
        {patient.philhealth_id && patient.philhealth_id !== 'Not provided' && (
          <DetailItem label="PhilHealth ID" value={patient.philhealth_id} className="font-medium font-mono" />
        )}
        <DetailItem label="Reason for Visit" value={(patient as any).reasonForVisit || 'Not specified'} />
      </div>
    </div>
  </DetailCard>
);
