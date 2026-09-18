import { useState, useEffect } from 'react';
import { Save, Edit3, User } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string,string>>({});
  const [editCol, setEditCol] = useState<{id:string,name:string}|null>(null);
  const [filterUser, setFilterUser] = useState('all');
  const today = new Date().toISOString().slice(0,10);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zeyfi_user') || '{}') : {};
  const isAdmin = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    api('/reports').then(setReports);
    api('/reports/columns').then(setColumns);
    const sock = getSocket();
    sock.on('columns:updated', (cols: any) => setColumns(cols));
    sock.on('report:new', () => api('/reports').then(setReports));
    return () => { sock.off('columns:updated'); sock.off('report:new'); };
  }, []);

  const userList = [...new Map(reports.map((r: any) => [r.user_id, { id: r.user_id, name: r.user_name }])).values()];
  const filtered = filterUser === 'all' ? reports : reports.filter((r: any) => r.user_id === filterUser);

  return (<div>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Báo cáo hàng ngày</h1><p className="text-sm text-muted mt-1">{isAdmin ? 'Tổng quan báo cáo toàn bộ nhân sự' : 'Báo cáo công việc của bạn'}</p></div>
      <div className="flex items-center gap-3">
        {isAdmin && userList.length > 1 && (
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            className="px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] transition-all cursor-pointer" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px"}}>
            <option value="all">Tất cả nhân sự</option>
            {userList.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <button onClick={async () => { await api('/reports', {method:'POST',body:JSON.stringify({date:today,teamId:'',data:form})}); setForm({}); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
          <Save size={16} />Gửi báo cáo
        </button>
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
      {/* Header row */}
      <div className="flex border-b border-border bg-gray-50">
        <div className="w-28 p-3 text-xs font-semibold text-muted uppercase">Ngày</div>
        {isAdmin && <div className="w-36 p-3 text-xs font-semibold text-muted uppercase">Nhân sự</div>}
        {columns.map(col => <div key={col.id} className="flex-1 p-3 text-xs font-semibold text-muted uppercase relative group cursor-pointer"
          onDoubleClick={() => isAdmin && setEditCol({id:col.id,name:col.name})}>
          {editCol?.id === col.id ? (
            <input value={editCol.name} onChange={e => setEditCol({...editCol,name:e.target.value})}
              onBlur={() => { api('/reports/columns/'+col.id, {method:'PUT',body:JSON.stringify({...col,name:editCol.name})}); setEditCol(null); }}
              className="w-full px-2 py-1 border border-primary rounded-lg text-xs outline-none" autoFocus />
          ) : <span>{col.name}</span>}
          {isAdmin && <Edit3 size={12} className="absolute top-1 right-1 text-faint opacity-0 group-hover:opacity-100" />}
        </div>)}
      </div>

      {/* Data rows */}
      {filtered.map((r: any) => (
        <div key={r.id} className="flex border-b border-border hover:bg-gray-50 transition-all">
          <div className="w-28 p-3 text-sm text-muted">{r.date}</div>
          {isAdmin && (
            <div className="w-36 p-3 text-sm flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-[10px] font-bold shrink-0">
                {r.user_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="truncate">{r.user_name || '—'}</span>
            </div>
          )}
          {columns.map(col => {
            const d = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
            return <div key={col.id} className="flex-1 p-3 text-sm">{d[col.id] || ''}</div>;
          })}
        </div>
      ))}

      {/* Input row */}
      <div className="flex bg-white border-t border-border">
        <div className="w-28 p-3 text-sm text-muted font-medium">{today}</div>
        {isAdmin && <div className="w-36 p-3 text-sm flex items-center gap-2 text-muted"><User size={14} />{user.name || 'Tôi'}</div>}
        {columns.map(col => (
          <div key={col.id} className="flex-1 p-2">
            <input placeholder={col.name} onChange={e => setForm({...form,[col.id]:e.target.value})}
              className="w-full px-3 py-2.5 bg-[#f8fafc] border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 transition-all" />
          </div>
        ))}
      </div>
    </div>
  </div>);
}