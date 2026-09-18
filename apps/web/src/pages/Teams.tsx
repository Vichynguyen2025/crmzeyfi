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
  const [kpiRows, setKpiRows] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Auto-save KPI data with debounce
  useEffect(() => {
    if (!selectedTeam || kpiRows.length === 0) return;
    const timer = setTimeout(async () => {
      try { await api('/kpis/' + selectedTeam.id, { method:'POST', body:JSON.stringify(kpiRows) }); }
      catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [kpiRows, selectedTeam?.id]);

  const updateKpi = (idx: number, field: string, val: any) => {
    const rows = [...kpiRows];
    if (idx < rows.length) { rows[idx] = {...rows[idx], [field]: val}; setKpiRows(rows); }
  };

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
    const [m, c, p] = await Promise.all([
      api('/teams/' + t.id + '/members'),
      api('/teams/' + t.id + '/channels').catch(() => []),
      api('/products').catch(() => []),
    ]);
    setMembers(m);
    setChannels(c);
    setProducts(p || []);
    // Initialize KPI rows with one row per member + total row
    // Load saved KPI data or initialize
    try {
      const saved = await api('/kpis/' + t.id);
      if (saved && saved.length > 0) {
        setKpiRows([...saved.map((s: any) => ({name: s.name, userId: s.user_id, product: s.product || '', budget: s.daily_budget || 0, messages: s.daily_messages || 0, orders: s.monthly_orders || 0})), {name: 'Tổng'}]);
      } else {
        setKpiRows([...m.map((u: any) => ({name: u.name, userId: u.id, product: '', budget: 0, messages: 0, orders: 0})), {name: 'Tổng'}]);
      }
    } catch {
      setKpiRows([...m.map((u: any) => ({name: u.name, userId: u.id, product: '', budget: 0, messages: 0, orders: 0})), {name: 'Tổng'}]);
    }
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

        {/* KPI Planning Table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gray-50/50">
            <h2 className="text-sm font-bold text-[#171717]">Đề xuất mục tiêu & Ngân sách quảng cáo</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-36">Nhân sự</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-40">Sản phẩm</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-28">Ngân sách ngày</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-28">Số mess/ngày</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-24">Giá mess</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-28">Tổng mess/th</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-28">Tổng đơn/th</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-20">Tỷ lệ chốt</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-28">CP/đơn</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-28">NS đề xuất</th>
                </tr>
              </thead>
              <tbody>
                {kpiRows.map((r, i) => {
                  const pricePerMsg = r.budget && r.messages ? r.budget / r.messages : 0;
                  const totalMsgs = r.messages * 30;
                  const totalOrders = r.orders || 0;
                  const closeRate = totalMsgs > 0 ? (totalOrders / totalMsgs * 100) : 0;
                  const costPerOrder = totalOrders > 0 ? (r.budget * 30 / totalOrders) : 0;
                  const proposedBudget = r.budget * 30;
                  return (
                    <tr key={i} className={'border-b border-border hover:bg-gray-50 transition-all ' + (i === kpiRows.length - 1 ? 'bg-gray-50/80 font-semibold' : '')}>
                      <td className="p-3 text-xs">
                        {i < kpiRows.length - 1 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-[7px] font-bold shrink-0">
                              {r.name?.charAt(0) || '?'}
                            </div>
                            <span>{r.name}</span>
                          </span>
                        ) : <span className="text-[#4f46e5]">Tổng</span>}
                      </td>
                      <td className="p-3 text-xs">{i < kpiRows.length - 1 ? (
                        <select value={r.product} onChange={e => updateKpi(i, 'product', e.target.value)}
                          className="w-full px-1.5 py-1.5 bg-white border-border rounded-lg text-xs outline-none cursor-pointer focus:ring-2 focus:ring-[#4f46e5]/25">
                          <option value="">—</option>
                          {products.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
                          <option value="other">Khác</option>
                        </select>
                      ) : ''}</td>
                      <td className="p-3">
                        {i < kpiRows.length - 1 ? (
                          <input type="number" value={r.budget || ''} onChange={e => updateKpi(i, 'budget', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" />
                        ) : <span className="block text-right">{kpiRows.slice(0,-1).reduce((s: number, r: any) => s + (r.budget || 0), 0).toLocaleString('vi-VN')}</span>}
                      </td>
                      <td className="p-3">
                        {i < kpiRows.length - 1 ? (
                          <input type="number" value={r.messages || ''} onChange={e => updateKpi(i, 'messages', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" />
                        ) : <span className="block text-right">{kpiRows.slice(0,-1).reduce((s: number, r: any) => s + (r.messages || 0), 0)}</span>}
                      </td>
                      <td className="p-3 text-xs text-right">{pricePerMsg > 0 ? pricePerMsg.toLocaleString('vi-VN', {maximumFractionDigits:0}) : ''}</td>
                      <td className="p-3 text-xs text-right">{totalMsgs > 0 ? totalMsgs.toLocaleString('vi-VN') : ''}</td>
                      <td className="p-3">
                        {i < kpiRows.length - 1 ? (
                          <input type="number" value={r.orders || ''} onChange={e => updateKpi(i, 'orders', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" />
                        ) : <span className="block text-right">{kpiRows.slice(0,-1).reduce((s: number, r: any) => s + (r.orders || 0), 0)}</span>}
                      </td>
                      <td className="p-3 text-xs text-right">{closeRate > 0 ? closeRate.toFixed(1) + '%' : ''}</td>
                      <td className="p-3 text-xs text-right">{costPerOrder > 0 ? costPerOrder.toLocaleString('vi-VN', {maximumFractionDigits:0}) + 'đ' : ''}</td>
                      <td className="p-3 text-xs text-right font-bold text-[#4f46e5]">{proposedBudget > 0 ? proposedBudget.toLocaleString('vi-VN') + 'đ' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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