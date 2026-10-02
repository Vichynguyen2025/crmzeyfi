import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Edit3, Check, X, Filter, List, Clock, ExternalLink } from 'lucide-react';

export default function Marketing3M() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<'content_website' | 'content_daily'>('content_website');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState<any>({});
  const [addingMember, setAddingMember] = useState(false);
  const [seoSaving, setSeoSaving] = useState(false);
  const [editCell, setEditCell] = useState<{id:string, field:string}|null>(null);
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zeyfi_user')||'{}') : {};

  const statusColors: Record<string, string> = { pending: 'bg-amber-50/60 text-amber-700', in_progress: 'bg-blue-50/60 text-blue-700', done: 'bg-green-50/60 text-green-700', review: 'bg-purple-50/60 text-purple-700' };
  const statusLabels: Record<string, string> = { pending: 'Chờ', in_progress: 'Đang làm', done: 'Hoàn thành', review: 'Đánh giá' };

  const load = async () => {
    try {
      let url = '/marketing-3m?tab=' + tab;
      if (filterAssignee) url += '&assignee_id=' + filterAssignee;
      if (filterStatus) url += '&status=' + filterStatus;
      if (filterDateFrom) url += '&dateFrom=' + filterDateFrom;
      if (filterDateTo) url += '&dateTo=' + filterDateTo;
      const t = await api(url);
      setTasks(t || []);
      const m = await api('/marketing-3m/members');
      setMembers(m || []);
      const u = await api('/users');
      setAllUsers(u || []);
    } catch {}
  };

  useEffect(() => { load(); }, [tab, filterAssignee, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => {
    const socket = (window as any).__socket;
    if (!socket) return;
    const handler = (data: any) => {
      if (data.action === 'create' || data.action === 'update') {
        const updated = data.data;
        setTasks((prev: any[]) => {
          const exists = prev.find((x: any) => x.id === updated.id);
          return exists ? prev.map((x: any) => x.id === updated.id ? updated : x) : [...prev, updated];
        });
      } else if (data.action === 'delete') {
        setTasks((prev: any[]) => prev.filter((x: any) => x.id !== data.id));
      }
    };
    socket.on('marketing3m:update', handler);
    return () => socket.off('marketing3m:update', handler);
  }, []);

  const addTask = async () => {
    if (!newTask.task_name) return;
    const body = { tab, ...newTask };
    await api('/marketing-3m', { method: 'POST', body: JSON.stringify(body) });
    setNewTask({});
    setAdding(false);
    load();
  };

  const updateField = async (id: string, field: string, value: any) => {
    const task = tasks.find((t: any) => t.id === id);
    const canEdit = currentUser?.role === 'admin' || currentUser?.id === task?.assignee_id;
    if (!canEdit) return;
    setTasks((prev: any[]) => prev.map((t: any) => t.id === id ? { ...t, [field]: value } : t));
    await api('/marketing-3m/' + id, { method: 'PUT', body: JSON.stringify({ [field]: value }) });
    setEditCell(null);
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Xoá công việc này?')) return;
    await api('/marketing-3m/' + id, { method: 'DELETE' });
    load();
  };

  const addMember = async (userId: string) => {
    await api('/marketing-3m/members', { method: 'POST', body: JSON.stringify({ userId }) });
    setAddingMember(false);
    load();
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Xoá thành viên này khỏi module?')) return;
    await api('/marketing-3m/members/' + userId, { method: 'DELETE' });
    load();
  };

  const today = () => new Date().toLocaleDateString('fr-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

  // Inline edit helpers
  const startEdit = (id: string, field: string) => setEditCell({ id, field });
  const isEdit = (id: string, field: string) => editCell?.id === id && editCell?.field === field;
  const canEdit = (r: any) => currentUser?.role === 'admin' || currentUser?.id === r.assignee_id;

  const inputCls = 'w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-sm text-[#1F2937] bg-white outline-none transition-all';
  const textCls = 'w-full text-sm text-[#1F2937] cursor-pointer transition-all hover:text-primary';
  const selectCls = 'h-10 border border-[#E5E7EB] rounded-lg px-3 text-sm text-[#1F2937] bg-white outline-none transition-all w-full';

  const GRID = '180px 90px 220px 70px minmax(260px,1.5fr) 180px 180px 150px 190px 64px';

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1F2937]">Marketing 3M</h1>
          <p className="text-xs text-[#667085] mt-1">Quản lý công việc Marketing 3M</p>
        </div>
        {currentUser?.role === 'admin' && <button onClick={() => setAddingMember(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5]/10 text-[#4f46e5] rounded-lg text-sm font-medium hover:bg-[#4f46e5]/20 transition-all"><Plus size={14} />Thêm nhân sự</button>}
      </div>

      {/* Add member modal */}
      {addingMember && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center" onClick={e => e.target === e.currentTarget && setAddingMember(false)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-96">
            <p className="text-sm font-semibold text-[#1F2937] mb-3">Thêm nhân sự vào Marketing 3M</p>
            <select onChange={e => addMember(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-sm outline-none">
              <option value="">Chọn nhân sự...</option>
              {allUsers.filter((u: any) => !members.find((m: any) => m.id === u.id)).map((u: any) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}
            </select>
            <button onClick={() => setAddingMember(false)} className="mt-3 px-4 py-2 text-sm text-muted rounded-lg hover:bg-gray-100 transition-all">Đóng</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-px border-b border-[#E5E7EB] mt-4">
        {['content_website', 'content_daily'].map((t) => (
          <button key={t} onClick={() => setTab(t as any)} className={'px-5 py-2 text-sm font-medium transition-all ' + (tab === t ? 'bg-[#4f46e5] text-white rounded-t-lg' : 'text-[#667085] hover:text-[#1F2937] bg-white border border-[#E5E7EB] border-b-0 rounded-t-lg')}>
            {t === 'content_website' ? 'Content Website' : 'Content Daily'}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          {members.map((m: any) => (
            <span key={m.id} className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-muted flex items-center gap-1">
              {m.name}
              {currentUser?.role === 'admin' && <button onClick={() => removeMember(m.id)} className="text-red-400 hover:text-red-600 transition-all"><X size={10} /></button>}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 mt-3 mb-4 bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-2.5 shadow-sm">
        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-10 border border-[#E5E7EB] rounded-lg px-3 text-sm outline-none w-36" />
        <span className="text-sm text-[#667085]">→</span>
        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-10 border border-[#E5E7EB] rounded-lg px-3 text-sm outline-none w-36" />
        <div className="w-px h-5 bg-[#E5E7EB]" />
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="h-10 border border-[#E5E7EB] rounded-lg px-3 text-sm outline-none">
          <option value="">Tất cả nhân sự</option>
          {members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 border border-[#E5E7EB] rounded-lg px-3 text-sm outline-none">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={() => { setAdding(true); setNewTask({ date: today() }); setEditCell(null); }} className="flex items-center gap-2 px-5 h-10 bg-[#4f46e5] text-white rounded-lg text-sm font-semibold hover:bg-[#4338ca] transition-all"><Plus size={16} />Thêm công việc</button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[12px] border border-[#E5E7EB] shadow-sm bg-white">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <colgroup>{[180,90,220,70,null,180,180,150,190,64].map(w => <col key={w} style={{width: w ? w + 'px' : 'auto'}} />)}</colgroup>
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]" style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center' }}>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-left whitespace-nowrap">Ngày</th>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-left whitespace-nowrap">Thứ</th>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-left whitespace-nowrap">Công việc</th>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-center whitespace-nowrap">SL</th>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-left whitespace-nowrap">Nội dung</th>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-left whitespace-nowrap">Timeline</th>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-left whitespace-nowrap">Người TH</th>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-left whitespace-nowrap">Trạng thái</th>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-left whitespace-nowrap">Link hoàn thiện</th>
              <th className="px-4 py-3 text-[14px] font-semibold leading-[20px] text-[#667085] text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && !adding && <tr><td colSpan={10} className="px-6 py-12 text-center text-sm text-[#667085]"><List size={24} className="mx-auto mb-2 opacity-20" /><p>Chưa có công việc</p></td></tr>}

            {tasks.map((r: any) => {
              const ce = canEdit(r);
              const weekday = r.date ? ['CN','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][new Date(r.date).getDay()] : '';
              return (
                <tr key={r.id}
                  className={'hover:bg-[#F8FAFC] transition-all border-b border-[#E5E7EB]/50' + (!ce ? ' opacity-60' : '')}
                  style={{ display: 'grid', gridTemplateColumns: GRID, borderBottom: '1px solid #E5E7EB', alignItems: 'center' }}>
                  {/* Ngày */}
                  <td className="px-4 py-[11px] align-middle">
                    {isEdit(r.id,'date') && ce ? (
                      <input type="date" value={r.date||''} onChange={e => updateField(r.id,'date',e.target.value)}
                        onBlur={() => setEditCell(null)} className={inputCls} />
                    ) : (
                      <span onClick={() => ce && startEdit(r.id,'date')} className={textCls}>{r.date ? new Date(r.date).toLocaleDateString('fr-CA',{timeZone:'Asia/Ho_Chi_Minh'}) : '—'}</span>
                    )}
                  </td>
                  {/* Thứ */}
                  <td className="px-4 py-[11px] text-sm text-[#1F2937] font-medium">{weekday || '—'}</td>
                  {/* Công việc */}
                  <td className="px-4 py-[11px] align-middle">
                    {isEdit(r.id,'task_name') && ce ? (
                      <input value={r.task_name||''} onChange={e => updateField(r.id,'task_name',e.target.value)}
                        onBlur={() => setEditCell(null)} className={inputCls} placeholder="Nhập công việc" />
                    ) : (
                      <span onClick={() => ce && startEdit(r.id,'task_name')} className={textCls}>{r.task_name || '—'}</span>
                    )}
                  </td>
                  {/* SL */}
                  <td className="px-4 py-[11px] text-center text-sm text-[#1F2937]">
                    {isEdit(r.id,'quantity') && ce ? (
                      <input type="number" value={r.quantity||''} onChange={e => updateField(r.id,'quantity',Number(e.target.value))}
                        onBlur={() => setEditCell(null)} className="w-16 h-10 border border-[#E5E7EB] rounded-lg px-0 text-sm text-center outline-none bg-white mx-auto" />
                    ) : (
                      <span onClick={() => ce && startEdit(r.id,'quantity')} className="cursor-pointer hover:text-primary">{r.quantity || '—'}</span>
                    )}
                  </td>
                  {/* Nội dung */}
                  <td className="px-4 py-[11px] align-middle overflow-hidden" style={{maxWidth:'100%'}}>
                    {isEdit(r.id,'content') && ce ? (
                      <input value={r.content||''} onChange={e => updateField(r.id,'content',e.target.value)}
                        onBlur={() => setEditCell(null)} className={inputCls} placeholder="Nội dung" />
                    ) : (
                      <span onClick={() => ce && startEdit(r.id,'content')} className={textCls + ' truncate'} title={r.content||''}>{r.content || '—'}</span>
                    )}
                  </td>
                  {/* Timeline */}
                  <td className="px-4 py-[11px] align-middle">
                    {isEdit(r.id,'timeline') && ce ? (
                      <input value={r.timeline||''} onChange={e => updateField(r.id,'timeline',e.target.value)}
                        onBlur={() => setEditCell(null)} className={inputCls} placeholder="Timeline" />
                    ) : (
                      <span onClick={() => ce && startEdit(r.id,'timeline')} className={textCls}>{r.timeline || '—'}</span>
                    )}
                  </td>
                  {/* Người TH */}
                  <td className="px-4 py-[11px] align-middle">
                    {isEdit(r.id,'assignee_id') && ce ? (
                      <select value={r.assignee_id||''} onChange={e => updateField(r.id,'assignee_id',e.target.value)}
                        onBlur={() => setEditCell(null)} className={selectCls}>
                        <option value="">Chọn</option>
                        {members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    ) : (
                      <span onClick={() => ce && startEdit(r.id,'assignee_id')} className={textCls}>{members.find((m:any)=>m.id===r.assignee_id)?.name || '—'}</span>
                    )}
                  </td>
                  {/* Trạng thái */}
                  <td className="px-4 py-[11px] align-middle">
                    {isEdit(r.id,'status') && ce ? (
                      <select value={r.status||'pending'} onChange={e => updateField(r.id,'status',e.target.value)}
                        onBlur={() => setEditCell(null)} className={selectCls + ' ' + (statusColors[r.status||'pending']||'')}>
                        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    ) : (
                      <span onClick={() => ce && startEdit(r.id,'status')} className={'px-2.5 py-1 rounded-full text-xs font-medium ' + (statusColors[r.status||'pending']||'')}>{statusLabels[r.status||'pending']}</span>
                    )}
                  </td>
                  {/* Link hoàn thiện */}
                  <td className="px-4 py-[11px] align-middle">
                    {isEdit(r.id,'completion_link') && ce ? (
                      <input value={r.completion_link||''} onChange={e => updateField(r.id,'completion_link',e.target.value)}
                        onBlur={() => setEditCell(null)} className={inputCls} placeholder="Thêm link" />
                    ) : (
                      <span onClick={() => ce && startEdit(r.id,'completion_link')} className={textCls + ' text-xs'}>
                        {r.completion_link ? <a href={r.completion_link} target="_blank" className="text-[#4f46e5] hover:underline"><ExternalLink size={12} />Mở link</a> : 'Thêm link'}
                      </span>
                    )}
                  </td>
                  {/* Action */}
                  <td className="px-4 py-[11px] text-center">
                    {currentUser?.role === 'admin' && <button onClick={() => deleteTask(r.id)} className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all" title="Xóa"><Trash2 size={14} className="text-muted" /></button>}
                  </td>
                </tr>
              );
            })}

            {/* Add new row */}
            {adding && (
              <tr className="bg-[#4f46e5]/5" style={{ display: 'grid', gridTemplateColumns: GRID, borderBottom: '1px solid #E5E7EB', alignItems: 'center' }}>
                <td className="px-4 py-[11px]"><input type="date" value={newTask.date||''} onChange={e => setNewTask({...newTask, date: e.target.value})} className={inputCls} /></td>
                <td className="px-4 py-[11px] text-sm text-[#1F2937]">{newTask.date ? ['CN','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][new Date(newTask.date).getDay()] : '—'}</td>
                <td className="px-4 py-[11px]"><input value={newTask.task_name||''} onChange={e => setNewTask({...newTask, task_name: e.target.value})} className={inputCls} placeholder="Tên công việc" /></td>
                <td className="px-4 py-[11px] text-center"><input type="number" value={newTask.quantity||''} onChange={e => setNewTask({...newTask, quantity: Number(e.target.value)})} className="w-16 h-10 border border-[#E5E7EB] rounded-lg px-0 text-sm text-center outline-none bg-white mx-auto" /></td>
                <td className="px-4 py-[11px]"><input value={newTask.content||''} onChange={e => setNewTask({...newTask, content: e.target.value})} className={inputCls} placeholder="Nội dung" /></td>
                <td className="px-4 py-[11px]"><input value={newTask.timeline||''} onChange={e => setNewTask({...newTask, timeline: e.target.value})} className={inputCls} placeholder="Timeline" /></td>
                <td className="px-4 py-[11px]"><select value={newTask.assignee_id||''} onChange={e => setNewTask({...newTask, assignee_id: e.target.value})} className={selectCls}><option value="">Chọn</option>{members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                <td className="px-4 py-[11px]"><select value={newTask.status||'pending'} onChange={e => setNewTask({...newTask, status: e.target.value})} className={selectCls + " bg-amber-50 text-amber-700"}>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                <td className="px-4 py-[11px]"><input value={newTask.completion_link||''} onChange={e => setNewTask({...newTask, completion_link: e.target.value})} className={inputCls} placeholder="Link" /></td>
                <td className="px-4 py-[11px] text-center"><div className="flex items-center justify-center gap-1.5"><button onClick={addTask} className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-green-50 text-green-600 transition-all" title="Thêm"><Check size={14} /></button><button onClick={() => { setAdding(false); setNewTask({}); }} className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-red-50 text-red-400 transition-all" title="Hủy"><X size={14} /></button></div></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}