import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User } from 'lucide-react';
import { MonitoringPatient, VitalSign, ClinicalNote, DietaryOrder, HistoryEvent } from '../../types/monitoring';

import { VitalSignsTab } from './VitalSignsTab';
import { ClinicalNotesTab } from './ClinicalNotesTab';
import { DietaryTab } from './DietaryTab';
import { HistoryTab } from './HistoryTab';

interface PatientMonitoringPageProps {
    patient: MonitoringPatient;
    vitals: VitalSign[];
    notes: ClinicalNote[];
    history: HistoryEvent[];
    dietaryOrder?: DietaryOrder;
    onBack: () => void;
    onAddVital: (v: VitalSign) => void;
    onAddNote: (n: ClinicalNote) => void;
    onUpdateDietary: (d: DietaryOrder) => void;
}

export const PatientMonitoringPage: React.FC<PatientMonitoringPageProps> = ({
    patient, vitals, notes, history, dietaryOrder,
    onBack, onAddVital, onAddNote, onUpdateDietary
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{patient.patientName}</h1>
                    <div className="flex gap-4 text-sm text-gray-500">
                        <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {patient.id}</span>
                        <span className="font-medium text-gray-700">Room {patient.room}</span>
                        <span>Dr. {patient.doctorName}</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="vitals" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
                    <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                    <TabsTrigger value="dietary">Dietary / Orders</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="vitals" className="mt-6">
                    <VitalSignsTab vitals={vitals} onAddVital={onAddVital} patientId={patient.id} />
                </TabsContent>

                <TabsContent value="notes" className="mt-6">
                    <ClinicalNotesTab notes={notes} onAddNote={onAddNote} />
                </TabsContent>

                <TabsContent value="dietary" className="mt-6">
                    <DietaryTab order={dietaryOrder} onUpdateOrder={onUpdateDietary} />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <HistoryTab events={history} />
                </TabsContent>
            </Tabs>
        </div>
    );
};
