import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Check, AlertCircle, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface SubmitClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (claimData: any) => void;
}

export const SubmitClaimModal: React.FC<SubmitClaimModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    claimType: '',
    admissionDate: '',
    dischargeDate: '',
    icd10Code: '',
    rvsCode: '',
    finalDiagnosis: '',
    hospitalBill: '',
  });

  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    cf1: null,
    cf2: null,
    soa: null,
    clinicalAbstract: null,
    opdForm: null,
  });

  const [estimatedDeduction, setEstimatedDeduction] = useState<number | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        patientName: '',
        patientId: '',
        claimType: '',
        admissionDate: '',
        dischargeDate: '',
        icd10Code: '',
        rvsCode: '',
        finalDiagnosis: '',
        hospitalBill: '',
      });
      setDocuments({
        cf1: null,
        cf2: null,
        soa: null,
        clinicalAbstract: null,
        opdForm: null,
      });
      setEstimatedDeduction(null);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      setDocuments(prev => ({ ...prev, [docType]: file }));
    }
  };

  const removeFile = (docType: string) => {
    setDocuments(prev => ({ ...prev, [docType]: null }));
  };

  const calculateBenefit = () => {
    const bill = parseFloat(formData.hospitalBill);
    if (isNaN(bill)) return;

    // Simplified calculation logic for demo
    let deduction = 0;
    if (formData.claimType === 'ACR') {
      deduction = bill * 0.30; // 30% for ACR
    } else if (formData.claimType === 'Z-Benefit') {
      deduction = bill * 0.50; // 50% for Z-Benefit
    } else {
      deduction = bill * 0.20; // Default
    }
    
    // Cap deduction based on case rates (mock logic)
    const maxDeduction = 50000; 
    setEstimatedDeduction(Math.min(deduction, maxDeduction));
  };

  useEffect(() => {
    if (formData.hospitalBill && formData.claimType) {
      calculateBenefit();
    }
  }, [formData.hospitalBill, formData.claimType]);

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.patientName || !formData.claimType || !formData.finalDiagnosis) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate required documents
    if (!documents.cf1 || !documents.cf2) {
      toast.error('CF1 and CF2 documents are required');
      return;
    }

    const claimData = {
      ...formData,
      documents,
      estimatedDeduction,
      dateSubmitted: new Date().toISOString().split('T')[0],
      status: 'pending',
      id: `PH-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      hospitalName: 'Metro General Hospital', // Default
      procedure: formData.finalDiagnosis, // Map diagnosis to procedure for list view
      amount: `₱${estimatedDeduction?.toLocaleString() || '0'}`,
    };

    onSubmit(claimData);
    onClose();
    toast.success('Claim submitted successfully');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Submit New PhilHealth Claim
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Patient & Case Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name *</Label>
                  <Input id="patientName" name="patientName" value={formData.patientName} onChange={handleInputChange} placeholder="Last Name, First Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient ID / PIN</Label>
                  <Input id="patientId" name="patientId" value={formData.patientId} onChange={handleInputChange} placeholder="00-000000000-0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admissionDate">Admission Date</Label>
                  <Input id="admissionDate" name="admissionDate" type="date" value={formData.admissionDate} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dischargeDate">Discharge Date</Label>
                  <Input id="dischargeDate" name="dischargeDate" type="date" value={formData.dischargeDate} onChange={handleInputChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimType">Claim Type *</Label>
                <Select onValueChange={(value) => handleSelectChange('claimType', value)} value={formData.claimType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select claim type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Case Rates">All Case Rates (ACR)</SelectItem>
                    <SelectItem value="Z-Benefit">Z-Benefit Package</SelectItem>
                    <SelectItem value="Maternity">Maternity Care</SelectItem>
                    <SelectItem value="Outpatient">Outpatient Benefit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Medical Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icd10Code">ICD-10 Code</Label>
                  <Input id="icd10Code" name="icd10Code" value={formData.icd10Code} onChange={handleInputChange} placeholder="e.g., J00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rvsCode">RVS Code</Label>
                  <Input id="rvsCode" name="rvsCode" value={formData.rvsCode} onChange={handleInputChange} placeholder="e.g., 99201" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalDiagnosis">Final Diagnosis *</Label>
                <Textarea id="finalDiagnosis" name="finalDiagnosis" value={formData.finalDiagnosis} onChange={handleInputChange} placeholder="Enter complete final diagnosis" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalBill">Total Hospital Bill</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                  <Input className="pl-7" id="hospitalBill" name="hospitalBill" type="number" value={formData.hospitalBill} onChange={handleInputChange} placeholder="0.00" />
                </div>
              </div>

              {estimatedDeduction !== null && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Estimated PhilHealth Deduction</span>
                    </div>
                    <span className="text-xl font-bold text-blue-700">₱{estimatedDeduction.toLocaleString()}</span>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Document Upload</h3>
              <p className="text-sm text-gray-500">Please upload the required documents in PDF format.</p>

              <div className="space-y-3">
                {[
                  { id: 'cf1', label: 'Claim Form 1 (CF1) *' },
                  { id: 'cf2', label: 'Claim Form 2 (CF2) *' },
                  { id: 'soa', label: 'Statement of Account (SOA)' },
                  { id: 'clinicalAbstract', label: 'Clinical Abstract' },
                  { id: 'opdForm', label: 'OPD Form (if applicable)' },
                ].map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md border">
                        <FileText className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doc.label}</p>
                        {documents[doc.id] ? (
                          <p className="text-xs text-green-600 flex items-center mt-1">
                            <Check className="w-3 h-3 mr-1" /> {documents[doc.id]?.name}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">No file selected</p>
                        )}
                      </div>
                    </div>
                    
                    {documents[doc.id] ? (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(doc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="relative">
                        <Input 
                          type="file" 
                          accept=".pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => handleFileChange(e, doc.id)}
                        />
                        <Button variant="outline" size="sm" className="pointer-events-none">
                          <Upload className="w-4 h-4 mr-2" /> Upload
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Submit Claim</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
