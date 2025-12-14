import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Printer, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { VitalSign } from '../../types/monitoring';

interface VitalSignsTabProps {
    vitals: VitalSign[];
    onAddVital: (vital: VitalSign) => void;
    patientId: string;
}

export const VitalSignsTab: React.FC<VitalSignsTabProps> = ({ vitals, onAddVital, patientId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'graph'>('graph');

    // Form State
    const [bpSys, setBpSys] = useState('');
    const [bpDia, setBpDia] = useState('');
    const [hr, setHr] = useState('');
    const [rr, setRr] = useState('');
    const [temp, setTemp] = useState('');
    const [o2, setO2] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    const handleSave = () => {
        const newVital: VitalSign = {
            id: Date.now().toString(),
            dateTime: new Date().toISOString(),
            bloodPressure: `${bpSys}/${bpDia}`,
            heartRate: Number(hr),
            respiratoryRate: Number(rr),
            temperature: Number(temp),
            oxygenSaturation: Number(o2),
            height: height ? Number(height) : undefined,
            weight: weight ? Number(weight) : undefined,
            staffName: 'Current User' // Mock
        };
        onAddVital(newVital);
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setBpSys(''); setBpDia(''); setHr(''); setRr(''); setTemp(''); setO2(''); setHeight(''); setWeight('');
    };

    const checkAlerts = (v: VitalSign) => {
        const alerts = [];
        const [sys, dia] = v.bloodPressure.split('/').map(Number);
        if (sys > 140 || sys < 90) alerts.push('Abnormal BP');
        if (v.heartRate > 100 || v.heartRate < 60) alerts.push('Abnormal HR');
        if (v.oxygenSaturation < 95) alerts.push('Low O2');
        return alerts;
    };

    // Prepare chart data
    const chartData = vitals.map(v => ({
        time: new Date(v.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hr: v.heartRate,
        temp: v.temperature,
        sys: Number(v.bloodPressure.split('/')[0]),
        dia: Number(v.bloodPressure.split('/')[1]),
        o2: v.oxygenSaturation
    })).slice(-10); // Last 10 points

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-x-2">
                    <Button variant={viewMode === 'graph' ? 'default' : 'outline'} onClick={() => setViewMode('graph')}>Graph View</Button>
                    <Button variant={viewMode === 'table' ? 'default' : 'outline'} onClick={() => setViewMode('table')}>Table View</Button>
                </div>
                <div className="space-x-2">
                    <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print Record</Button>
                    <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Record Vitals</Button>
                </div>
            </div>

            {vitals.length > 0 && checkAlerts(vitals[vitals.length - 1]).length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Vital Signs Alert</AlertTitle>
                    <AlertDescription>
                        Latest vitals indicate: {checkAlerts(vitals[vitals.length - 1]).join(', ')}. Please monitor closer.
                    </AlertDescription>
                </Alert>
            )}

            {viewMode === 'graph' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Blood Pressure & Heart Rate</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="sys" stroke="#FF5733" name="Sys BP" />
                                    <Line type="monotone" dataKey="dia" stroke="#FF8D1A" name="Dia BP" />
                                    <Line type="monotone" dataKey="hr" stroke="#C70039" name="Heart Rate" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Temperature & O2 Saturation</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis yAxisId="left" orientation="left" domain={[34, 42]} />
                                    <YAxis yAxisId="right" orientation="right" domain={[80, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#FFC300" name="Temp (°C)" />
                                    <Line yAxisId="right" type="monotone" dataKey="o2" stroke="#33FF57" name="O2 Sat (%)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date/Time</TableHead>
                                    <TableHead>BP</TableHead>
                                    <TableHead>HR</TableHead>
                                    <TableHead>RR</TableHead>
                                    <TableHead>Temp</TableHead>
                                    <TableHead>O2</TableHead>
                                    <TableHead>Staff</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vitals.map(v => (
                                    <TableRow key={v.id}>
                                        <TableCell>{new Date(v.dateTime).toLocaleString()}</TableCell>
                                        <TableCell className="font-medium">{v.bloodPressure}</TableCell>
                                        <TableCell>{v.heartRate}</TableCell>
                                        <TableCell>{v.respiratoryRate}</TableCell>
                                        <TableCell>{v.temperature}</TableCell>
                                        <TableCell>{v.oxygenSaturation}%</TableCell>
                                        <TableCell>{v.staffName}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Record Vital Signs</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div><Label>Systolic BP</Label><Input type="number" value={bpSys} onChange={e => setBpSys(e.target.value)} /></div>
                        <div><Label>Diastolic BP</Label><Input type="number" value={bpDia} onChange={e => setBpDia(e.target.value)} /></div>
                        <div><Label>Heart Rate</Label><Input type="number" value={hr} onChange={e => setHr(e.target.value)} /></div>
                        <div><Label>Resp Rate</Label><Input type="number" value={rr} onChange={e => setRr(e.target.value)} /></div>
                        <div><Label>Temp (°C)</Label><Input type="number" step="0.1" value={temp} onChange={e => setTemp(e.target.value)} /></div>
                        <div><Label>O2 Sat (%)</Label><Input type="number" value={o2} onChange={e => setO2(e.target.value)} /></div>
                        <div><Label>Height (cm) - Opt</Label><Input type="number" value={height} onChange={e => setHeight(e.target.value)} /></div>
                        <div><Label>Weight (kg) - Opt</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Record</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
