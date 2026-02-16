import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, FileText, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import type { DischargeRequirements } from '@/types/discharge';

interface PendingItem {
  id: string;
  name: string;
  status: 'completed' | 'missing' | 'pending';
  description: string;
  required: boolean;
}

interface PendingItemsSectionProps {
  requirements: DischargeRequirements;
  onRequirementChange?: (requirement: keyof DischargeRequirements, checked: boolean) => void;
  className?: string;
}

export const PendingItemsSection: React.FC<PendingItemsSectionProps> = ({
  requirements,
  onRequirementChange,
  className = ""
}) => {
  const pendingItems: PendingItem[] = [
    {
      id: 'billing_cleared',
      name: 'Billing Clearance',
      status: requirements.billing_cleared ? 'completed' : 'missing',
      description: 'Billing department clearance for discharge',  
      required: true
    },
    {
      id: 'medication_reconciliation',
      name: 'Medication Reconciliation',
      status: requirements.medication_reconciliation ? 'completed' : 'missing',
      description: 'Complete medication reconciliation and discharge prescriptions',
      required: true
    },
    {
      id: 'nursing_notes',
      name: 'Nursing Notes',
      status: requirements.nursing_notes ? 'completed' : 'missing',
      description: 'Final nursing assessment and care notes',
      required: false
    }
  ];

  const missingRequired = pendingItems.filter(item => item.required && item.status === 'missing');
  const pendingOptional = pendingItems.filter(item => !item.required && item.status !== 'completed');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'missing': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Completed</Badge>;
      case 'missing': return <Badge variant="destructive" className="border-none">Missing</Badge>;
      default: return <Badge variant="secondary" className="border-none">Pending</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3 text-center">
        <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          External Module Requirements
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
              className={`flex flex-col sm:flex-row sm:items-start justify-between p-3 rounded-lg border transition-colors gap-3 ${
                item.status === 'missing' && item.required
                  ? 'border-destructive/20 bg-destructive/5'
                  : item.status === 'completed'
                  ? 'border-green-200 bg-green-50'
                  : 'border-muted bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {onRequirementChange ? (
                    <Checkbox 
                      id={item.id}
                      checked={item.status === 'completed'}
                      onCheckedChange={(checked) => onRequirementChange(item.id as keyof DischargeRequirements, !!checked)}
                      className="w-5 h-5"
                    />
                  ) : (
                    getStatusIcon(item.status)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label 
                      htmlFor={item.id}
                      className={`font-medium cursor-pointer ${item.required ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {item.name}
                      {item.required && <span className="text-destructive">*</span>}
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div className="self-end sm:self-center">
                {getStatusBadge(item.status)}
              </div>
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