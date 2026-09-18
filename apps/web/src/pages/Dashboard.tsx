import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, ClipboardList, DollarSign, PhoneCall, Package, Globe, ShoppingCart, Target, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const PERIODS = [
  { key: 'today', label: 'Hôm nay', days: 0 },
  { key: 'week', label: '7 ngày', days: 7 },
  { key: 'month', label: '30 ngày', days: 30 },
  { key: 'year', label: 'Năm nay', days: 366 },
];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('month');

  const calcDates = (p: string) => {
    const d = new Date();
    if (p === 'today') return { from: d.toISOString().slice(0,10), to: d.toISOString().slice(0,10) };
    if (p === 'week') { const w = new Date(); w.setDate(w.getDate()-7); return { from: w.toISOString().slice(0,10), to: d.toISOString().slice(0,10) }; }
    if (p === 'month') { const m = new Date(); m.setMonth(m.getMonth()-1); return { from: m.toISOString().slice(0,10), to: d.toISOString().slice(0,10) }; }
    return { from: '2024-01-01', to: d.toISOString().slice(0,10) };
  };

  const load = () => {
    const { from, to } = calcDates(period);
    api('/dashboard?from=' + from + '&to=' + to).then(setData).catch(() => {});
  };

  useEffect(load, [period]);

  // Realtime
  useEffect(() => {
    const sock = getSocket();
    const handler = () => load();
    sock.on('report:new', handler);
    sock.on('task:new', handler);
    sock.on('customer:new', handler);
    sock.on('channel:update', handler);
    sock.on('drive:update', handler);
    return () => {
      sock.off('report:new', handler); sock.off('task:new', handler);
      sock.off('customer:new', handler); sock.off('channel:update', handler);
      sock.off('drive:update', handler);
    };
  }, [period]);

  if (!data) return (
    <div className="flex h-80 items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-[#4f46e5] border-t-transparent rounded-full" />
    </div>
  );

  const o = data.overall || {};
  const kpiCol = o.kpiPct >= 100 ? 'text-green-600' : o.kpiPct >= 50 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Dashboard</h1>
          <p className="text-sm text-muted mt-1">Tổng quan hiệu suất CRM</p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl border border-border shadow-sm">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={'px-4 py-2 text-sm font-medium transition-all first:rounded-l-xl last:rounded-r-xl ' +
                (period === p.key ? 'bg-[#4f46e5] text-white shadow-sm' : 'hover:bg-gray-50 text-muted')}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 grid place-items-center"><ClipboardList className="w-5 h-5 text-[#4f46e5]" /></div>
            <span className="text-sm font-medium text-muted">Báo cáo</span>
          </div>
          <p className="text-3xl font-bold text-[#171717]">{o.reportCount || 0}</p>
          <p className="text-xs text-muted mt-1">Trong kỳ</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 grid place-items-center"><PhoneCall className="w-5 h-5 text-[#22c55e]" /></div>
            <span className="text-sm font-medium text-muted">Khách hàng</span>
          </div>
          <p className="text-3xl font-bold text-[#171717]">{o.customerCount || 0}</p>
          <p className="text-xs text-muted mt-1">Tổng số</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 grid place-items-center"><DollarSign className="w-5 h-5 text-[#f59e0b]" /></div>
            <span className="text-sm font-medium text-muted">Chi phí QC</span>
          </div>
          <p className="text-3xl font-bold text-[#171717]">{Number(o.adCostTotal || 0).toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-muted mt-1">Trong kỳ</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 grid place-items-center"><Users className="w-5 h-5 text-[#7c3aed]" /></div>
            <span className="text-sm font-medium text-muted">Nhân sự</span>
          </div>
          <p className="text-3xl font-bold text-[#171717]">{o.userCount || 0}</p>
          <p className="text-xs text-muted mt-1">Tổng số</p>
        </div>
      </div>

      {/* KPI vs Actual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 grid place-items-center"><Target className="w-5 h-5 text-blue-600" /></div>
            <div><span className="text-sm font-medium text-muted">KPI Mục tiêu</span><p className="text-xs text-muted">Tổng đơn</p></div>
          </div>
          <p className="text-2xl font-bold text-[#171717]">{o.kpiOrders || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 grid place-items-center"><ShoppingCart className="w-5 h-5 text-green-600" /></div>
            <div><span className="text-sm font-medium text-muted">Đơn thực tế</span><p className="text-xs text-muted">Tổng đơn</p></div>
          </div>
          <p className="text-2xl font-bold text-[#171717]">{o.actualOrders || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 grid place-items-center"><TrendingUp className="w-5 h-5 text-rose-600" /></div>
            <div><span className="text-sm font-medium text-muted">% KPI</span><p className="text-xs text-muted">Thực tế / Mục tiêu</p></div>
          </div>
          <p className={'text-2xl font-bold ' + kpiCol}>{o.kpiPct || 0}%</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
            <div className={'h-2 rounded-full transition-all ' + (o.kpiPct >= 100 ? 'bg-green-500' : o.kpiPct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
              style={{width: Math.min(o.kpiPct || 0, 100) + '%'}} />
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-[#171717]">Thống kê theo Team</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.teams}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{fontSize: 12}} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="reportCount" name="Báo cáo" fill="#4f46e5" radius={[6,6,0,0]} />
            <Bar dataKey="customerCount" name="KH mới" fill="#22c55e" radius={[6,6,0,0]} />
            <Bar dataKey="actualOrders" name="Đơn thực tế" fill="#f59e0b" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Team cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {data.teams?.map((t: any) => {
          const pct = t.kpiOrders > 0 ? Math.round(t.actualOrders / t.kpiOrders * 100) : 0;
          return (
            <div key={t.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl grid place-items-center text-white font-bold text-sm shadow-sm" style={{backgroundColor: t.color}}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-[#171717]">{t.name}</h3>
                  <p className="text-xs text-muted flex items-center gap-1"><Users size={12} />{t.memberCount} thành viên</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><span className="text-muted">Báo cáo:</span> <span className="font-semibold">{t.reportCount}</span></div>
                <div><span className="text-muted">KH mới:</span> <span className="font-semibold">{t.customerCount}</span></div>
                <div><span className="text-muted">CP QC:</span> <span className="font-semibold">{Number(t.adCostTotal||0).toLocaleString('vi-VN')}đ</span></div>
                <div><span className="text-muted">Tasks:</span> <span className="font-semibold">{Object.values(t.tasks||{}).reduce((a:number,b:number)=>a+b,0)||0}</span></div>
                <div><span className="text-muted">Đơn mục tiêu:</span> <span className="font-semibold">{t.kpiOrders}</span></div>
                <div><span className="text-muted">Đơn thực tế:</span> <span className="font-semibold">{t.actualOrders}</span></div>
                <div className="col-span-2 mt-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted">%KPI</span>
                    <span className={'font-bold ' + (pct >= 100 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500')}>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={'h-1.5 rounded-full ' + (pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{width: Math.min(pct, 100) + '%'}} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}