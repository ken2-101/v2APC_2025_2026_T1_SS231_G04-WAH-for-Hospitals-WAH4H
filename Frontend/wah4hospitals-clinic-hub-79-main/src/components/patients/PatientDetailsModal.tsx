
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, MapPin, Briefcase, Heart, Home, Phone, Calendar, Mail } from 'lucide-react';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ isOpen, onClose, patient }) => {
  if (!patient) return null;

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return patient.age;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

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
                {patient.name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{patient.name}</h3>
              <p className="text-gray-600">Patient ID: {patient.id}</p>
              <Badge className="mt-1">{patient.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold">Personal Information</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">First Name:</span>
                    <p className="font-medium">{patient.name.split(' ')[0]}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Last Name:</span>
                    <p className="font-medium">{patient.name.split(' ').slice(1).join(' ')}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Age:</span>
                    <p className="font-medium">{patient.age} years old</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Gender:</span>
                    <p className="font-medium">{patient.gender}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Civil Status:</span>
                    <p className="font-medium">{patient.civilStatus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold">Contact Information</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Contact Number:</span>
                    <p className="font-medium">{patient.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Email:</span>
                    <p className="font-medium">{patient.email || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Complete Address:</span>
                    <p className="font-medium">{patient.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold">Occupation</h4>
                </div>
                <div className="text-sm">
                  <p className="text-gray-700">{patient.occupation}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-4 h-4 text-orange-600" />
                  <h4 className="font-semibold">Room Assignment</h4>
                </div>
                <div className="text-sm space-y-2">
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Room:</span>
                    <p className="font-medium">{patient.room}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Department:</span>
                    <p className="font-medium">{patient.department}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-red-600" />
                <h4 className="font-semibold">Medical Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Admission Date:</span>
                    <p className="font-medium">{patient.admissionDate}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Condition:</span>
                    <p className="font-medium">{patient.condition}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Attending Physician:</span>
                    <p className="font-medium">{patient.physician}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">PhilHealth Member:</span>
                    <p className="font-medium">{patient.philhealthId !== 'Not provided' ? 'Yes' : 'No'}</p>
                  </div>
                  {patient.philhealthId !== 'Not provided' && (
                    <div className="space-y-1">
                      <span className="text-gray-600 text-xs">PhilHealth ID:</span>
                      <p className="font-medium font-mono">{patient.philhealthId}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs">Reason for Visit:</span>
                    <p className="font-medium">{patient.reasonForVisit || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
