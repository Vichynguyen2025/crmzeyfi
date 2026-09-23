import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, ClipboardList, DollarSign, PhoneCall, Package, Globe, ShoppingCart, Target, TrendingUp, Activity, FileText, BarChart2, Layers, Zap, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#7c3aed', '#06b6d4', '#f97316', '#ec4899'];
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

  const load = useCallback(() => {
    const { from, to } = calcDates(period);
    api('/dashboard?from=' + from + '&to=' + to).then(setData).catch(() => {});
  }, [period]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    const sock = getSocket();
    const handler = () => load();
    sock.on('report:new', handler); sock.on('task:new', handler); sock.on('customer:new', handler);
    sock.on('channel:update', handler); sock.on('drive:update', handler); sock.on('activity:new', handler);
    return () => { sock.off('report:new', handler); sock.off('task:new', handler); sock.off('customer:new', handler);
      sock.off('channel:update', handler); sock.off('drive:update', handler); sock.off('activity:new', handler); };
  }, [load]);

  if (!data) return <div className="flex h-80 items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-[#4f46e5] border-t-transparent rounded-full" /></div>;

  const o = data.overall || {};
  const logs = data.activityLogs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-muted mt-1">Tổng quan hiệu suất CRM — Quản lý tình hình kinh doanh</p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl border border-border shadow-sm">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={'px-4 py-2 text-sm font-medium transition-all first:rounded-l-xl last:rounded-r-xl ' + (period === p.key ? 'bg-primary text-white shadow-sm' : 'hover:bg-gray-50 text-muted')}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Daily KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Đơn hàng', val: o.todayOrders, unit: '', icon: ShoppingCart, color: 'indigo' },
          { label: 'Chi phí', val: o.todayCost, unit: 'đ', icon: DollarSign, color: 'amber', fmt: true },
          { label: 'Tin nhắn', val: o.todayMessages, unit: '', icon: Activity, color: 'blue' },
          { label: 'Reach', val: o.todayReach, unit: '', icon: Users, color: 'purple' },
          { label: 'Click', val: o.todayClicks, unit: '', icon: Target, color: 'emerald' },
          { label: 'Huỷ', val: o.todayCancelled, unit: '', icon: ShieldAlert, color: 'red' },
        ].map((c, i) => {
          const v = c.fmt ? Number(c.val || 0).toLocaleString('vi-VN') + c.unit : String(c.val || 0) + c.unit;
          return (
            <div key={i} className="bg-white rounded-xl border border-border shadow-sm p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-xs text-muted mb-2">
                <c.icon size={14} className={'text-' + c.color + '-500'} />
                <span>{c.label}</span>
              </div>
              <p className="text-xl font-bold text-ink truncate">{v}</p>
              <p className="text-xs text-muted mt-0.5">Hôm nay</p>
            </div>
          );
        })}
      </div>

      {/* Per-Team Performance — modern redesign */}
      {data.teams?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center"><Target size={16} className="text-white" /></div>
            <div>
              <h2 className="text-lg font-bold text-ink">Tình hình Kinh doanh</h2>
              <p className="text-xs text-muted">Dữ liệu Bảng B2 — Mục tiêu vs Thực tế</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {data.teams.map((t: any) => {
              const pct = t.kpiOrders > 0 ? Math.round(t.actualOrders / t.kpiOrders * 100) : 0;
              const cpOrder = t.actualOrders > 0 ? Math.round(t.actualCosts / t.actualOrders) : 0;
              const gap = t.kpiOrders - t.actualOrders;
              const barWidth = Math.min(pct, 100);
              const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
              const gradientId = 'grad-' + t.id?.slice(0,6);
              return (
                <div key={t.id} className="relative bg-white rounded-2xl border border-border shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300">
                  {/* Top accent bar */}
                  <div className={'h-1 w-full ' + (pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500')} />

                  <div className="px-6 py-5">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl grid place-items-center text-white font-bold text-sm shadow-md transition-transform group-hover:scale-105" 
                          style={{backgroundColor: t.color || '#4f46e5'}}>
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-ink text-base">{t.name}</h3>
                          <p className="text-xs text-muted flex items-center gap-1">
                            <Users size={12} /> {t.memberCount || 0} thành viên
                          </p>
                        </div>
                      </div>
                      {/* KPI badge */}
                      <div className={'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm ' + 
                        (pct >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                         pct >= 40 ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                         'bg-rose-50 border-rose-200 text-rose-700')}>
                        <div className={'w-2 h-2 rounded-full ' + (pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500')} />
                        {pct}%
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted">Tiến độ KPI</span>
                        <span className="font-semibold text-ink">{t.actualOrders}/{t.kpiOrders} đơn</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={'h-full rounded-full transition-all duration-700 ease-out ' + barColor}
                          style={{width: barWidth + '%'}}>
                          <div className="h-full w-full bg-gradient-to-r from-white/20 to-transparent" />
                        </div>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50/80 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted mb-1">Mục tiêu</p>
                        <p className="text-base font-bold text-ink">{t.kpiOrders}</p>
                        <p className="text-xs text-muted">đơn</p>
                      </div>
                      <div className="bg-indigo-50/80 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted mb-1">Thực tế</p>
                        <p className="text-base font-bold text-primary">{t.actualOrders}</p>
                        <p className="text-xs text-muted">đơn</p>
                      </div>
                      <div className={'rounded-xl p-3 text-center ' + (gap > 0 ? 'bg-rose-50/80' : 'bg-emerald-50/80')}>
                        <p className="text-xs text-muted mb-1">Còn thiếu</p>
                        <p className={'text-base font-bold ' + (gap > 0 ? 'text-rose-600' : 'text-emerald-600')}>{gap > 0 ? gap : '0'}</p>
                        <p className="text-xs text-muted">đơn</p>
                      </div>
                    </div>

                    {/* Bottom details row */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50 text-xs">
                      <div className="flex items-center gap-4">
                        <span className="text-muted">CP/Đơn: <b className="text-ink">{cpOrder > 0 ? cpOrder.toLocaleString('vi-VN') + 'đ' : '—'}</b></span>
                        <span className="text-muted">Chi phí: <b className="text-ink">{Number(t.actualCosts || 0).toLocaleString('vi-VN')}đ</b></span>
                      </div>
                      <span className="text-muted">CP QC: <b className="text-primary">{Number(t.adCostTotal || 0).toLocaleString('vi-VN')}đ</b></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Charts      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-ink">Mục tiêu vs Thực tế</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.teams}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{fontSize: 11}} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="kpiOrders" name="Mục tiêu" fill="#a5b4fc" radius={[4,4,0,0]} />
              <Bar dataKey="actualOrders" name="Thực tế" fill="#4f46e5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-ink">Chi phí theo Team</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.teams}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{fontSize: 11}} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="actualCosts" name="Chi phí" fill="#4f46e5" radius={[4,4,0,0]} />
              <Bar dataKey="adCostTotal" name="CP QC" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Feed + Module Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-gray-50/60 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Activity size={15} className="text-primary" /> Hoạt động gần đây</h3>
            <span className="text-xs text-muted">Realtime</span>
          </div>
          <div className="divide-y divide-border/50 max-h-[340px] overflow-y-auto">
            {logs.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted">Chưa có hoạt động</div>}
            {logs.map((log: any, i: number) => (
              <div key={log.id || i} className="px-5 py-2.5 flex items-start gap-3 hover:bg-gray-50/60 transition-all">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold mt-0.5 shrink-0">
                  {(log.user_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs"><span className="font-medium">{log.user_name || 'Hệ thống'}</span>
                    <span className="mx-1">·</span>
                    <span className="text-muted">{log.action === 'grant' ? 'Cấp quyền' : log.action === 'revoke' ? 'Thu hồi' : log.action === 'update' ? 'Cập nhật' : log.action}</span>
                    <span className="mx-1">·</span>
                    <span className="font-medium">{log.module}</span></p>
                  <p className="text-xs text-muted mt-0.5 truncate">{log.entity || ''}{log.detail ? ' — ' + log.detail.slice(0,60) : ''}</p>
                </div>
                <span className="text-xs text-muted shrink-0">{log.timeAgo || ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-gray-50/60">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Layers size={15} className="text-primary" /> Tổng quan Module</h3>
          </div>
          <div className="divide-y divide-border/50">
            {[
              { label: 'Báo cáo', val: o.reportCount, icon: ClipboardList, color: '#4f46e5' },
              { label: 'Khách hàng', val: o.customerCount, icon: PhoneCall, color: '#22c55e' },
              { label: 'Sản phẩm', val: o.productCount, icon: Package, color: '#f59e0b' },
              { label: 'Kênh MKT', val: o.channelCount, icon: Globe, color: '#7c3aed' },
              { label: 'Nhân sự', val: o.userCount, icon: Users, color: '#06b6d4' },
              { label: 'File Drive', val: o.reportCount, icon: FileText, color: '#f97316' },
            ].map((m, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-all">
                <div className="w-8 h-8 rounded-lg grid place-items-center" style={{backgroundColor: m.color + '15'}}>
                  <m.icon size={14} style={{color: m.color}} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted">{m.label}</p>
                  <p className="text-sm font-bold text-ink">{m.val || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
