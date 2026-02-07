import React, { useState, useEffect } from 'react';
import { X, Search, User, MapPin, CheckCircle, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { admissionService } from '@/services/admissionService';
import { NewAdmission } from '@/types/admission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

// ... (Interface props remain same)
interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; 
}

const INITIAL_FORM: NewAdmission = {
  patientId: '',
  patientName: '',
  admissionDate: new Date().toISOString().slice(0, 16),
  physician: '',
  serviceType: '',
  diagnosis: '',
  priority: 'routine',
  location: { building: '', ward: '', room: '', bed: '' },
  admitSource: 'Emergency Room',
  dietPreference: [],
  specialArrangements: []
};

const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<NewAdmission>(INITIAL_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locations, setLocations] = useState<any>(null);
  const [availableWards, setAvailableWards] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep(1); setFormData(INITIAL_FORM); setSearchQuery(''); setSearchResults([]);
      admissionService.getLocations().then(setLocations);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    const results = await admissionService.searchPatients(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const selectPatient = (p: any) => {
    setFormData(prev => ({ ...prev, patientId: p.patientId, patientName: p.name }));
    setStep(2);
  };

  const handleLocationChange = (level: string, value: string) => {
    setFormData(prev => ({ ...prev, location: { ...prev.location, [level]: value } }));
    if (!locations) return;

    if (level === 'building') {
       const wings = locations.wings[value] || [];
       const firstWing = wings[0]?.code; // Simplified for prototype
       setAvailableWards(locations.wards[firstWing] || []);
       setAvailableRooms([]);
       setAvailableBeds([]);
    } else if (level === 'ward') {
       const corridors = locations.corridors[value] || [];
       const rooms = corridors.flatMap((c: any) => locations.rooms[c.code] || []);
       setAvailableRooms(rooms);
    } else if (level === 'room') {
       const roomObj = availableRooms.find(r => r.code === value);
       if (roomObj) {
         setAvailableBeds(Array.from({ length: roomObj.beds }, (_, i) => ({
           code: String.fromCharCode(65 + i), status: i < roomObj.occupied ? 'occupied' : 'available'
         })));
       }
    }
  };

  const handleSubmit = async () => {
    await admissionService.create(formData);
    onSuccess?.(); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border-0 overflow-hidden bg-white rounded-2xl">
        
        {/* Header with UCD Stepper */}
        <div className="bg-white border-b border-slate-100 p-6 pb-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">New Admission</h2>
              <p className="text-sm text-slate-500">Follow the steps to admit a patient.</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="flex justify-between items-center px-4 relative">
             <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10" />
             {[1, 2, 3, 4].map((s) => (
               <div key={s} className={`flex flex-col items-center gap-2 bg-white px-2 z-10 ${s <= step ? 'text-blue-600' : 'text-slate-400'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${s <= step ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                   {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                 </div>
                 <span className="text-xs font-semibold uppercase tracking-wider">{['Find Patient', 'Details', 'Bed', 'Confirm'][s-1]}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          
          {step === 1 && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <Input placeholder="Search by name, ID, or birth date..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-12 py-7 text-lg shadow-sm border-slate-200" autoFocus onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <Button onClick={handleSearch} className="absolute right-2 top-2 h-10 bg-blue-600 hover:bg-blue-700">Search</Button>
              </div>
              
              <div className="space-y-3">
                {searchResults.map(p => (
                  <div key={p.id} onClick={() => selectPatient(p)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-lg">{p.name}</h4>
                      <div className="flex gap-4 text-sm text-slate-500 mt-1">
                        <span className="bg-slate-100 px-2 rounded">ID: {p.patientId}</span>
                        <span>{p.dob}</span>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                  </div>
                ))}
                {searchQuery && !isSearching && searchResults.length === 0 && <div className="text-center text-slate-400 py-10">No patients found.</div>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600"><User className="w-5 h-5" /></div>
                <div><div className="text-xs uppercase font-bold text-blue-400">Admitting</div><div className="font-bold text-blue-900">{formData.patientName}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Priority</label><select className="w-full p-2.5 bg-white border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option></select></div>
                <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Service</label><select className="w-full p-2.5 bg-white border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}><option value="">Select...</option><option value="Cardiology">Cardiology</option><option value="General Medicine">General Medicine</option></select></div>
                <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Physician</label><select className="w-full p-2.5 bg-white border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500" value={formData.physician} onChange={e => setFormData({...formData, physician: e.target.value})}><option value="">Select...</option><option value="Dr. John Smith">Dr. John Smith</option><option value="Dr. Sarah Johnson">Dr. Sarah Johnson</option></select></div>
                <div className="col-span-2 space-y-2"><label className="text-sm font-medium text-slate-700">Diagnosis</label><textarea className="w-full p-3 bg-white border border-slate-200 rounded-md h-24 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Initial diagnosis..." value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
               <div className="grid grid-cols-2 gap-6">
                 {/* Simplified Selects for brevity, add styling as above */}
                 <div className="space-y-2"><label className="text-sm font-bold">Building</label><select className="w-full p-3 border rounded-lg bg-white" value={formData.location.building} onChange={e => handleLocationChange('building', e.target.value)}><option value="">Select...</option>{locations?.buildings?.map((b:any)=><option key={b.code} value={b.code}>{b.name}</option>)}</select></div>
                 <div className="space-y-2"><label className="text-sm font-bold">Ward</label><select className="w-full p-3 border rounded-lg bg-white" value={formData.location.ward} onChange={e => handleLocationChange('ward', e.target.value)} disabled={!formData.location.building}><option value="">Select...</option>{availableWards.map((w:any)=><option key={w.code} value={w.code}>{w.name}</option>)}</select></div>
                 <div className="col-span-2 space-y-2"><label className="text-sm font-bold">Room</label><select className="w-full p-3 border rounded-lg bg-white" value={formData.location.room} onChange={e => handleLocationChange('room', e.target.value)} disabled={!formData.location.ward}><option value="">Select...</option>{availableRooms.map((r:any)=><option key={r.code} value={r.code}>{r.name} ({r.occupied}/{r.beds} Occupied)</option>)}</select></div>
               </div>
               
               {/* Bed Grid */}
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Select Bed</label>
                 <div className="grid grid-cols-4 gap-3">
                   {availableBeds.length > 0 ? availableBeds.map((bed:any) => (
                     <button key={bed.code} disabled={bed.status !== 'available'} onClick={() => handleLocationChange('bed', bed.code)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.location.bed === bed.code ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300' : bed.status === 'available' ? 'bg-white hover:border-blue-400 text-slate-600' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                       <span className="font-bold text-lg">{bed.code}</span>
                       <span className="text-[10px] uppercase font-bold">{bed.status}</span>
                     </button>
                   )) : <div className="col-span-4 py-8 text-center bg-slate-100 rounded-xl border-dashed border-2 border-slate-200 text-slate-400">Select a room first</div>}
                 </div>
               </div>
            </div>
          )}

          {step === 4 && (
             <div className="max-w-xl mx-auto space-y-6 text-center animate-in zoom-in-95 duration-300">
               <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4"><CheckCircle className="w-10 h-10" /></div>
               <h3 className="text-2xl font-bold text-slate-900">Ready to Admit</h3>
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left space-y-4">
                 <div className="flex justify-between border-b pb-4"><span className="text-slate-500">Patient</span><span className="font-bold text-slate-900">{formData.patientName}</span></div>
                 <div className="flex justify-between border-b pb-4"><span className="text-slate-500">Physician</span><span className="font-bold text-slate-900">{formData.physician}</span></div>
                 <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-bold text-blue-600">{formData.location.ward} • Room {formData.location.room}-{formData.location.bed}</span></div>
               </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between">
          {step > 1 ? <Button variant="outline" onClick={() => setStep(step-1)}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button> : <div/>}
          <Button onClick={step === 4 ? handleSubmit : () => setStep(step+1)} className={step === 4 ? "bg-emerald-600 hover:bg-emerald-700 w-40" : "bg-blue-600 hover:bg-blue-700 w-32"} disabled={step===1 && !formData.patientId}>{step === 4 ? "Confirm" : "Next"}</Button>
        </div>
      </Card>
    </div>
  );
};

export default AdmitPatientModal;