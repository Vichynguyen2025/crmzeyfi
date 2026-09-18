import { useState, useEffect } from 'react';
import { Users, Plus, X, Phone, Mail, Shield } from 'lucide-react';
import { api } from '../lib/api';

const COLORS = ['#4f46e5','#f59e0b','#22c55e','#ec4899','#06b6d4','#f97316','#8b5cf6'];
const ROLE_LABELS: Record<string,string> = {admin:'Admin',manager:'Quản lý',member:'Thành viên'};

export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [add, setAdd] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [members, setMembers] = useState<Record<string,any[]>>({});
  const [showMember, setShowMember] = useState<any>(null);

  useEffect(() => { api('/teams').then(setTeams); }, []);
  
  const loadMembers = async (tid: string) => {
    setMembers((p:any) => ({...p, [tid]: p[tid] || []}));
    const data = await api('/teams/' + tid + '/members');
    setMembers((p:any) => ({...p, [tid]: data}));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#171717]">Team</h1><p className="text-sm text-muted mt-1">Quản lý nhóm và thành viên</p></div>
        <button onClick={() => setAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
          <Plus size={18} />Thêm team
        </button>
      </div>

      {add && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Tạo team mới</h3>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên team (vd: Marketing Online)"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 transition-all" />
          <div className="flex gap-2">{COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={'w-8 h-8 rounded-full border-2 transition-all ' + (color===c ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:scale-105')}
              style={{backgroundColor:c}} />
          ))}</div>
          <div className="flex gap-3 pt-2">
            <button onClick={async () => { await api('/teams', {method:'POST',body:JSON.stringify({name,color})}); setAdd(false); setName(''); load(); }}
              className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:shadow-md transition-all">Tạo team</button>
            <button onClick={() => setAdd(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium transition-all">Huỷ</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {teams.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Team header */}
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl grid place-items-center text-white font-bold text-sm shadow-sm"
                    style={{backgroundColor: t.color || '#4f46e5'}}>{t.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="font-bold text-[#171717]">{t.name}</h3>
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <Users size={12} /> {t.memberCount || 0} thành viên
                    </p>
                  </div>
                </div>
                <button onClick={() => { loadMembers(t.id); }} className="p-2 rounded-lg hover:bg-gray-100 text-muted hover:text-[#4f46e5] transition-all" title="Xem thành viên">
                  <Users size={18} />
                </button>
              </div>
            </div>

            {/* Members */}
            {members[t.id] && (
              <div className="border-t border-border px-5 py-3 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Thành viên</p>
                {members[t.id].length === 0 && <p className="text-sm text-muted py-2">Chưa có thành viên</p>}
                {members[t.id].map((m:any) => (
                  <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-surface transition-all cursor-pointer"
                    onClick={() => setShowMember(m)}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">
                      {m.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#171717] truncate">{m.name}</p>
                      <p className="text-xs text-muted truncate">{m.email}</p>
                    </div>
                    <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (m.role === 'admin' ? 'bg-purple-50 text-purple-600' : m.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-muted')}>
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Member detail modal */}
      {showMember && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowMember(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white font-bold">
                  {showMember.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-[#171717]">{showMember.name}</h3>
                  <p className="text-xs text-muted">{showMember.email}</p>
                </div>
              </div>
              <button onClick={() => setShowMember(null)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-muted" /><span>{showMember.email}</span></div>
              {showMember.phone && <div className="flex items-center gap-3 text-sm"><Phone size={16} className="text-muted" /><span>{showMember.phone}</span></div>}
              <div className="flex items-center gap-3 text-sm"><Shield size={16} className="text-muted" /><span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-50 text-indigo-600">{ROLE_LABELS[showMember.role] || showMember.role}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}