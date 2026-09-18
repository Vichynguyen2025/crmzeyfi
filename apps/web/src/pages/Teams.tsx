import { useState, useEffect } from 'react';
import { Users, Plus, X, Phone, Mail, Shield, Edit3, Trash2, BarChart3, Globe, ExternalLink, User, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const COLORS = ['#4f46e5','#f59e0b','#22c55e','#ec4899','#06b6d4','#f97316','#8b5cf6'];
const ROLE_LABELS: Record<string,string> = {admin:'Quản trị',manager:'Quản lý',member:'Nhân sự'};

export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [add, setAdd] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [toast, setToast] = useState<{type:'success'|'error',message:string}|null>(null);

  const showToast = (t: 'success'|'error', msg: string) => {
    setToast({type:t, message:msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => { api('/teams').then(setTeams); api('/users').then(setUsers).catch(() => {}); };
  useEffect(load, []);

  // Realtime
  useEffect(() => {
    const sock = getSocket();
    const h = () => load();
    sock.on('channel:update', h);
    sock.on('report:new', h);
    return () => { sock.off('channel:update', h); sock.off('report:new', h); };
  }, []);

  const openTeam = async (t: any) => {
    setSelectedTeam(t);
    setMembers([]); setChannels([]);
    const [m, c] = await Promise.all([
      api('/teams/' + t.id + '/members'),
      api('/teams/' + t.id + '/channels').catch(() => []),
    ]);
    setMembers(m);
    setChannels(c);
  };

  const addMember = async (userId: string) => {
    if (!userId || !selectedTeam) return;
    await api('/teams/' + selectedTeam.id + '/members', { method:'POST', body:JSON.stringify({userId}) });
    const m = await api('/teams/' + selectedTeam.id + '/members');
    setMembers(m);
    showToast('success', 'Đã thêm thành viên');
    load();
  };

  const removeMember = async (userId: string) => {
    if (!selectedTeam) return;
    if (!confirm('Xoá thành viên này khỏi team?')) return;
    await api('/teams/' + selectedTeam.id + '/members/' + userId, { method:'DELETE' });
    const m = await api('/teams/' + selectedTeam.id + '/members');
    setMembers(m);
    showToast('success', 'Đã xoá thành viên');
    load();
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Xoá team này?')) return;
    await api('/teams/' + id, { method:'DELETE' });
    setSelectedTeam(null);
    showToast('success', 'Đã xoá team');
    load();
  };

  const saveTeam = async () => {
    if (!editTeam?.name?.trim()) return;
    await api('/teams/' + editTeam.id, { method:'PUT', body:JSON.stringify({name: editTeam.name, color: editTeam.color}) });
    setEditTeam(null);
    load();
    if (selectedTeam?.id === editTeam.id) setSelectedTeam({...selectedTeam, name: editTeam.name, color: editTeam.color});
    showToast('success', 'Đã cập nhật team');
  };

  if (selectedTeam) {
    return (
      <div className="space-y-6">
        {toast && (
          <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
            (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
            {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
            {toast.message}
          </div>
        )}

        {/* Back button + Team header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedTeam(null)} className="px-3 py-2 bg-white border border-border rounded-xl text-sm hover:bg-gray-50 transition-all">← Quay lại</button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl grid place-items-center text-white font-bold text-lg shadow-sm" style={{backgroundColor: selectedTeam.color || '#4f46e5'}}>
                {selectedTeam.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#171717]">{selectedTeam.name}</h1>
                <p className="text-sm text-muted">{members.length} thành viên · {channels.length} kênh Marketing</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditTeam({id: selectedTeam.id, name: selectedTeam.name, color: selectedTeam.color})}
              className="px-4 py-2 bg-white border border-border rounded-xl text-sm hover:bg-gray-50 transition-all"><Edit3 size={15} className="inline mr-1" />Sửa</button>
            <button onClick={() => deleteTeam(selectedTeam.id)}
              className="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-all"><Trash2 size={15} className="inline mr-1" />Xoá</button>
          </div>
        </div>

        {/* Edit team modal */}
        {editTeam && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Sửa team</h3>
            <input value={editTeam.name} onChange={e => setEditTeam({...editTeam, name: e.target.value})} placeholder="Tên team"
              className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25" />
            <div className="flex gap-2">{COLORS.map(c => (
              <button key={c} onClick={() => setEditTeam({...editTeam, color: c})}
                className={'w-8 h-8 rounded-full border-2 transition-all ' + (editTeam.color === c ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:scale-105')}
                style={{backgroundColor: c}} />
            ))}</div>
            <div className="flex gap-3">
              <button onClick={saveTeam} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm">Lưu</button>
              <button onClick={() => setEditTeam(null)} className="px-5 py-2.5 bg-gray-100 text-muted rounded-xl text-sm">Huỷ</button>
            </div>
          </div>
        )}

        {/* Members */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#171717]">Thành viên ({members.length})</h2>
            <select onChange={e => { e.target.value && addMember(e.target.value); e.target.value = ''; }}
              className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs text-ink outline-none cursor-pointer">
              <option value="">+ Thêm thành viên</option>
              {users.filter((u: any) => !members.find((m: any) => m.id === u.id)).map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="divide-y divide-border">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-all group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">
                  {m.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#171717]">{m.name}</p>
                  <p className="text-xs text-muted">{m.email}</p>
                </div>
                <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (m.role === 'admin' ? 'bg-purple-50 text-purple-600' : m.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-muted')}>
                  {ROLE_LABELS[m.role] || m.role}
                </span>
                <button onClick={() => removeMember(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
              </div>
            ))}
            {members.length === 0 && <div className="px-5 py-8 text-center text-muted text-sm">Chưa có thành viên</div>}
          </div>
        </div>

        {/* KPI - same format as personnel results */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gray-50/50">
            <h2 className="text-sm font-bold text-[#171717]">KPI Team — {selectedTeam.name}</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-muted">Tổng số thành viên: <strong>{members.length}</strong></p>
            <p className="text-sm text-muted">Kênh Marketing: <strong>{channels.length}</strong></p>
          </div>
        </div>

        {/* Marketing Channels */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gray-50/50">
            <h2 className="text-sm font-bold text-[#171717]">Kênh Marketing phụ trách ({channels.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {channels.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-all">
                <div className={'w-8 h-8 rounded-lg grid place-items-center text-[10px] font-bold shrink-0 ' + (c.platform === 'Facebook' ? 'bg-blue-50 text-blue-600' : c.platform === 'TikTok' ? 'bg-gray-900 text-white' : c.platform === 'Zalo' ? 'bg-sky-50 text-sky-600' : c.platform === 'YouTube' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600')}>
                  {c.platform?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#171717]">{c.name}</p>
                  <p className="text-xs text-muted">{c.platform}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {c.url && <a href={c.url} target="_blank" className="text-[#4f46e5] hover:underline"><ExternalLink size={12} /></a>}
                  {c.assignedToName && <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg"><User size={11} />{c.assignedToName}</span>}
                </div>
              </div>
            ))}
            {channels.length === 0 && <div className="px-5 py-8 text-center text-muted text-sm">Chưa có kênh Marketing nào</div>}
          </div>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-6">
      {toast && (
        <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          {toast.message}
        </div>
      )}

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
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25" />
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
          <div key={t.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
            onClick={() => openTeam(t)}>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl grid place-items-center text-white font-bold text-sm shadow-sm"
                  style={{backgroundColor: t.color || '#4f46e5'}}>{t.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#171717]">{t.name}</h3>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    <Users size={12} /> {t.memberCount || 0} thành viên
                  </p>
                </div>
                <ChevronRightIcon size={18} className="text-muted opacity-50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChevronRightIcon({size, className}: {size: number, className?: string}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}