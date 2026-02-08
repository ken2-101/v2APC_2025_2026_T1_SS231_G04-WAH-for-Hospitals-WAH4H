import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, User, MapPin, CheckCircle, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { admissionService } from '@/services/admissionService';
import { NewAdmission } from '@/types/admission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LocationSelector } from './LocationSelector';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; 
  onNavigate?: (path: string) => void; 
}

const INITIAL_FORM: NewAdmission = {
  patientId: '',
  patientName: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  admissionTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  physician: '',
  serviceType: 'Internal Medicine',
  diagnosis: '',
  reasonForAdmission: '',
  priority: 'routine',
  encounterType: 'IMP',
  location: { building: '', ward: '', room: '', bed: '' },
  location_ids: [],
  admitSource: 'Physician Referral',
  preAdmissionIdentifier: '',
  isReadmission: false,
  dietPreference: [],
  specialArrangements: [],
  specialCourtesy: []
};

const MOCK_PHYSICIANS = [
  { id: 1, name: "Dr. Ana Cruz", license: "MD-12345", dept: "Internal Medicine" },
  { id: 2, name: "Dr. John Smith", license: "MD-67890", dept: "Cardiology" },
  { id: 3, name: "Dr. Sarah Lee", license: "MD-11111", dept: "Pediatrics" },
  { id: 4, name: "Dr. Mark Santos", license: "MD-22222", dept: "Surgery" },
];

const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<NewAdmission>(INITIAL_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locations, setLocations] = useState<any>(null);
  const [physicianSearch, setPhysicianSearch] = useState('');
  const [showPhysicianResults, setShowPhysicianResults] = useState(false);

  const [admissions, setAdmissions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep(1); setFormData(INITIAL_FORM); setSearchQuery(''); setSearchResults([]);
      
      // Fetch Locations and Admissions for real-time availability
      Promise.all([
        admissionService.getLocations(),
        admissionService.getAll()
      ]).then(([locData, admData]) => {
          if (locData && locData.buildings) setLocations(locData);
          if (admData) setAdmissions(admData);
      });

      // Load initial patients
      handleSearch('');
    }
  }, [isOpen]);

  // Allow calling with specific query or defaulting to state
  const handleSearch = async (query?: string) => {
    const q = typeof query === 'string' ? query : searchQuery;
    setIsSearching(true);
    try {
        const results = await admissionService.searchPatients(q);
        setSearchResults(Array.isArray(results) ? results : []);
    } catch (e) {
        setSearchResults([]);
    } finally {
        setIsSearching(false);
    }
  };

  const selectPatient = (p: any) => {
    setFormData(prev => ({ ...prev, patientId: p.id, patientName: p.name }));
    setStep(2);
  };

  const handleLocationChange = (level: string, value: string) => {
    setFormData(prev => {
      const newLoc = { ...prev.location, [level]: value };
      
      // Clear downstream if upstream changes
      if (level === 'building') { newLoc.ward = ''; newLoc.room = ''; newLoc.bed = ''; }
      if (level === 'ward') { newLoc.room = ''; newLoc.bed = ''; }
      if (level === 'room') { newLoc.bed = ''; }

      // Construct Path IDs
      const ids: any[] = [];
      if (newLoc.building) ids.push(newLoc.building);
      if (newLoc.ward) ids.push(newLoc.ward);
      if (newLoc.room) ids.push(newLoc.room);
      if (newLoc.bed) ids.push(newLoc.bed);

      return { ...prev, location: newLoc, location_ids: ids };
    });
  };

  const handleSubmit = async () => {
    try {
        await admissionService.create(formData);
        onSuccess?.(); 
        onClose();
    } catch (e) {
        console.error("Failed to admit patient", e);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
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
             {[1, 2, 3, 4, 5].map((s) => (
               <div key={s} className={`flex flex-col items-center gap-2 bg-white px-2 z-10 ${s <= step ? 'text-blue-600' : 'text-slate-400'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${s <= step ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                   {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                 </div>
                 <span className="text-xs font-semibold uppercase tracking-wider">{['Find Patient', 'Details', 'Care Team', 'Bed', 'Confirm'][s-1]}</span>
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
                <Button onClick={() => handleSearch()} className="absolute right-2 top-2 h-10 bg-blue-600 hover:bg-blue-700">Search</Button>
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
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
              
              {/* Header Card */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600"><User className="w-5 h-5" /></div>
                <div><div className="text-xs uppercase font-bold text-blue-400">Admitting</div><div className="font-bold text-blue-900">{formData.patientName}</div></div>
              </div>

              {/* Encounter Classification */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Encounter Classification</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Encounter Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: 'IMP', label: 'Inpatient (IMP)' },
                      { id: 'EMER', label: 'Emergency (EMER)' },
                      { id: 'AMB', label: 'Outpatient (AMB)' },
                      { id: 'HH', label: 'Home Health (HH)' }
                    ].map((type) => (
                      <div 
                        key={type.id} 
                        onClick={() => setFormData({...formData, encounterType: type.id as any})}
                        className={`p-3 rounded-lg border cursor-pointer text-center font-medium transition-all ${formData.encounterType === type.id ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        {type.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Service Type</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Priority Level <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: 'routine', label: 'Routine (R)', desc: 'Standard admission' },
                      { id: 'urgent', label: 'Urgent (UR)', desc: 'Needs prompt attention' },
                      { id: 'asap', label: 'ASAP (A)', desc: 'As soon as possible' }, 
                      { id: 'emergency', label: 'Emergency (EM)', desc: 'Life-threatening' }
                    ].map((p) => (
                      <div 
                        key={p.id} 
                        onClick={() => setFormData({...formData, priority: p.id === 'asap' ? 'urgent' : p.id as any})} 
                        className={`p-3 rounded-lg border cursor-pointer text-left transition-all ${formData.priority === (p.id === 'asap' ? 'urgent' : p.id) ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className={`font-bold ${formData.priority === (p.id === 'asap' ? 'urgent' : p.id) ? 'text-blue-700' : 'text-slate-700'}`}>{p.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Admission Details */}
              <div className="space-y-4">
                 <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Admission Details</h3>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Date <span className="text-red-500">*</span></label>
                      <Input type="date" value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Time <span className="text-red-500">*</span></label>
                      <Input type="time" value={formData.admissionTime} onChange={e => setFormData({...formData, admissionTime: e.target.value})} className="bg-white" />
                    </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Admission Diagnosis (ICD-10)</label>
                   <Input placeholder="Search ICD-10 code or description..." value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className="bg-white" />
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Reason for Admission</label>
                   <textarea className="w-full p-3 bg-white border border-slate-200 rounded-md h-24 outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" placeholder="Describe the reason for admission..." value={formData.reasonForAdmission} onChange={e => setFormData({...formData, reasonForAdmission: e.target.value})} />
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Admit Source</label>
                   <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.admitSource} onChange={e => setFormData({...formData, admitSource: e.target.value})}>
                     <option value="Physician Referral">Physician Referral</option>
                     <option value="Emergency Room">Emergency Room</option>
                     <option value="Clinic Referral">Clinic Referral</option>
                     <option value="Transfer">Transfer from Hospital</option>
                   </select>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Pre-Admission Identifier (Optional)</label>
                   <Input placeholder="For scheduled admissions" value={formData.preAdmissionIdentifier} onChange={e => setFormData({...formData, preAdmissionIdentifier: e.target.value})} className="bg-white" />
                 </div>
                 
                 <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="isReadmission"
                      checked={formData.isReadmission}
                      onChange={e => setFormData({...formData, isReadmission: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isReadmission" className="text-sm font-medium text-slate-700 cursor-pointer">This is a re-admission</label>
                 </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
              
              <div className="space-y-4">
                 <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2 flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /> Attending Physician & Staff</h3>
                 
                 <div className="space-y-2 relative">
                   <label className="text-sm font-semibold text-slate-700">Attending Physician <span className="text-red-500">*</span></label>
                   {!formData.physician ? (
                      <div className="relative">
                        <Input 
                          placeholder="Search physician name..." 
                          value={physicianSearch} 
                          onChange={e => { setPhysicianSearch(e.target.value); setShowPhysicianResults(true); }}
                          onFocus={() => setShowPhysicianResults(true)}
                          className="bg-white"
                        />
                        {showPhysicianResults && physicianSearch && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-lg rounded-md mt-1 z-20 max-h-48 overflow-y-auto">
                             {MOCK_PHYSICIANS.filter(p => p.name.toLowerCase().includes(physicianSearch.toLowerCase())).map(p => (
                               <div key={p.id} onClick={() => { setFormData({...formData, physician: p.name}); setPhysicianSearch(''); setShowPhysicianResults(false); }} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                                 <div className="font-bold text-slate-900">{p.name}</div>
                                 <div className="text-xs text-slate-500">{p.license} • {p.dept}</div>
                               </div>
                             ))}
                             {MOCK_PHYSICIANS.filter(p => p.name.toLowerCase().includes(physicianSearch.toLowerCase())).length === 0 && (
                               <div className="p-3 text-slate-400 text-sm">No physicians found.</div>
                             )}
                          </div>
                        )}
                      </div>
                   ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-blue-900">{formData.physician}</div>
                          <div className="text-xs text-blue-600">Primary Performer</div>
                        </div>
                        <button onClick={() => setFormData({...formData, physician: ''})} className="text-blue-400 hover:text-blue-600"><X className="w-4 h-4" /></button>
                      </div>
                   )}
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Participant Type</label>
                   <Input value="Primary Performer" disabled className="bg-slate-50 text-slate-500" />
                   <div className="text-xs text-slate-400">Auto-filled based on role</div>
                 </div>

                 <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-all text-sm font-bold flex items-center justify-center gap-2">
                   + Add Additional Staff Member
                 </button>
              </div>

              <div className="space-y-4">
                 <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Hospitalization Details</h3>
                 
                 <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Diet Preference</label>
                      <div className="space-y-2">
                        {['No restrictions', 'Low-sodium', 'Halal', 'Diabetic', 'Vegetarian', 'Other'].map(opt => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.dietPreference.includes(opt)} onChange={e => {
                               if (e.target.checked) setFormData({...formData, dietPreference: [...formData.dietPreference, opt]});
                               else setFormData({...formData, dietPreference: formData.dietPreference.filter(x => x !== opt)});
                            }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-slate-600">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Special Arrangements</label>
                      <div className="space-y-2">
                        {['Wheelchair', 'Oxygen', 'IV Pole', 'Translator', 'Monitors', 'Suction'].map(opt => (
                           <label key={opt} className="flex items-center gap-2 cursor-pointer">
                             <input type="checkbox" checked={formData.specialArrangements.includes(opt)} onChange={e => {
                                if (e.target.checked) setFormData({...formData, specialArrangements: [...formData.specialArrangements, opt]});
                                else setFormData({...formData, specialArrangements: formData.specialArrangements.filter(x => x !== opt)});
                             }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                             <span className="text-sm text-slate-600">{opt}</span>
                           </label>
                        ))}
                      </div>
                    </div>
                 </div>

                 <div className="pt-2">
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Special Courtesy</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['VIP', 'Government Official', 'Professional Courtesy', 'Senior Citizen'].map(opt => (
                           <label key={opt} className="flex items-center gap-2 cursor-pointer">
                             <input type="checkbox" checked={formData.specialCourtesy?.includes(opt)} onChange={e => {
                                const sc = formData.specialCourtesy || [];
                                if (e.target.checked) setFormData({...formData, specialCourtesy: [...sc, opt]});
                                else setFormData({...formData, specialCourtesy: sc.filter(x => x !== opt)});
                             }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                             <span className="text-sm text-slate-600">{opt}</span>
                           </label>
                      ))}
                    </div>
                 </div>
              </div>

            </div>
          )}

          {step === 4 && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
               <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-500" /> Bed Assignment</h3>
               {!locations ? (
                 <div className="text-center p-10 text-slate-500">Loading location data...</div>
               ) : (
                 <LocationSelector 
                   locations={locations}
                   value={formData.location}
                   onChange={handleLocationChange}
                   showRoom={true}
                   showBed={true}
                   admissions={admissions}
                 />
               )}
            </div>
          )}

          {step === 5 && (
             <div className="max-w-xl mx-auto space-y-6 text-center animate-in zoom-in-95 duration-300">
               <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4"><CheckCircle className="w-10 h-10" /></div>
               <h3 className="text-2xl font-bold text-slate-900">Ready to Admit</h3>
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left space-y-4">
                 <div className="flex justify-between border-b pb-4"><span className="text-slate-500">Patient</span><span className="font-bold text-slate-900">{formData.patientName}</span></div>
                 <div className="flex justify-between border-b pb-4"><span className="text-slate-500">Physician</span><span className="font-bold text-slate-900">{formData.physician}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-bold text-blue-600">
                    {formData.location.ward || 'Unassigned Ward'} • {formData.location.room ? `Room ${formData.location.room}` : 'Unassigned Room'}
                    {formData.location.bed ? ` - Bed ${formData.location.bed}` : ''}
                  </span></div>
               </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between">
          {step > 1 ? <Button variant="outline" onClick={() => setStep(step-1)}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button> : <div/>}
          <Button onClick={step === 5 ? handleSubmit : () => setStep(step+1)} className={step === 5 ? "bg-emerald-600 hover:bg-emerald-700 w-40" : "bg-blue-600 hover:bg-blue-700 w-32"} disabled={step===1 && !formData.patientId}>{step === 5 ? "Confirm" : "Next"}</Button>
        </div>
      </Card>
    </div>,
    document.body
  );
};

export default AdmitPatientModal;
