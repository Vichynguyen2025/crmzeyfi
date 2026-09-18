import { useState, useEffect } from 'react';
import { Users, Plus, X } from 'lucide-react';
import { api } from '../lib/api';

const COLORS = ['#4f46e5','#f59e0b','#22c55e','#ec4899','#06b6d4','#f97316','#8b5cf6'];
export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]); const [add, setAdd] = useState(false);
  const [name, setName] = useState(''); const [color, setColor] = useState(COLORS[0]);
  const [members, setMembers] = useState<Record<string,any[]>>({});
  const load = () => { api('/teams').then(setTeams); };
  useEffect(load, []);

  return (<div>
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Team</h1>
      <button onClick={() => setAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-medium"><Plus size={18} />Thêm team</button>
    </div>
    {add && <div className="bg-white rounded-2xl border border-border p-5 mb-6">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên team" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 mb-3" />
      <div className="flex gap-2 mb-4">{COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={'w-8 h-8 rounded-full border-2 '+(color===c?'border-primary scale-110':'border-transparent')} style={{backgroundColor:c}} />)}</div>
      <div className="flex gap-3">
        <button onClick={async () => { await api('/teams', {method:'POST',body:JSON.stringify({name,color})}); setAdd(false); setName(''); load(); }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">Tạo</button>
        <button onClick={() => setAdd(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm">Huỷ</button>
      </div>
    </div>}
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">{teams.map(t => (
      <div key={t.id} className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl grid place-items-center text-white font-bold text-sm" style={{backgroundColor:t.color}}>{t.name.charAt(0)}</div><div><h3 className="font-bold">{t.name}</h3><p className="text-xs text-muted">{t.memberCount} thành viên</p></div></div>
          <button onClick={async () => { setMembers((p:any) => ({...p, [t.id]: await api('/teams/'+t.id+'/members')})); }} className="p-2 rounded-lg hover:bg-gray-100"><Users size={16} /></button>
        </div>
        {members[t.id]?.map((m:any) => <div key={m.id} className="flex items-center gap-2 py-1.5 text-sm"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold">{m.name?.charAt(0)||'?'}</div><span>{m.name}</span></div>)}
      </div>
    ))}</div>
  </div>);
}