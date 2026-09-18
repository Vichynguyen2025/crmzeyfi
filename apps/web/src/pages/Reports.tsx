import { useState, useEffect } from 'react';
import { Save, Edit3 } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string,string>>({});
  const [editCol, setEditCol] = useState<{id:string,name:string}|null>(null);
  const today = new Date().toISOString().slice(0,10);

  useEffect(() => { api('/reports').then(setReports); api('/reports/columns').then(setColumns); const sock = getSocket(); sock.on('columns:updated', (cols: any) => setColumns(cols)); return () => sock.off('columns:updated'); }, []);

  return (<div>
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Báo cáo hàng ngày</h1>
      <button onClick={async () => { await api('/reports', {method:'POST',body:JSON.stringify({date:today,teamId:'',data:form})}); setForm({}); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-medium"><Save size={16} />Lưu</button>
    </div>
    <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
      <div className="flex border-b border-border bg-gray-50">
        <div className="w-32 p-3 text-xs font-semibold text-muted uppercase">Ngày</div>
        {columns.map(col => <div key={col.id} className="flex-1 p-3 text-xs font-semibold text-muted uppercase relative group cursor-pointer" onDoubleClick={() => setEditCol({id:col.id,name:col.name})}>
          {editCol?.id === col.id ? <input value={editCol.name} onChange={e => setEditCol({...editCol,name:e.target.value})} onBlur={() => { api('/reports/columns/'+col.id, {method:'PUT',body:JSON.stringify({...col,name:editCol.name})}); setEditCol(null); }} className="w-full px-2 py-1 border border-primary rounded-lg text-xs outline-none" autoFocus /> : <span>{col.name}</span>}
          <Edit3 size={12} className="absolute top-1 right-1 text-faint opacity-0 group-hover:opacity-100" />
        </div>)}
      </div>
      {reports.map(r => <div key={r.id} className="flex border-b border-border hover:bg-gray-50"><div className="w-32 p-3 text-sm">{r.date}</div>{columns.map(col => {const d = typeof r.data==='string'?JSON.parse(r.data):(r.data||{}); return <div key={col.id} className="flex-1 p-3 text-sm">{d[col.id]||''}</div>;})}</div>)}
      <div className="flex bg-white"><div className="w-32 p-3 text-sm text-muted">{today}</div>{columns.map(col => <div key={col.id} className="flex-1 p-2"><input placeholder={col.name} onChange={e => setForm({...form,[col.id]:e.target.value})} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>)}</div>
    </div>
  </div>);
}