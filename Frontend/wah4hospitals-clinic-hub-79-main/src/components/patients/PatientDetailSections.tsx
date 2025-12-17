import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Phone, Briefcase, LucideIcon } from 'lucide-react';
import type { Patient } from '../../types/patient';
import { regions, provinces, cities } from '../../data/addressData';

// Generic card wrapper
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

// Individual field display
interface DetailItemProps {
  label: string;
  value: string | number | null | undefined;
  className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, className = 'font-medium' }) => (
  <div className="space-y-1">
    <span className="text-gray-600 text-xs">{label}:</span>
    <p className={className}>{value ?? 'N/A'}</p>
  </div>
);

// Utility: Calculate age
const calculateAge = (dob: string) => {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// Utility: Format full address
const formatAddress = (patient: Patient) => {
  const parts: string[] = [];
  if (patient.house_no_street) parts.push(patient.house_no_street);
  if (patient.barangay) parts.push(patient.barangay);

  const cityName =
    cities[patient.province]?.find(c => c.code === patient.city_municipality)?.name ||
    patient.city_municipality;
  if (cityName) parts.push(cityName);

  const provinceName =
    provinces[patient.region]?.find(p => p.code === patient.province)?.name || patient.province;
  if (provinceName) parts.push(provinceName);

  const regionName = regions.find(r => r.code === patient.region)?.name || patient.region;
  if (regionName) parts.push(regionName);

  return parts.join(', ');
};

// -------------------- Patient Detail Cards --------------------

export const PersonalInfoCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <DetailCard title="Personal Information" icon={Calendar} iconColor="text-blue-600">
    <div className="space-y-3 text-sm">
      <DetailItem
        label="Full Name"
        value={`${patient.last_name}, ${patient.first_name} ${patient.middle_name ?? ''} ${patient.suffix ?? ''}`}
      />
      <DetailItem label="Date of Birth" value={patient.date_of_birth} />
      <DetailItem label="Age" value={`${calculateAge(patient.date_of_birth)} years old`} />
      <DetailItem label="Sex" value={patient.sex === 'M' ? 'Male' : 'Female'} />
      <DetailItem label="Civil Status" value={patient.civil_status} />
      <DetailItem label="Nationality" value={patient.nationality} />
    </div>
  </DetailCard>
);

export const ContactInfoCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <DetailCard title="Contact Information" icon={Phone} iconColor="text-green-600">
    <div className="space-y-3 text-sm">
      <DetailItem label="Mobile Number" value={patient.mobile_number} />
      <DetailItem label="Telephone" value={patient.telephone} />
      <DetailItem label="Email" value={patient.email} />
      <DetailItem label="Address" value={formatAddress(patient)} />
    </div>
  </DetailCard>
);

export const OccupationCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <DetailCard title="Occupation" icon={Briefcase} iconColor="text-purple-600">
    <div className="text-sm">
      <p className="text-gray-700">{patient.occupation ?? 'Not specified'}</p>
    </div>
  </DetailCard>
);

export const IdentificationCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <DetailCard title="Identification & Status" icon={Briefcase} iconColor="text-indigo-600">
    <div className="space-y-3 text-sm">
      <DetailItem label="PhilHealth ID" value={patient.philhealth_id} className="font-medium font-mono" />
      {patient.national_id && <DetailItem label="National ID" value={patient.national_id} className="font-medium font-mono" />}
      <DetailItem label="Status" value={patient.status} />
    </div>
  </DetailCard>
);
