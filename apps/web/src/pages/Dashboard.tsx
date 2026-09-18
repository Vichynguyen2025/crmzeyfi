import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, ClipboardList, DollarSign, PhoneCall } from 'lucide-react';
import { api } from '../lib/api';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('week');
  useEffect(() => {
    const d = new Date(); let from, to;
    if (period === 'week') { const w = new Date(d); w.setDate(w.getDate() - 7); from = w.toISOString().slice(0,10); to = d.toISOString().slice(0,10); }
    else if (period === 'month') { const m = new Date(d); m.setMonth(m.getMonth() - 1); from = m.toISOString().slice(0,10); to = d.toISOString().slice(0,10); }
    else { from = '2024-01-01'; to = d.toISOString().slice(0,10); }
    api('/dashboard?from=' + from + '&to=' + to).then(setData).catch(() => {});
  }, [period]);
  if (!data) return <div className="flex h-64 items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  const o = data.overall || {};
  return (<div>
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <select value={period} onChange={e => setPeriod(e.target.value)} className="px-4 py-2 bg-white border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#4f46e5]/25">
        <option value="week">7 ngày qua</option><option value="month">30 ngày qua</option><option value="year">Năm nay</option>
      </select>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-indigo-50 grid place-items-center"><ClipboardList className="w-5 h-5 text-[#4f46e5]" /></div><span className="text-sm font-medium text-muted">Báo cáo</span></div>
        <p className="text-3xl font-bold text-[#171717]">{o.reportCount || 0}</p>
      </div>
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-green-50 grid place-items-center"><PhoneCall className="w-5 h-5 text-[#22c55e]" /></div><span className="text-sm font-medium text-muted">Khách hàng</span></div>
        <p className="text-3xl font-bold text-[#171717]">{o.customerCount || 0}</p>
      </div>
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-amber-50 grid place-items-center"><DollarSign className="w-5 h-5 text-[#f59e0b]" /></div><span className="text-sm font-medium text-muted">Chi phí QC</span></div>
        <p className="text-3xl font-bold text-[#171717]">{Number(o.adCostTotal || 0).toLocaleString('vi-VN')}đ</p>
      </div>
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-purple-50 grid place-items-center"><Users className="w-5 h-5 text-[#7c3aed]" /></div><span className="text-sm font-medium text-muted">Team</span></div>
        <p className="text-3xl font-bold text-[#171717]">{data.teams?.length || 0}</p>
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-border p-6 mb-8"><h2 className="text-lg font-bold mb-4">Thống kê theo Team</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.teams}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{fontSize:12}} /><YAxis /><Tooltip /><Bar dataKey="reportCount" name="Báo cáo" fill="#4f46e5" radius={[6,6,0,0]} /><Bar dataKey="customerCount" name="Khách hàng" fill="#22c55e" radius={[6,6,0,0]} /></BarChart>
      </ResponsiveContainer>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">{data.teams?.map((t:any) => (
      <div key={t.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl grid place-items-center text-white font-bold text-sm" style={{backgroundColor:t.color}}>{t.name.charAt(0)}</div><div><h3 className="font-bold">{t.name}</h3><p className="text-xs text-muted">{t.memberCount} thành viên</p></div></div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted">Báo cáo:</span> <span className="font-semibold">{t.reportCount}</span></div>
          <div><span className="text-muted">KH mới:</span> <span className="font-semibold">{t.customerCount}</span></div>
          <div><span className="text-muted">Chi phí QC:</span> <span className="font-semibold">{Number(t.adCostTotal||0).toLocaleString('vi-VN')}đ</span></div>
          <div><span className="text-muted">Tasks:</span> <span className="font-semibold">{Object.values(t.tasks||{}).reduce((a:number,b:number)=>a+b,0)||0}</span></div>
        </div>
      </div>
    ))}</div>
  </div>);
}