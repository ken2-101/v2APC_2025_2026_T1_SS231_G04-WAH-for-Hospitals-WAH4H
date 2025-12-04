
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, User, Building2, Calendar, DollarSign, Check, Clock, X, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClaimDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: any;
}

export const ClaimDetailsModal: React.FC<ClaimDetailsModalProps> = ({ isOpen, onClose, claim }) => {
  if (!claim) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Claim Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-600 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{claim.id}</h3>
              <p className="text-sm text-gray-500">Ref: {claim.claimReferenceNumber || 'N/A'}</p>
              <p className="text-gray-600">{claim.patientName}</p>
              {getStatusBadge(claim.status)}
            </div>
          </div>

          {claim.returnToHospitalRemarks && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">Return to Hospital / Rejected</h4>
                <p className="text-red-800 text-sm mt-1">{claim.returnToHospitalRemarks}</p>
                <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Resubmit Documents
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold">Patient Information</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient Name:</span>
                    <span className="font-medium">{claim.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Claim Type:</span>
                    <span className="font-medium">{claim.claimType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Procedure:</span>
                    <span className="font-medium">{claim.procedure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Final Diagnosis:</span>
                    <span className="font-medium">{claim.finalDiagnosis || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ICD-10 Code:</span>
                    <span className="font-medium">{claim.icd10Code || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">RVS Code:</span>
                    <span className="font-medium">{claim.rvsCode || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold">Hospital Information</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hospital:</span>
                    <span className="font-medium">{claim.hospitalName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-lg">{claim.amount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold">Timeline</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Submitted:</span>
                    <span className="font-medium">{claim.dateSubmitted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Processed:</span>
                    <span className="font-medium">{claim.dateProcessed || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admission Date:</span>
                    <span className="font-medium">{claim.admissionDate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discharge Date:</span>
                    <span className="font-medium">{claim.dischargeDate || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                  <h4 className="font-semibold">Claim Status</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Status:</span>
                    <span className="font-medium">{getStatusBadge(claim.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="font-medium">
                      {claim.dateProcessed
                        ? `${Math.ceil((new Date(claim.dateProcessed).getTime() - new Date(claim.dateSubmitted).getTime()) / (1000 * 60 * 60 * 24))} days`
                        : 'In progress'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                <h4 className="font-semibold">Submitted Documents</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {claim.documents && Object.entries(claim.documents).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="uppercase text-gray-600">{key}</span>
                    {value ? (
                      <span className="text-green-600 flex items-center text-xs">
                        <Check className="w-3 h-3 mr-1" /> Submitted
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center text-xs">
                        <X className="w-3 h-3 mr-1" /> Missing
                      </span>
                    )}
                  </div>
                ))}
                {(!claim.documents || Object.keys(claim.documents).length === 0) && (
                  <p className="text-gray-500 italic">No documents recorded.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {claim.status === 'rejected' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <X className="w-4 h-4 text-red-600" />
                  <h4 className="font-semibold">Rejection Reason</h4>
                </div>
                <div className="text-sm">
                  <p className="text-gray-700">
                    This claim was rejected due to incomplete documentation. Please ensure all required medical records and supporting documents are submitted.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
