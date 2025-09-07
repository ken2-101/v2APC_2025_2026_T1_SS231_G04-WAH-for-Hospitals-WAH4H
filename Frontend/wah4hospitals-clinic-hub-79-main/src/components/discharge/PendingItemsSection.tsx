import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface PendingItem {
  id: string;
  name: string;
  status: 'missing' | 'completed' | 'pending';
  description: string;
  required: boolean;
}

interface DischargeRequirements {
  finalDiagnosis: boolean;
  physicianSignature: boolean;
  medicationReconciliation: boolean;
  dischargeSummary: boolean;
  billingClearance: boolean;
  nursingNotes: boolean;
  followUpScheduled: boolean;
}

interface PendingItemsSectionProps {
  requirements: DischargeRequirements;
  className?: string;
}

export const PendingItemsSection: React.FC<PendingItemsSectionProps> = ({
  requirements,
  className = ""
}) => {
  const pendingItems: PendingItem[] = [
    {
      id: 'final-diagnosis',
      name: 'Final Diagnosis',
      status: requirements.finalDiagnosis ? 'completed' : 'missing',
      description: 'Complete final diagnosis documentation required',
      required: true
    },
    {
      id: 'physician-signature',
      name: 'Physician Signature',
      status: requirements.physicianSignature ? 'completed' : 'missing',
      description: 'Attending physician signature on discharge orders',
      required: true
    },
    {
      id: 'medication-reconciliation',
      name: 'Medication Reconciliation',
      status: requirements.medicationReconciliation ? 'completed' : 'missing',
      description: 'Complete medication reconciliation and discharge prescriptions',
      required: true
    },
    {
      id: 'discharge-summary',
      name: 'Discharge Summary',
      status: requirements.dischargeSummary ? 'completed' : 'missing',
      description: 'Complete discharge summary with treatment details',
      required: true
    },
    {
      id: 'billing-clearance',
      name: 'Billing Clearance',
      status: requirements.billingClearance ? 'completed' : 'missing',
      description: 'Billing department clearance for discharge',
      required: true
    },
    {
      id: 'nursing-notes',
      name: 'Nursing Notes',
      status: requirements.nursingNotes ? 'completed' : 'missing',
      description: 'Final nursing assessment and care notes',
      required: false
    },
    {
      id: 'follow-up',
      name: 'Follow-up Scheduled',
      status: requirements.followUpScheduled ? 'completed' : 'pending',
      description: 'Follow-up appointments scheduled if required',
      required: false
    }
  ];

  const missingRequired = pendingItems.filter(item => item.required && item.status === 'missing');
  const completedItems = pendingItems.filter(item => item.status === 'completed');
  const pendingOptional = pendingItems.filter(item => !item.required && item.status !== 'completed');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'missing':
        return <X className="w-4 h-4 text-destructive" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'missing':
        return <Badge className="bg-destructive/10 text-destructive">Missing</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Discharge Checklist
          <Badge variant="outline" className="ml-auto">
            {completedItems.length} / {pendingItems.length} Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {missingRequired.length > 0 && (
          <Alert className="border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-medium">
              {missingRequired.length} critical item(s) must be completed before discharge
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {pendingItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                item.status === 'missing' && item.required
                  ? 'border-destructive/20 bg-destructive/5'
                  : item.status === 'completed'
                  ? 'border-green-200 bg-green-50'
                  : 'border-muted bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(item.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${item.required ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.name}
                      {item.required && <span className="text-destructive">*</span>}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              {getStatusBadge(item.status)}
            </div>
          ))}
        </div>

        {missingRequired.length === 0 && pendingOptional.length === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              All required items completed. Patient is ready for discharge.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};