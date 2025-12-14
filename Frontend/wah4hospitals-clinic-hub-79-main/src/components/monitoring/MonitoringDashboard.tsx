import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Activity, FileText } from 'lucide-react';
import { MonitoringPatient } from '../../types/monitoring';

interface MonitoringDashboardProps {
    patients: MonitoringPatient[];
    onSelectPatient: (patient: MonitoringPatient) => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ patients, onSelectPatient }) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredPatients = patients.filter(p =>
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inpatient Clinical Monitoring</h1>
                    <p className="text-gray-600">Real-time status and ongoing care documentation</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Admitted Patients</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search patient, room, or doctor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-3">Patient / Room</th>
                                    <th className="px-4 py-3">Care Team</th>
                                    <th className="px-4 py-3">Last Vitals</th>
                                    <th className="px-4 py-3">Last Note</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPatients.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => onSelectPatient(patient)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-gray-900">{patient.patientName}</div>
                                            <div className="text-xs text-gray-500">Room {patient.room}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm">{patient.doctorName}</div>
                                            <div className="text-xs text-gray-500">Nurse: {patient.nurseName}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {patient.lastVitals ? (
                                                <div className="flex items-center text-sm">
                                                    <Activity className="w-3 h-3 mr-1 text-blue-500" />
                                                    <span>{patient.lastVitals.bloodPressure} | {patient.lastVitals.heartRate} bpm</span>
                                                </div>
                                            ) : <span className="text-gray-400 text-xs">No data</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {patient.lastNote ? (
                                                <div className="flex items-center text-sm">
                                                    <FileText className="w-3 h-3 mr-1 text-gray-500" />
                                                    <span className="truncate max-w-[150px]">{patient.lastNote.type} - {patient.lastNote.dateTime.split('T')[1]}</span>
                                                </div>
                                            ) : <span className="text-gray-400 text-xs">No notes</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={patient.status === 'Critical' ? 'destructive' : 'default'} className={patient.status === 'Stable' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                {patient.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="sm" variant="outline" onClick={() => onSelectPatient(patient)}>
                                                <FileText className="w-3 h-3 mr-1" />
                                                Open
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredPatients.length === 0 && (
                            <div className="text-center py-8 text-gray-500">No patients found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
