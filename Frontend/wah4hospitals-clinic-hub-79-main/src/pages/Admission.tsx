import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, RefreshCw, MapPin, UserCircle, 
  LayoutGrid, List, Filter
} from 'lucide-react';
import { Admission } from '@/types/admission';
import { admissionService } from '@/services/admissionService';
import RoomManagementView from '@/components/admission/RoomManagementView';
import AdmitPatientModal from '@/components/admission/AdmitPatientModal';
import { AdmissionDetailsModal } from '@/components/admission/AdmissionDetailsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// --- Polished Helper Components ---

const StatusBadge = ({ status, priority }: { status: string; priority: string }) => {
  const styles = {
    'in-progress': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'planned': 'bg-blue-50 text-blue-700 border-blue-200',
    'finished': 'bg-slate-50 text-slate-700 border-slate-200',
    'cancelled': 'bg-red-50 text-red-700 border-red-200',
  };
  
  const priorityStyles = {
    'high': 'bg-amber-100 text-amber-800 border-amber-200',
    'emergency': 'bg-red-100 text-red-800 border-red-200 animate-pulse',
    'urgent': 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return (
    <div className="flex items-center gap-2">
      {(priority === 'high' || priority === 'emergency' || priority === 'urgent') && (
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${priorityStyles[priority as keyof typeof priorityStyles]}`}>
          {priority}
        </span>
      )}
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles[status as keyof typeof styles] || styles['finished']}`}>
        {status.replace('-', ' ')}
      </span>
    </div>
  );
};

const CapacityCard = ({ name, type, occupied, total, status }: any) => {
  const percentage = Math.min((occupied / total) * 100, 100);
  const colorClass = status === 'full' ? 'bg-red-500' : status === 'near-full' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{type === 'wa' ? 'General Ward' : 'Specialized Unit'}</p>
          </div>
          <div className="text-right">
             <span className="text-2xl font-bold text-gray-900">{occupied}</span>
             <span className="text-sm text-gray-400">/{total}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className={status === 'full' ? 'text-red-600' : 'text-gray-600'}>
              {Math.round(percentage)}% Utilization
            </span>
          </div>
          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AdmissionPage = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [locations, setLocations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'patients' | 'rooms'>('patients');
  const [statusFilter, setStatusFilter] = useState('in-progress');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [adm, loc] = await Promise.all([admissionService.getAll(), admissionService.getLocations()]);
    setAdmissions(adm);
    setLocations(loc);
    setIsLoading(false);
  };

  const filteredAdmissions = admissions.filter(a => {
    const matchesStatus = statusFilter === 'all' ? true : a.status === statusFilter;
    const matchesSearch = a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getWardStats = () => {
    if (!locations) return [];
    const stats: any[] = [];
    Object.values(locations.wards || {}).forEach((wards: any) => {
      wards.forEach((w: any) => {
        const pct = (w.occupied / w.capacity) * 100;
        stats.push({ ...w, status: pct >= 100 ? 'full' : pct >= 75 ? 'near-full' : 'available' });
      });
    });
    return stats;
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center text-blue-600 font-medium animate-pulse">Loading Hospital System...</div>;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admission Management</h1>
          <p className="text-slate-500 mt-1">Real-time overview of inpatient encounters and bed capacity.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="icon" onClick={fetchData} className="rounded-full hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></Button>
          <Button onClick={() => setIsAdmitModalOpen(true)} className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4 mr-2" /> Admit Patient
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-8 border-b border-slate-200 px-2">
        <button onClick={() => setActiveTab('patients')} className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'patients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <List className="w-4 h-4" /> Admitted List
        </button>
        <button onClick={() => setActiveTab('rooms')} className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'rooms' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <LayoutGrid className="w-4 h-4" /> Room View
        </button>
      </div>

      {activeTab === 'patients' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getWardStats().slice(0, 4).map((ward) => (
              <CapacityCard key={ward.code} {...ward} />
            ))}
          </div>

          {/* Table Card */}
          <Card className="border-0 shadow-lg ring-1 ring-slate-100 bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                {['in-progress', 'planned', 'all'].map(status => (
                  <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${statusFilter === status ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {status}
                  </button>
                ))}
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input placeholder="Search patients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Provider</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAdmissions.length > 0 ? filteredAdmissions.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shadow-sm border border-slate-200">
                            {p.patientName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{p.patientName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{p.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} priority={p.priority} />
                        <div className="text-xs text-slate-400 mt-1 pl-1">{p.admissionNo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-slate-700">{p.location.ward}</div>
                            <div className="text-xs text-slate-500">Room {p.location.room} • {p.location.bed}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{p.physician}</div>
                            <div className="text-xs text-slate-500">{p.serviceType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedAdmission(p); setIsDetailsOpen(true); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium">
                          Details
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No patients found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'rooms' && <RoomManagementView locations={locations} />}

      {/* Modals */}
      <AdmitPatientModal isOpen={isAdmitModalOpen} onClose={() => setIsAdmitModalOpen(false)} onSuccess={() => { setIsAdmitModalOpen(false); fetchData(); }} />
      <AdmissionDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} admission={selectedAdmission} />
    </div>
  );
};

export default AdmissionPage;