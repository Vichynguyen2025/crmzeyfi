import { useState, useEffect } from 'react';
import { Save, Edit3, Trash2, User, Plus, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const DATE_RANGES = [
  { key: 'today', label: 'Hôm nay', days: 0 },
  { key: 'yesterday', label: 'Hôm qua', days: 1 },
  { key: 'week', label: '7 ngày', days: 7 },
  { key: 'month', label: '30 ngày', days: 30 },
  { key: 'all', label: 'Tất cả', days: 9999 },
];

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtVi(d: string): string {
  if (!d) return '';
  const dateStr = d.split('T')[0];
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return d;
  const parts = dateStr.split('-');
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth(), day = today.getDate();
  const diffDays = Math.round((new Date(y, m, day).getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays === -1) return 'Ngày mai';
  return dateStr.split('-').reverse().join('/');
}

function fmtWeek(d: string): string {
  if (!d) return '';
  const parts = d.split('T')[0].split('-');
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[date.getDay()];
}

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [editCol, setEditCol] = useState<{id:string,name:string}|null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customDate, setCustomDate] = useState(fmtDate(new Date()));
  const [taskRows, setTaskRows] = useState<Record<string,string>[]>([{}]);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<{type:'success'|'error',message:string}|null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zeyfi_user') || '{}') : {};
  const isAdmin = user.role === 'admin' || user.role === 'manager';

  const showToast = (t: 'success'|'error', msg: string) => {
    setToast({type:t, message:msg});
    setTimeout(() => setToast(null), 3000);
  };

  const calcFromDate = () => {
    const r = DATE_RANGES.find(r => r.key === dateRange);
    if (!r) return '';
    if (dateRange === 'today') return fmtDate(new Date());
    if (dateRange === 'yesterday') return fmtDate(new Date(Date.now() - 86400000));
    if (dateRange === 'all') return '2020-01-01';
    const d = new Date();
    d.setDate(d.getDate() - r.days);
    return fmtDate(d);
  };

  const load = () => {
    const from = calcFromDate();
    const to = fmtDate(new Date());
    const url = from ? `/reports?from=${from}&to=${to}` : '/reports';
    api(url).then(setReports);
    api('/reports/columns').then(setColumns);
    api('/teams').then(setTeams).catch(() => {});
  };

  useEffect(load, [dateRange, customDate]);

  useEffect(() => {
    const sock = getSocket();
    sock.on('columns:updated', (cols: any) => setColumns(cols));
    sock.on('report:new', () => load());
    sock.on('report:deleted', () => load());
    return () => { sock.off('columns:updated'); sock.off('report:new'); sock.off('report:deleted'); };
  }, []);

  const addTaskRow = () => setTaskRows([...taskRows, {}]);

  const updateRow = (idx: number, colId: string, value: string) => {
    const rows = [...taskRows];
    rows[idx] = { ...rows[idx], [colId]: value };
    setTaskRows(rows);
  };

  const removeRow = (idx: number) => {
    if (taskRows.length <= 1) return;
    setTaskRows(taskRows.filter((_, i) => i !== idx));
  };

  const submitReport = async () => {
    setConfirming(false);
    const selectedDate = dateRange === 'today' ? fmtDate(new Date()) :
                         dateRange === 'yesterday' ? fmtDate(new Date(Date.now() - 86400000)) :
                         customDate;
    try {
      for (const row of taskRows) {
        if (Object.keys(row).length === 0) continue;
        await api('/reports', { method:'POST', body:JSON.stringify({ date: selectedDate, teamId: '', data: row }) });
      }
      showToast('success', `Đã gửi ${taskRows.filter(r => Object.keys(r).length > 0).length} báo cáo thành công`);
      setTaskRows([{}]);
      load();
    } catch { showToast('error', 'Lỗi gửi báo cáo'); }
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Xoá báo cáo này?')) return;
    try {
      const res = await fetch('/api/reports/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('zeyfi_token') || '') },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showToast('success', 'Đã xoá báo cáo');
      load();
    } catch (e: any) { showToast('error', 'Lỗi xoá: ' + (e.message || '')); }
  };

  const filteredByTeam = teamFilter === 'all' ? reports : reports.filter(r => r.team_id === teamFilter);
  const filteredReports = filteredByTeam.filter(r => {
    if (dateRange === 'today' || dateRange === 'yesterday') return r.date === calcFromDate();
    return true;
  });

  // Weekly stats
  const weekDays = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + i);
    return fmtDate(d);
  });
  const weekReports = reports.filter(r => weekDays.includes(r.date));
  const weekStats = weekDays.map(day => {
    const dayReports = weekReports.filter(r => r.date === day);
    const merged: Record<string, any> = {};
    dayReports.forEach(r => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
      Object.entries(data).forEach(([k, v]) => {
        if (!merged[k]) merged[k] = '';
        merged[k] += (merged[k] ? ', ' : '') + v;
      });
    });
    return { date: day, users: [...new Set(dayReports.map((r: any) => r.user_name))], data: merged };
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header + Filter */}
      <div className="flex items-center flex-wrap gap-4 justify-between">
        <div><h1 className="text-2xl font-bold text-[#171717]">Báo cáo hàng ngày</h1><p className="text-sm text-muted mt-1">{isAdmin ? 'Quản lý báo cáo toàn bộ nhân sự' : 'Báo cáo công việc của bạn'}</p></div>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-xl border border-border shadow-sm flex">
            {DATE_RANGES.map(r => (
              <button key={r.key} onClick={() => { setDateRange(r.key); setShowCalendar(false); }}
                className={'px-4 py-2 text-sm font-medium transition-all first:rounded-l-xl last:rounded-r-xl ' +
                  (dateRange === r.key ? 'bg-[#4f46e5] text-white shadow-sm' : 'hover:bg-gray-50 text-muted')}>
                {r.label}
              </button>
            ))}
            <button onClick={() => setShowCalendar(!showCalendar)}
              className={'px-3 py-2 text-muted hover:bg-gray-50 transition-all rounded-r-xl ' + (showCalendar ? 'bg-gray-100' : '')}>
              <Calendar size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar picker */}
      {showCalendar && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <input type="date" value={customDate} onChange={e => { setCustomDate(e.target.value); setDateRange('custom'); setShowCalendar(false); }}
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25" />
        </div>
      )}

      {/* Input form */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#171717]">
              Báo cáo ngày {fmtVi(dateRange === 'today' ? fmtDate(new Date()) : dateRange === 'yesterday' ? fmtDate(new Date(Date.now()-86400000)) : customDate)}
            </span>
            <span className="text-xs text-muted">{taskRows.filter(r => Object.keys(r).length > 0).length} công việc</span>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex border-b border-border bg-gray-50/30">
          <div className="w-12 p-3 text-xs font-semibold text-muted uppercase text-center">#</div>
          {columns.map(col => (
            <div key={col.id} className="flex-1 p-3 text-xs font-semibold text-muted uppercase relative group"
              onDoubleClick={() => isAdmin && setEditCol({id:col.id,name:col.name})}>
              {editCol?.id === col.id ? (
                <input value={editCol.name} onChange={e => setEditCol({...editCol,name:e.target.value} as any)}
                  onBlur={() => { api('/reports/columns/'+col.id, {method:'PUT',body:JSON.stringify({...col,name:editCol.name})}); setEditCol(null); }}
                  onKeyDown={e => e.key === 'Enter' && (api('/reports/columns/'+col.id, {method:'PUT',body:JSON.stringify({...col,name:editCol.name})}), setEditCol(null))}
                  className="w-full px-2 py-1 border border-primary rounded-lg text-xs outline-none" autoFocus />
              ) : <span>{col.name}</span>}
              {isAdmin && <Edit3 size={11} className="absolute top-1 right-1 text-faint opacity-0 group-hover:opacity-100" />}
            </div>
          ))}
        </div>

        {/* Task rows */}
        {taskRows.map((row, idx) => (
          <div key={idx} className="flex border-b border-border hover:bg-gray-50/50 transition-all">
            <div className="w-12 p-3 flex items-center justify-center">
              <span className="text-xs text-muted font-medium">{idx + 1}</span>
            </div>
            {columns.map(col => (
              <div key={col.id} className="flex-1 p-1.5">
                <input placeholder={col.name} value={row[col.id] || ''} onChange={e => updateRow(idx, col.id, e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-border rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
              </div>
            ))}
            {taskRows.length > 1 && (
              <div className="p-1.5 flex items-center">
                <button onClick={() => removeRow(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-all"><X size={14} /></button>
              </div>
            )}
          </div>
        ))}

        {/* Actions */}
        <div className="px-5 py-3 flex items-center justify-between bg-white border-t border-border">
          <button onClick={addTaskRow} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-border rounded-xl text-sm text-muted hover:text-[#4f46e5] hover:border-[#4f46e5]/30 transition-all">
            <Plus size={15} />Thêm công việc
          </button>
          <div className="flex items-center gap-3">
            {confirming ? (
              <>
                <span className="text-sm text-muted">Gửi {taskRows.filter(r => Object.keys(r).length > 0).length} báo cáo?</span>
                <button onClick={submitReport} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
                  <CheckCircle size={16} />Xác nhận gửi
                </button>
                <button onClick={() => setConfirming(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium transition-all">
                  Huỷ
                </button>
              </>
            ) : (
              <button onClick={() => setConfirming(true)} disabled={taskRows.every(r => Object.keys(r).length === 0)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <Save size={16} />Gửi báo cáo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Weekly summary table */}
      {filteredReports.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gray-50/50">
            <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#171717]">Danh sách kết quả công việc của nhân sự</h2>
            {isAdmin && teams.length > 0 && (
              <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25">
                <option value="all">Tất cả phòng ban</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-40">Nhân sự</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-24">Ngày</th>
                  {columns.map(col => <th key={col.id} className="p-3 text-xs font-semibold text-muted uppercase text-left">{col.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => {
                  const data = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
                  return (
                    <tr key={r.id} className={'border-b border-border hover:bg-gray-50 transition-all ' + (r.user_id === user.id ? 'bg-indigo-50/20' : '')}>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-[9px] font-bold shrink-0">
                            {r.user_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="text-xs font-medium">{r.user_name}</span>
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted">{fmtVi(r.date)}</td>
                      {columns.map(col => <td key={col.id} className="p-3 text-xs">{data[col.id] || ''}</td>)}
                    </tr>
                  );
                })}
                {/* Summary row */}
                <tr className="bg-gray-50/80 border-t-2 border-border font-medium">
                  <td className="p-3 text-xs font-bold text-[#4f46e5] uppercase">Tổng</td>
                  <td className="p-3 text-xs">{filteredReports.length} bc</td>
                  {columns.map(col => {
                    const vals = filteredReports.map(r => {
                      const d = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
                      return d[col.id] || '';
                    });
                    const numeric = vals.filter(v => v !== '' && !isNaN(Number(v.replace(/[,.]/g,''))));
                    const isSum = numeric.length > 0 && numeric.length === vals.filter(v => v !== '').length;
                    return <td key={col.id} className="p-3 text-xs font-bold text-[#4f46e5]">
                      {isSum ? Number(numeric.reduce((a:number,b:string) => a + Number(b.replace(/[,.]/g,'')), 0)).toLocaleString('vi-VN') : '—'}
                    </td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      
      {/* Reports list (bottom) */}

      {reports.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#171717]">Lịch sử báo cáo ({filteredReports.length})</h2>
            <span className="text-xs text-muted">Chi tiết ngày giờ gửi</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-left">Ngày</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-left">Giờ</th>
                  {isAdmin && <th className="p-3 text-xs font-semibold text-muted uppercase text-left">Nhân sự</th>}
                  {columns.map(col => <th key={col.id} className="p-3 text-xs font-semibold text-muted uppercase text-left">{col.name}</th>)}
                  {isAdmin && <th className="p-3 text-center text-xs font-semibold text-muted uppercase w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => {
                  const data = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
                  return (
                    <tr key={r.id} className={'border-b border-border hover:bg-gray-50 transition-all ' + (r.user_id === user.id ? 'bg-indigo-50/20' : '')}>
                      <td className="p-3 text-xs font-medium">{fmtVi(r.date)}</td>
                      <td className="p-3 text-xs text-muted">{new Date(r.created_at || r.date).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}</td>
                      {isAdmin && <td className="p-3">
                        <span className="inline-flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-[9px] font-bold shrink-0">
                            {r.user_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="text-xs">{r.user_name}</span>
                        </span>
                      </td>}
                      {columns.map(col => <td key={col.id} className="p-3 text-xs">{data[col.id] || ''}</td>)}
                      {isAdmin && (
                        <td className="p-3 text-center">
                          <button onClick={() => deleteReport(r.id)} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xoá">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}