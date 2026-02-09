import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users } from 'lucide-react';
import { Patient, BillingRecord } from './types';

interface PatientSelectorProps {
    show: boolean;
    admittedPatients: any[];
    billingRecords: BillingRecord[];
    onSelect: (patient: Patient) => void;
    onCancel: () => void;
    onShow: () => void;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({ 
    show, 
    admittedPatients, 
    billingRecords, 
    onSelect, 
    onCancel,
    onShow
}) => {
    if (!show) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Billing Management</CardTitle>
                        <Button
                            onClick={onShow}
                            className="flex items-center gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Create New Bill
                        </Button>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Select Patient for Billing</CardTitle>
                    <Button
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {admittedPatients.length === 0 ? (
                        <Alert>
                            <AlertDescription>
                                No admitted patients found. Patients must be admitted first before creating a bill.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        admittedPatients.map((admission: any, index: number) => {
                            const patientName = admission.patient_summary?.full_name ||
                                admission.patient_summary?.first_name + ' ' + admission.patient_summary?.last_name ||
                                admission.patient_details?.first_name + ' ' + admission.patient_details?.last_name ||
                                'Unknown Patient';

                            const alreadyBilled = billingRecords.some(b =>
                                b.hospitalId === admission.admission_id ||
                                b.patientId === admission.patient_id
                            );

                            // Helper to construct Patient object
                            const constructPatient = () => {
                                const patientData = admission.patient_summary || admission.patient_details || {};

                                // Calculate age
                                let age = 0;
                                if (patientData.birthdate || patientData.date_of_birth) {
                                    const birthDate = new Date(patientData.birthdate || patientData.date_of_birth);
                                    const today = new Date();
                                    age = today.getFullYear() - birthDate.getFullYear();
                                    const monthDiff = today.getMonth() - birthDate.getMonth();
                                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                        age--;
                                    }
                                }

                                // Robust Patient ID extraction
                                let patientId = 0;
                                if (admission.subject_id) {
                                    patientId = admission.subject_id;
                                } else if (typeof admission.patient === 'number') {
                                    patientId = admission.patient;
                                } else if (typeof admission.patient === 'string' && !isNaN(parseInt(admission.patient))) {
                                    patientId = parseInt(admission.patient);
                                } else if (admission.patient_summary?.id) {
                                     patientId = admission.patient_summary.id;
                                }

                                return {
                                    id: patientId,
                                    patientName: patientName,
                                    room: admission.location_summary?.name || admission.location_status || admission.room || admission.ward || admission.bed || 'N/A',
                                    admissionDate: admission.period_start || admission.admission_date || '',
                                    dischargeDate: admission.period_end || admission.discharge_date,
                                    condition: admission.reason_code || admission.admitting_diagnosis || admission.diagnosis || '',
                                    physician: admission.practitioner_summary?.full_name || admission.attending_physician || '',
                                    department: admission.service_type || admission.department || '',
                                    age: age,
                                    status: 'ready' as const
                                };
                            };

                            return (
                                <div
                                    key={admission.id || admission.encounter_id || index}
                                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${alreadyBilled
                                        ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                                        : 'hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
                                        }`}
                                    onClick={() => {
                                        const p = constructPatient();
                                        onSelect(p);
                                    }}
                                >
                                    <div>
                                        <p className="font-bold text-lg">{patientName}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <span className="font-medium">Admitted:</span> {(() => {
                                                const d = admission.period_start || admission.admission_date;
                                                if (!d) return 'N/A';
                                                const date = new Date(d);
                                                return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                                            })()}
                                            {admission.period_end && (() => {
                                                const d = new Date(admission.period_end);
                                                return !isNaN(d.getTime()) ? ` • Discharged: ${d.toLocaleDateString()}` : '';
                                            })()}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <span className="font-medium">Diagnosis:</span> {admission.reason_code || admission.admitting_diagnosis || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium">Room:</span> {admission.location_summary?.name || admission.location_status || admission.room || admission.ward || 'N/A'}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={alreadyBilled}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!alreadyBilled) {
                                                const p = constructPatient();
                                                onSelect(p);
                                            }
                                        }}
                                    >
                                        {alreadyBilled ? 'View Bill' : 'Select'}
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
