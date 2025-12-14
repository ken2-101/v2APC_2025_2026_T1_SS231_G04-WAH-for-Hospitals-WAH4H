import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Lock, Paperclip } from 'lucide-react';
import { ClinicalNote } from '../../types/monitoring';

interface ClinicalNotesTabProps {
    notes: ClinicalNote[];
    onAddNote: (note: ClinicalNote) => void;
}

export const ClinicalNotesTab: React.FC<ClinicalNotesTabProps> = ({ notes, onAddNote }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [type, setType] = useState<any>('SOAP');
    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');
    const [assessment, setAssessment] = useState('');
    const [plan, setPlan] = useState('');

    const handleSave = () => {
        const newNote: ClinicalNote = {
            id: Date.now().toString(),
            dateTime: new Date().toISOString(),
            type,
            subjective,
            objective,
            assessment,
            plan,
            providerName: 'Dr. Current User' // Mock
        };
        onAddNote(newNote);
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setSubjective(''); setObjective(''); setAssessment(''); setPlan('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Clinical Note
                </Button>
            </div>

            <div className="space-y-4">
                {notes.length === 0 && <p className="text-center text-gray-500 py-8">No clinical notes recorded yet.</p>}
                {notes.map((note) => (
                    <Card key={note.id} className="border-l-4 border-l-blue-600">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {note.type} Note
                                        <Badge variant="outline" className="font-normal text-xs">{new Date(note.dateTime).toLocaleString()}</Badge>
                                    </CardTitle>
                                    <p className="text-sm text-gray-500">By {note.providerName}</p>
                                </div>
                                <Lock className="w-4 h-4 text-gray-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm mt-2">
                            {note.type === 'SOAP' ? (
                                <>
                                    <div><span className="font-bold text-gray-700">S:</span> {note.subjective}</div>
                                    <div><span className="font-bold text-gray-700">O:</span> {note.objective}</div>
                                    <div><span className="font-bold text-gray-700">A:</span> {note.assessment}</div>
                                    <div><span className="font-bold text-gray-700">P:</span> {note.plan}</div>
                                </>
                            ) : (
                                <div className="whitespace-pre-wrap">{note.assessment}</div>
                            )}
                        </CardContent>
                        {/* Mock Attachment view */}
                        <CardFooter className="pt-2 border-t text-xs text-gray-400">
                            Signed electronically by {note.providerName}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>New Clinical Note</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label>Note Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SOAP">SOAP Note</SelectItem>
                                    <SelectItem value="Progress">Progress Note</SelectItem>
                                    <SelectItem value="Rounds">Rounds Note</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {type === 'SOAP' ? (
                            <>
                                <div>
                                    <Label>Subjective</Label>
                                    <Textarea value={subjective} onChange={e => setSubjective(e.target.value)} placeholder="Patient complaints, history..." className="h-20" />
                                </div>
                                <div>
                                    <Label>Objective</Label>
                                    <Textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="Physical exam findings, vitals..." className="h-20" />
                                </div>
                                <div>
                                    <Label>Assessment</Label>
                                    <Textarea value={assessment} onChange={e => setAssessment(e.target.value)} placeholder="Diagnosis, differential..." className="h-20" />
                                </div>
                                <div>
                                    <Label>Plan</Label>
                                    <Textarea value={plan} onChange={e => setPlan(e.target.value)} placeholder="Treatment, meds, follow-up..." className="h-20" />
                                </div>
                            </>
                        ) : (
                            <div>
                                <Label>Note Content</Label>
                                <Textarea value={assessment} onChange={e => setAssessment(e.target.value)} placeholder="Enter details..." className="h-40" />
                            </div>
                        )}

                        <div>
                            <Label>Attachments</Label>
                            <div className="border border-dashed rounded-md p-4 bg-gray-50 flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100">
                                <Paperclip className="w-4 h-4 mr-2" />
                                <span>Click to attach images (X-ray, etc.)</span>
                                {/* Mock input */}
                                <input type="file" className="hidden" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Finalize Note</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
