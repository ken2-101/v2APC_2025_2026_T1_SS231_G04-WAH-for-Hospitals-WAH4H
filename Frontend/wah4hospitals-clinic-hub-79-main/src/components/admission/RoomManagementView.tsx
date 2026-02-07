import React, { useState, useEffect } from 'react';
import { BedDouble, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RoomManagementProps { locations: any; }

const RoomManagementView: React.FC<RoomManagementProps> = ({ locations }) => {
  const [selBldg, setSelBldg] = useState<string>('');
  const [selWing, setSelWing] = useState<string>('');
  const [selWard, setSelWard] = useState<string>('');

  useEffect(() => {
    if (locations?.buildings?.length > 0) {
      setSelBldg(locations.buildings[0].code);
      const w = locations.wings[locations.buildings[0].code];
      if (w?.length) { setSelWing(w[0].code); const wd = locations.wards[w[0].code]; if (wd?.length) setSelWard(wd[0].code); }
    }
  }, [locations]);

  if (!locations) return <div>Loading...</div>;

  const currentRooms = (() => {
    if (!selWard) return [];
    return (locations.corridors[selWard] || []).flatMap((c: any) => locations.rooms[c.code] || []);
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-0 shadow-sm ring-1 ring-slate-100">
        <CardContent className="p-6 flex flex-col md:flex-row gap-6">
           {/* Dropdowns with Labels */}
           {[ 
             { label: 'Building', val: selBldg, set: setSelBldg, opts: locations.buildings },
             { label: 'Wing/Floor', val: selWing, set: setSelWing, opts: locations.wings[selBldg] },
             { label: 'Ward', val: selWard, set: setSelWard, opts: locations.wards[selWing] }
           ].map((field, i) => (
             <div key={i} className="flex-1">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{field.label}</label>
               <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={field.val} onChange={e => field.set(e.target.value)}>
                 {field.opts?.map((o:any) => <option key={o.code} value={o.code}>{o.name}</option>) || <option>None</option>}
               </select>
             </div>
           ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentRooms.length > 0 ? currentRooms.map((room: any) => (
          <div key={room.code} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded border border-slate-200"><BedDouble className="w-4 h-4 text-slate-500" /></div>
                <div><h4 className="font-bold text-slate-900">{room.name}</h4><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Standard Room</p></div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${room.occupied >= room.beds ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{room.occupied}/{room.beds}</div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {Array.from({ length: room.beds }).map((_, i) => {
                 const isOcc = i < room.occupied;
                 return (
                   <div key={i} className={`p-3 rounded-lg border flex items-center gap-3 ${isOcc ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                     <div className={`w-3 h-3 rounded-full ${isOcc ? 'bg-red-500' : 'bg-emerald-500'}`} />
                     <div><span className="block text-xs font-bold text-slate-700">Bed {String.fromCharCode(65+i)}</span><span className="text-[10px] text-slate-500 uppercase">{isOcc ? 'Occupied' : 'Free'}</span></div>
                   </div>
                 );
              })}
            </div>
          </div>
        )) : <div className="col-span-full py-20 text-center text-slate-400">No rooms found in this ward.</div>}
      </div>
    </div>
  );
};
export default RoomManagementView;