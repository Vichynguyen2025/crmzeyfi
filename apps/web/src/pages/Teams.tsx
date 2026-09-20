import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, X, Phone, Mail, Shield, Edit3, Trash2, BarChart3, Globe, ExternalLink, User, CheckCircle, AlertCircle, Target , Lock} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { slugify } from '../lib/utils';
import { getSocket } from '../lib/socket';

const COLORS = ['#4f46e5','#f59e0b','#22c55e','#ec4899','#06b6d4','#f97316','#8b5cf6'];
const ROLE_LABELS: Record<string,string> = {admin:'Quản trị',manager:'Quản lý',member:'Nhân sự'};

export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [tablePerms, setTablePerms] = useState<string[]>([]);
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
  const [actualRows, setActualRows] = useState<any[]>([]);
  const [kpiMonth, setKpiMonth] = useState(new Date().toISOString().slice(0, 7));
  const [kpiFilter, setKpiFilter] = useState({search:'',product:''});
  const [actualFilter, setActualFilter] = useState({search:'',product:''});
  const [planData, setPlanData] = useState<any[]>([]);
  const [b6Data, setB6Data] = useState<any[]>([]);
  const [b6GroupBy, setB6GroupBy] = useState('day');
  const [b6Month, setB6Month] = useState(() => new Date().toISOString().slice(0, 7));
  const [b6DateFrom, setB6DateFrom] = useState('');
  const [b6DateTo, setB6DateTo] = useState('');
  const [planMonth, setPlanMonth] = useState(new Date().toISOString().slice(0, 7));
  const [slugMap, setSlugMap] = useState<Record<string,any>>({});
  const { teamSlug } = useParams();
  const nav = useNavigate();
  const [actualMonth, setActualMonth] = useState(new Date().toISOString().slice(0, 7));
  const [actualDateFrom, setActualDateFrom] = useState('');
  const [actualView, setActualView] = useState<'day'|'week'|'month'>('month');
  const [dailyUser, setDailyUser] = useState<any>(null);
  const [dailyRows, setDailyRows] = useState<any[]>([]);
  const [dailyProduct, setDailyProduct] = useState('');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0, 10));
  const [products, setProducts] = useState<any[]>([]);

  // Auto-save Actuals data with debounce
  // Actuals are auto-calculated from daily data, no manual save needed

  const canEdit = (t: string) => tablePerms.includes(t);

  // Auto-save KPI data with debounce
  useEffect(() => {
    if (!selectedTeam || kpiRows.length === 0) return;
    const timer = setTimeout(async () => {
      try { await api('/kpis/' + selectedTeam.id, { method:'POST', body:JSON.stringify({rows: kpiRows, month: kpiMonth}) }); }
      catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [kpiRows, kpiMonth, selectedTeam?.id]);

  const updateActual = (idx: number, field: string, val: any) => { if (!canEdit('b2')) return;
    const rows = [...actualRows];
    if (idx < rows.length) { rows[idx] = {...rows[idx], [field]: val}; setActualRows(rows); }
  };

  const addActualRow = (afterIdx: number) => { if (!canEdit('b2')) return;
    const rows = [...actualRows];
    const ref = rows[afterIdx];
    const newRow = {name: ref.name, userId: ref.userId, product: '', actualOrders: 0, fixedCost: 0, costPerOrder: 0};
    rows.splice(afterIdx + 1, 0, newRow);
    setActualRows(rows);
  };

  const addKpiRow = (afterIdx: number) => { if (!canEdit('b1')) return;
    const rows = [...kpiRows];
    const ref = rows[afterIdx];
    // Insert new row after the current one, with same user
    const newRow = {name: ref.name, userId: ref.userId, product: '', budget: 0, messages: 0, orders: 0};
    rows.splice(afterIdx + 1, 0, newRow);
    setKpiRows(rows);
  };

  const deleteKpiRow = (idx: number) => {
    const rows = [...kpiRows];
    if (rows.length > 2 && idx < rows.length - 1) {
      rows.splice(idx, 1);
      setKpiRows(rows);
    }
  };

  const updateKpi = (idx: number, field: string, val: any) => { if (!canEdit('b1')) return;
    const rows = [...kpiRows];
    if (idx < rows.length) { rows[idx] = {...rows[idx], [field]: val}; setKpiRows(rows); }
  };

  const loadDailyWithProduct = async (userId: string, product: string) => {
    if (!selectedTeam) return;
    try {
      const url = '/daily-perf/' + selectedTeam.id + '/' + userId + '?month=' + actualMonth + (product ? '&product=' + product : '');
      const saved = await api(url);
      if (saved && saved.length > 0) {
        setDailyRows(saved.map((s: any) => ({id: s.id, date: s.date?.split('T')[0] || '', product: s.product || '', totalCost: s.total_cost || 0, reach: s.reach || 0, clicks: s.clicks || 0, messages: s.messages || 0, orders: s.orders || 0, cancelledOrders: s.cancelled_orders || 0})));
      } else {
        setDailyRows([{date: dailyDate, product: product || '', totalCost: 0, reach: 0, clicks: 0, messages: 0, orders: 0, cancelledOrders: 0}]);
      }
    } catch {
      setDailyRows([{date: dailyDate, product: product || '', totalCost: 0, reach: 0, clicks: 0, messages: 0, orders: 0, cancelledOrders: 0}]);
    }
  };

  const loadDaily = async (userId: string) => {
    if (!selectedTeam) return;
    try {
      const url = '/daily-perf/' + selectedTeam.id + '/' + userId + '?month=' + actualMonth + (dailyProduct ? '&product=' + dailyProduct : '');
      const saved = await api(url);
      if (saved && saved.length > 0) {
        setDailyRows(saved.map((s: any) => ({id: s.id, date: s.date?.split('T')[0] || '', product: s.product || '', totalCost: s.total_cost || 0, reach: s.reach || 0, clicks: s.clicks || 0, messages: s.messages || 0, orders: s.orders || 0, cancelledOrders: s.cancelled_orders || 0})));
      } else {
        // Init with one empty row for today
        setDailyRows([{date: dailyDate, product: dailyProduct || '', totalCost: 0, reach: 0, clicks: 0, messages: 0, orders: 0, cancelledOrders: 0}]);
      }
    } catch {
      setDailyRows([{date: dailyDate, product: dailyProduct || '', totalCost: 0, reach: 0, clicks: 0, messages: 0, orders: 0, cancelledOrders: 0}]);
    }
  };

  // Auto-save daily data with debounce
  useEffect(() => {
    if (!selectedTeam || !dailyUser || dailyRows.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        await api('/daily-perf/' + selectedTeam.id + '/' + dailyUser.userId, { method:'POST', body:JSON.stringify({rows: dailyRows, month: actualMonth}) });
        // Also refresh actuals
        if (selectedTeam) loadActuals(selectedTeam.id, actualMonth, members);
      } catch {}
    }, 1500);
    return () => clearTimeout(timer);
  }, [dailyRows, dailyUser?.userId, actualMonth]);

  const addDailyRow = () => { if (!canEdit('b3')) return;
    setDailyRows([...dailyRows, {date: new Date().toISOString().slice(0, 10), product: dailyProduct, totalCost: 0, reach: 0, clicks: 0, messages: 0, orders: 0, cancelledOrders: 0}]);
  };

  const updateDaily = (idx: number, field: string, val: any) => { if (!canEdit('b3')) return;
    const rows = [...dailyRows];
    if (idx < rows.length) { rows[idx] = {...rows[idx], [field]: val}; setDailyRows(rows); }
  };

  const loadActuals = async (teamId: string, month: string, memberList?: any[]) => {
    try {
      const p = new URLSearchParams({month, groupBy: actualView}); if (actualDateFrom) p.set('dateFrom', actualDateFrom); const saved = await api('/actuals/' + teamId + '?' + p.toString());
      if (saved && saved.length > 0) {
        const filtered = saved.filter((s: any) => s.product && s.product.trim() !== '');
        const merged = [...filtered.map((s: any) => ({name: s.userName || s.name, userId: s.user_id || s.userId, product: s.product || '', period: s.periodLabel || '', actualOrders: Number(s.actualOrders || s.actual_orders || 0), fixedCost: Number(s.fixedCost || s.fixed_cost || 0), costPerOrder: Number(s.costPerOrder || s.cost_per_order || 0)}))];
        // Auto-add members chưa có dòng trong B2
        const list = memberList || members;
        if (list && list.length > 0) {
          const existing = new Set(merged.map((r: any) => r.userId));
          list.forEach((m: any) => {
            if (!existing.has(m.id)) {
              merged.push({ name: m.name, userId: m.id, product: '', period: '', actualOrders: 0, fixedCost: 0, costPerOrder: 0 });
              existing.add(m.id);
            }
          });
        }
        setActualRows([...merged, {type: 'total'}]);
        return true;
      }
    } catch {}
    // Init with member list
    const list = memberList || members;
    if (list && list.length > 0) {
      setActualRows([...list.map((m: any) => ({name: m.name, userId: m.id, product: '', actualOrders: 0, fixedCost: 0, costPerOrder: 0})), {type: 'total'}]);
      return true;
    }
    setActualRows([]);
    return false;
  };

  const loadKpi = async (teamId: string, month: string) => {
    try {
      const saved = await api('/kpis/' + teamId + '?month=' + month);
      if (saved && saved.length > 0) {
        setKpiRows([...saved.map((s: any) => ({name: s.name, userId: s.user_id, product: s.product || '', budget: s.daily_budget || 0, messages: s.daily_messages || 0, orders: s.monthly_orders || 0})), {type: 'total'}]);
        return true;
      }
      // Fallback: try without month filter (old data)
      const fallback = await api('/kpis/' + teamId);
      if (fallback && fallback.length > 0) {
        setKpiRows([...fallback.map((s: any) => ({name: s.name, userId: s.user_id, product: s.product || '', budget: s.daily_budget || 0, messages: s.daily_messages || 0, orders: s.monthly_orders || 0})), {type: 'total'}]);
        return true;
      }
    } catch {}
    return false;
  };

  const showToast = (t: 'success'|'error', msg: string) => {
    setToast({type:t, message:msg});
    setTimeout(() => setToast(null), 3000);
  };

  const loadB6 = useCallback(async () => {
    try {
      let url = '/actuals-summary?month=' + b6Month + '&groupBy=product&viewMode=' + b6GroupBy;
      if (b6GroupBy === 'day' || b6GroupBy === 'week') {
        if (b6DateFrom) url += '&dateFrom=' + b6DateFrom;
        if (b6DateTo) url += '&dateTo=' + b6DateTo;
      }
      const r = await api(url);
      setB6Data(r || []);
    } catch { setB6Data([]); }
  }, [b6Month, b6GroupBy, b6DateFrom, b6DateTo]);
  useEffect(() => { loadB6(); }, [loadB6]);

  const loadPlan = async (month: string) => {
    try { const d = await api('/kpis-summary/' + month); setPlanData(d || []); } catch { setPlanData([]); }
  };

  const load = () => { api('/teams').then(setTeams); api('/users').then(setUsers).catch(() => {});
    const u = JSON.parse(localStorage.getItem('zeyfi_user') || '{}');
    if (u.role !== 'admin') api('/my-table-perms').then(setTablePerms).catch(() => {});
    else setTablePerms(['b1','b2','b3','b4']);
  };
  useEffect(() => { load(); loadPlan(planMonth); }, []);

  // URL-based team detail
  useEffect(() => {
    if (teamSlug) {
      const team = slugMap[teamSlug];
      if (team) openTeam(team);
      else if (teams.length > 0) {
        const found = teams.find((t: any) => slugify(t.name) === teamSlug);
        if (found) openTeam(found);
      }
    }
  }, [teamSlug, teams, slugMap]);

  // Build slug map when teams load
  useEffect(() => {
    const map: Record<string,any> = {};
    teams.forEach((t: any) => { map[slugify(t.name)] = t; });
    setSlugMap(map);
  }, [teams]);

  // Realtime

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
    const saved = await loadKpi(t.id, kpiMonth);
    loadActuals(t.id, actualMonth, m);
    if (!saved || saved.length === 0) {
      const initial = [];
      m.forEach((u: any) => initial.push({name: u.name, userId: u.id, product: '', budget: 0, messages: 0, orders: 0}));
      initial.push({type: 'total'});
      setKpiRows(initial);
    }
  };

  const addMember = async (userId: string) => {
    if (!userId || !selectedTeam) return;
    await api('/teams/' + selectedTeam.id + '/members', { method:'POST', body:JSON.stringify({userId}) });
    const m = await api('/teams/' + selectedTeam.id + '/members');
    setMembers(m);
    // B2: tự động thêm dòng cho nhân sự mới
    const newM = (m || []).find((mm: any) => mm.id === userId);
    if (newM) {
      setActualRows(prev => {
        const hasRow = prev.some((r: any) => r.type !== 'total' && r.userId === userId);
        if (hasRow) return prev;
        const rows = prev.filter((r: any) => r.type !== 'total');
        return [...rows, {name: newM.name, userId: newM.id, product: '', period: '', actualOrders: 0, fixedCost: 0, costPerOrder: 0}, {type: 'total'}];
      });
    }
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
            <button onClick={() => { setSelectedTeam(null); nav('/crm/teams'); }} className="px-3 py-2 bg-white border border-border rounded-xl text-sm hover:bg-gray-50 transition-all">← Quay lại</button>
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
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold text-[#171717]">Đề xuất mục tiêu & Ngân sách quảng cáo</h2>
        {!canEdit('b1') && <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-medium"><Lock size={10} /> Chỉ đọc</span>}
      </div>
            <div className="flex items-center gap-2">
              <input type="month" value={kpiMonth} onChange={e => { setKpiMonth(e.target.value); loadKpi(selectedTeam?.id, e.target.value); }}
                className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25" />
              <input value={kpiFilter?.search||''} onChange={e=>setKpiFilter(p=>({...p,search:e.target.value}))} placeholder="Lọc nhân sự..." className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs outline-none w-36" />
              <input value={kpiFilter?.product||''} onChange={e=>setKpiFilter(p=>({...p,product:e.target.value}))} placeholder="Lọc sản phẩm..." className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs outline-none w-36" />
            </div>
          </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
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
                  <th className="p-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody>
                {kpiRows.filter((r:any)=>r.type==='total'||!kpiFilter?.search||(r.name||'').toLowerCase().includes(kpiFilter.search.toLowerCase())).filter((r:any)=>r.type==='total'||!kpiFilter?.product||(r.product||'').toLowerCase().includes(kpiFilter.product.toLowerCase())).map((r, i) => {
                  const isTotal = r.type === 'total';
                  const totalBudget = isTotal ? kpiRows.filter((r2: any) => r2.type !== 'total').reduce((s: number, r2: any) => s + (r2.budget || 0), 0) : (r.budget || 0);
                  const totalMessages = isTotal ? kpiRows.filter((r2: any) => r2.type !== 'total').reduce((s: number, r2: any) => s + (r2.messages || 0), 0) : (r.messages || 0);
                  const totalOrders = isTotal ? kpiRows.filter((r2: any) => r2.type !== 'total').reduce((s: number, r2: any) => s + (r2.orders || 0), 0) : (r.orders || 0);
                  const pricePerMsg = totalBudget && totalMessages ? totalBudget / totalMessages : 0;
                  const totalMsgs = totalMessages * 30;
                  const closeRate = totalMsgs > 0 ? (totalOrders / totalMsgs * 100) : 0;
                  const costPerOrder = totalOrders > 0 ? (totalBudget * 30 / totalOrders) : 0;
                  const proposedBudget = totalBudget * 30;
                  return (
                    <tr key={i} className={'border-b border-border hover:bg-gray-50 transition-all ' + (r.type === 'total' ? 'bg-gray-50/80 font-semibold' : '')}>
                      <td className="p-3 text-xs">
                        {r.type !== 'total' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-[7px] font-bold shrink-0">
                              {r.name?.charAt(0) || '?'}
                            </div>
                            <span className="cursor-pointer hover:text-[#4f46e5]" onClick={() => { setDailyUser(r); setDailyProduct(''); loadDaily(r.userId); }}>{r.name}</span>
                          </span>
                        ) : <span className="text-[#4f46e5]">Tổng</span>}
                      </td>
                      <td className="p-3 text-xs">
                        {r.type === 'total' ? '' : (
                          <div className="flex items-center gap-1">
                            <select value={r.product} onChange={e => updateKpi(i, 'product', e.target.value)}
                              className="flex-1 min-w-[80px] px-1.5 py-1.5 bg-white border border-border rounded-lg text-xs outline-none cursor-pointer focus:ring-2 focus:ring-[#4f46e5]/25">
                              <option value="">—</option>
                              {products.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
                              <option value="other">Khác</option>
                            </select>
                            <button onClick={e => { e.stopPropagation(); addKpiRow(i); }} className="p-1 rounded hover:bg-green-50 text-green-500 transition-all" title="Thêm sản phẩm cho nhân sự này">
                              <Plus size={12} />
                            </button>
                          </div>
                        )}</td>
                      <td className="p-3">
                        {r.type !== 'total' ? (
                          <input type="number" value={r.budget || ''} onChange={e => updateKpi(i, 'budget', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" />
                        ) : <span className="block text-right">{totalBudget.toLocaleString('vi-VN')}</span>}
                      </td>
                      <td className="p-3">
                        {r.type !== 'total' ? (
                          <input type="number" value={r.messages || ''} onChange={e => updateKpi(i, 'messages', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" />
                        ) : <span className="block text-right">{totalMessages}</span>}
                      </td>
                      <td className="p-3 text-xs text-right">{pricePerMsg > 0 ? pricePerMsg.toLocaleString('vi-VN', {maximumFractionDigits:0}) : ''}</td>
                      <td className="p-3 text-xs text-right">{totalMsgs > 0 ? totalMsgs.toLocaleString('vi-VN') : ''}</td>
                      <td className="p-3">
                        {r.type !== 'total' ? (
                          <input type="number" value={r.orders || ''} onChange={e => updateKpi(i, 'orders', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" />
                        ) : <span className="block text-right">{totalOrders}</span>}
                      </td>
                      <td className="p-3 text-xs text-right">{closeRate > 0 ? closeRate.toFixed(1) + '%' : ''}</td>
                      <td className="p-3 text-xs text-right">{costPerOrder > 0 ? costPerOrder.toLocaleString('vi-VN', {maximumFractionDigits:0}) + 'đ' : ''}</td>
                      <td className="p-3 text-xs text-right font-bold text-[#4f46e5]">{proposedBudget > 0 ? proposedBudget.toLocaleString('vi-VN') + 'đ' : ''}</td>
                      <td className="p-3 text-center">
                        {r.type !== 'total' && (
                          <button onClick={() => deleteKpiRow(i)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-all" title="Xoá">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actual Performance table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#171717]">Tình hình Thực tế ({actualMonth}) {!canEdit('b2') && <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-medium ml-2"><Lock size={10} /> Chỉ đọc</span>}</h2>
              <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-0.5">
                {['day','week','month'].map(v => (
                  <button key={v} onClick={() => { 
                        const p = new URLSearchParams({month: actualMonth, groupBy: v});
                        if (actualDateFrom) p.set('dateFrom', actualDateFrom);
                       
                        api('/actuals/' + selectedTeam.id + '?' + p.toString()).then(saved => {
                          if (saved && saved.length > 0) {
                            const filtered = saved.filter((s: any) => s.product && s.product.trim() !== '');
                            setActualRows([...filtered.map((s: any) => ({name: s.userName || s.name, userId: s.user_id || s.userId, product: s.product || '', period: s.periodLabel || '', actualOrders: Number(s.actualOrders || s.actual_orders || 0), fixedCost: Number(s.fixedCost || s.fixed_cost || 0), costPerOrder: Number(s.costPerOrder || s.cost_per_order || 0)})), {type: 'total'}]);
                          }
                        }).catch(() => {});
                        setActualView(v as any);
                        setActualDateFrom('');
                        
                      }}
                    className={'px-3 py-1.5 rounded-md text-xs font-medium transition-all ' + (actualView === v ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-muted hover:bg-gray-50')}>{v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="month" value={actualMonth} onChange={e => { const v = e.target.value; setActualMonth(v); if (selectedTeam) loadActuals(selectedTeam.id, v, members); }}
                  className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25" />
                <>
                <input type="date" value={actualDateFrom} onChange={e=>setActualDateFrom(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs outline-none" />
                <button onClick={()=>{if(!selectedTeam)return;const v=actualView;const d=actualDateFrom;const p='month='+actualMonth+'&groupBy='+v+(d?'&dateFrom='+d:'');api('/actuals/'+selectedTeam.id+'?'+p).then((s:any)=>{if(s&&s.length>0){const f=s.filter((x:any)=>x.product&&x.product.trim()!=='');setActualRows([...f.map((x:any)=>({name:x.userName||x.name,userId:x.user_id||x.userId,product:x.product||'',period:x.periodLabel||'',actualOrders:Number(x.actualOrders||x.actual_orders||0),fixedCost:Number(x.fixedCost||x.fixed_cost||0),costPerOrder:Number(x.costPerOrder||x.cost_per_order||0)})),{type:'total'}]);}else{const list=members||[];if(list.length>0){setActualRows([...list.map((m:any)=>({name:m.name,userId:m.id,product:'',period:'',actualOrders:0,fixedCost:0,costPerOrder:0})),{type:'total'}]);}else{setActualRows([{type:'total'}]);}}}).catch(()=>{setActualRows([{type:'total'}]);});}} className="px-3 py-1.5 bg-[#4f46e5] text-white rounded-xl text-xs font-medium">Áp dụng</button>
                </>
                <input value={actualFilter?.search||''} onChange={e=>setActualFilter(p=>({...p,search:e.target.value}))} placeholder="Lọc nhân sự..." className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs outline-none w-36" />
                <input value={actualFilter?.product||''} onChange={e=>setActualFilter(p=>({...p,product:e.target.value}))} placeholder="Lọc sản phẩm..." className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs outline-none w-36" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-36">Nhân sự</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-40">Sản phẩm</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-center w-20" style={{display: actualView==='month'?'none':''}}>Kỳ</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-24">Tổng đơn</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-24">Chi phí QC</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-24">CP/đơn</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-28">Tổng chi phí</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-20">%KPI SP</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-right w-24">%KPI Tổng</th>
                  <th className="p-3 text-xs font-semibold text-muted uppercase text-center w-12"></th>
                </tr>
              </thead>
              <tbody>
                {actualRows.filter((r:any)=>!actualFilter.search || (r.name||'').toLowerCase().includes(actualFilter.search.toLowerCase())).filter((r:any)=>!actualFilter.product || (r.product||'').toLowerCase().includes(actualFilter.product.toLowerCase())).map((r: any, i: number) => {
                  const isTotal = r.type === 'total';
                  const totalActualOrders = actualRows.filter((r2: any) => r2.type !== 'total' && r2.userId === r.userId || false).reduce((s: number, r2: any) => s + (r2.actualOrders || 0), 0);
                  // Find KPI target for this product from kpiRows
                  const kpiTarget = kpiRows.find((k: any) => k.userId === r.userId && k.product === r.product);
                  const kpiMonthly = kpiTarget?.orders || 0;
                  const kpiPct = kpiMonthly > 0 ? (r.actualOrders / kpiMonthly * 100) : 0;
                  // Total KPI for this user
                  const userKpiTotal = kpiRows.filter((k: any) => k.userId === r.userId && k.type !== 'total').reduce((s: number, k: any) => s + (k.orders || 0), 0);
                  const userActualTotal = actualRows.filter((r2: any) => r2.type !== 'total' && r2.userId === r.userId).reduce((s: number, r2: any) => s + (r2.actualOrders || 0), 0);
                  const totalKpiPct = userKpiTotal > 0 ? ((r.actualOrders || 0) / userKpiTotal * 100) : 0;
                  const totalCost = (r.fixedCost || 0) * 1.1;
                  return (
                    <tr key={i} className={'border-b border-border hover:bg-gray-50 transition-all ' + (isTotal ? 'bg-gray-50/80 font-semibold' : '')}>
                      <td className="p-3 text-xs w-36">
                        {!isTotal ? (
                          <span className="inline-flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-[7px] font-bold shrink-0">{r.name?.charAt(0) || '?'}</div>
                            <span className="cursor-pointer hover:text-[#4f46e5]" onClick={() => { setDailyUser(r); setDailyProduct(''); loadDaily(r.userId); }}>{r.name}</span>
                          </span>
                        ) : <span className="text-[#4f46e5]">Tổng</span>}
                      </td>
                      <td className="p-3 text-xs w-40">
                        {!isTotal ? (
                          <div className="flex items-center gap-1">
                            {r.product || <span className="italic">—</span>}
                          </div>
                        ) : ''}
                      </td>
                      <td className="p-3 text-center w-28" style={{display: actualView==='month'?'none':''}}><span className="text-xs text-muted">{actualView==='day' ? (r.period||'').split('-').reverse().join('/') : r.period || ''}</span></td>
                      <td className="p-3 w-24">
                        {isTotal ? <span className="block text-right font-semibold">{actualRows.filter((r2: any) => r2.type !== 'total').reduce((s: number, r2: any) => s + (r2.actualOrders || 0), 0).toLocaleString('vi-VN')}</span> : <span className="block px-2 py-1.5 text-xs font-medium text-right">{Number(r.actualOrders || 0).toLocaleString('vi-VN')}</span>}
                      </td>
                      <td className="p-3 w-24">
                        {isTotal ? <span className="block text-right font-semibold">{actualRows.filter((r2: any) => r2.type !== 'total').reduce((s: number, r2: any) => s + (r2.fixedCost || 0), 0).toLocaleString('vi-VN')}đ</span> : <span className="block px-2 py-1.5 text-xs font-medium text-right">{Number(r.fixedCost || 0).toLocaleString('vi-VN')}đ</span>}
                      </td>
                      <td className="p-3 w-24">
                        {isTotal ? <span className="block text-right font-semibold">{(() => { const totalFixed = actualRows.filter((r2: any) => r2.type !== 'total').reduce((s: number, r2: any) => s + (r2.fixedCost || 0), 0); const totalOrders = actualRows.filter((r2: any) => r2.type !== 'total').reduce((s: number, r2: any) => s + (r2.actualOrders || 0), 0); return totalOrders > 0 ? Math.round(totalFixed / totalOrders).toLocaleString('vi-VN') : 0; })()}đ</span> : <span className="block px-2 py-1.5 text-xs font-medium text-right">{Number(r.costPerOrder || 0).toLocaleString('vi-VN')}đ</span>}
                      </td>
                      <td className="p-3 text-xs text-right font-medium w-28">{isTotal ? (actualRows.filter((r2: any) => r2.type !== 'total').reduce((s: number, r2: any) => s + (r2.fixedCost || 0), 0) * 1.1).toLocaleString('vi-VN') + 'đ' : totalCost.toLocaleString('vi-VN') + 'đ'}</td>
                      <td className="p-3 text-xs text-right w-20">{isTotal ? (actualRows.filter((r2:any)=>r2.type!=='total').reduce((s:number,r2:any)=>s+(r2.actualOrders||0),0) / Math.max(1, kpiRows.filter((k:any)=>k.type!=='total').reduce((s:number,k:any)=>s+(k.orders||0),0)) * 100).toFixed(1) + '%' : kpiPct.toFixed(1) + '%'}</td>
                      <td className="p-3 text-xs text-right w-24">{isTotal ? (actualRows.filter((r2:any)=>r2.type!=='total').reduce((s:number,r2:any)=>s+(r2.actualOrders||0),0) / Math.max(1, kpiRows.filter((k:any)=>k.type!=='total').reduce((s:number,k:any)=>s+(k.orders||0),0)) * 100).toFixed(1) + '%' : totalKpiPct.toFixed(1) + '%'}</td>
                      <td className="p-3 text-center">
                        {!isTotal && (
                          <button onClick={() => { 
                            const rows = [...actualRows]; 
                            if (i < rows.length) { rows.splice(i, 1); setActualRows(rows); }
                            // Also remove from backend via daily data
                          }} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-all" title="Xoá">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {actualRows.length === 0 && (
                  <tr><td colSpan={9} className="p-6 text-center text-sm text-muted">Chưa có dữ liệu thực tế. Chọn tháng và nhập số liệu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Performance Modal */}
      {dailyUser && selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDailyUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-bold text-[#171717]">Chi tiết hiệu suất — {dailyUser.name}</h2>
                <p className="text-xs text-muted mt-0.5">Tháng {actualMonth}</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="date" value={dailyDate} onChange={e => { const v = e.target.value; setDailyDate(v); setDailyRows(dailyRows.map((r: any) => ({...r, date: v}))); }}
                  className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs text-ink outline-none" />
                <select value={dailyProduct} onChange={e => { const v = e.target.value; setDailyProduct(v); setTimeout(() => loadDailyWithProduct(dailyUser.userId, v), 50); }}
                  className="px-3 py-1.5 bg-white border border-border rounded-xl text-xs text-ink outline-none cursor-pointer">
                  <option value="">Tất cả sản phẩm</option>
                  {products.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                
                <button onClick={addDailyRow} className="px-4 py-1.5 bg-[#4f46e5] text-white rounded-xl text-xs font-medium hover:shadow-md transition-all">+ Thêm</button>
                <button onClick={() => setDailyUser(null)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto max-h-[50vh] overflow-y-auto relative">
                <table className="w-full table-fixed text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-border bg-gray-50">
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-left w-24">Ngày</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-left w-28">Sản phẩm</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-24">Tổng chi phí</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-20">Tiếp cận</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-16">Click</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-20">Giá Click</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-14">CTR</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-16">Mess</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-20">Giá Mess</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-20">Đơn hàng</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-20">Tỷ lệ chốt</th>
                      <th className="p-2.5 text-xs font-semibold text-muted uppercase text-right w-20">Đơn huỷ</th>
                          <th className="p-2.5 text-xs font-semibold text-muted uppercase text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.map((r: any, i: number) => {
                      const clickPrice = r.clicks > 0 ? (r.totalCost || 0) / r.clicks : 0;
                      const ctr = r.reach > 0 ? (r.clicks || 0) / r.reach * 100 : 0;
                      const msgPrice = r.messages > 0 ? (r.totalCost || 0) / r.messages : 0;
                      const closeRate = r.messages > 0 ? (r.orders || 0) / r.messages * 100 : 0;
                      return (
                        <tr key={i} className="border-b border-border hover:bg-gray-50 transition-all">
                          <td className="p-2.5 w-24"><input type="date" value={r.date} onChange={e => updateDaily(i, 'date', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" /></td>
                          <td className="p-2.5 w-28">
                            <select value={r.product} onChange={e => updateDaily(i, 'product', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-border rounded-lg text-xs outline-none cursor-pointer">
                              <option value="">—</option>
                              {products.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                          </td>
                          <td className="p-2.5 w-24"><input type="number" value={r.totalCost || ''} onChange={e => updateDaily(i, 'totalCost', Number(e.target.value))} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" /></td>
                          <td className="p-2.5 w-20"><input type="number" value={r.reach || ''} onChange={e => updateDaily(i, 'reach', Number(e.target.value))} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" /></td>
                          <td className="p-2.5 w-16"><input type="number" value={r.clicks || ''} onChange={e => updateDaily(i, 'clicks', Number(e.target.value))} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" /></td>
                          <td className="p-2.5 text-xs text-right font-medium w-20">{clickPrice > 0 ? clickPrice.toLocaleString('vi-VN', {maximumFractionDigits: 0}) + 'đ' : ''}</td>
                          <td className="p-2.5 text-xs text-right w-14">{ctr > 0 ? ctr.toFixed(2) + '%' : ''}</td>
                          <td className="p-2.5 w-16"><input type="number" value={r.messages || ''} onChange={e => updateDaily(i, 'messages', Number(e.target.value))} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" /></td>
                          <td className="p-2.5 text-xs text-right font-medium w-20">{msgPrice > 0 ? msgPrice.toLocaleString('vi-VN', {maximumFractionDigits: 0}) + 'đ' : ''}</td>
                          <td className="p-2.5 w-20"><input type="number" value={r.orders || ''} onChange={e => updateDaily(i, 'orders', Number(e.target.value))} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" /></td>
                          <td className="p-2.5 text-xs text-right font-bold w-20">{closeRate > 0 ? closeRate.toFixed(1) + '%' : ''}</td>
                          <td className="p-2.5 w-20"><input type="number" value={r.cancelledOrders || ''} onChange={e => updateDaily(i, 'cancelledOrders', Number(e.target.value))} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="0" /></td>
                          <td className="p-2.5 text-center">
                            <button onClick={() => { const rows = [...dailyRows]; rows.splice(i, 1); setDailyRows(rows); }} className="p-1 rounded hover:bg-red-50 text-red-400 transition-all" title="Xoá">
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                                           {dailyRows.length > 0 && (
                                             <tr className="bg-gray-50/80 font-semibold border-t-2 border-border sticky bottom-0 z-10">
                                               <td className="p-2.5 w-24 text-xs font-bold text-[#4f46e5]">Tổng</td>
                                               <td className="p-2.5 w-28"></td>
                                               <td className="p-2.5 w-24 text-xs text-right">{dailyRows.reduce((s, r) => s + (r.totalCost || 0), 0).toLocaleString('vi-VN')}</td>
                                               <td className="p-2.5 w-20 text-xs text-right">{dailyRows.reduce((s, r) => s + (r.reach || 0), 0)}</td>
                                               <td className="p-2.5 w-16 text-xs text-right">{dailyRows.reduce((s, r) => s + (r.clicks || 0), 0)}</td>
                                               <td className="p-2.5 w-20 text-xs text-right font-medium">{(()=>{const tc=dailyRows.reduce((s,r)=>s+(r.totalCost||0),0);const cl=dailyRows.reduce((s,r)=>s+(r.clicks||0),0);return cl>0?Math.round(tc/cl).toLocaleString('vi-VN')+'đ':'';})()}</td>
                                               <td className="p-2.5 w-14 text-xs text-right">{(()=>{const rch=dailyRows.reduce((s,r)=>s+(r.reach||0),0);const cl=dailyRows.reduce((s,r)=>s+(r.clicks||0),0);return rch>0?(cl/rch*100).toFixed(2)+'%':'';})()}</td>
                                               <td className="p-2.5 w-16 text-xs text-right">{dailyRows.reduce((s, r) => s + (r.messages || 0), 0)}</td>
                                               <td className="p-2.5 w-20 text-xs text-right font-medium">{(()=>{const tc=dailyRows.reduce((s,r)=>s+(r.totalCost||0),0);const ms=dailyRows.reduce((s,r)=>s+(r.messages||0),0);return ms>0?Math.round(tc/ms).toLocaleString('vi-VN')+'đ':'';})()}</td>
                                               <td className="p-2.5 w-20 text-xs text-right">{dailyRows.reduce((s, r) => s + (r.orders || 0), 0)}</td>
                                               <td className="p-2.5 w-20 text-xs text-right font-bold">{(()=>{const ms=dailyRows.reduce((s,r)=>s+(r.messages||0),0);const od=dailyRows.reduce((s,r)=>s+(r.orders||0),0);return ms>0?(od/ms*100).toFixed(1)+'%':'';})()}</td>
                                               <td className="p-2.5 w-20 text-xs text-right">{dailyRows.reduce((s, r) => s + (r.cancelledOrders || 0), 0)}</td>
                                             </tr>
                                           )}
                                         {dailyRows.length === 0 && <tr><td colSpan={13} className="p-6 text-center text-sm text-muted">Chưa có dữ liệu. Chọn ngày và thêm dòng.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={async () => {
                  await api('/daily-perf/' + selectedTeam.id + '/' + dailyUser.userId, { method:'POST', body:JSON.stringify({rows: dailyRows, month: actualMonth}) });
                  loadActuals(selectedTeam.id, actualMonth, members);
                  showToast('success', 'Đã lưu dữ liệu chi tiết hiệu suất');
                  setDailyUser(null);
                }} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:shadow-md transition-all">Lưu & Đóng</button>
                <button onClick={() => setDailyUser(null)} className="px-5 py-2.5 bg-gray-100 text-muted rounded-xl text-sm font-medium">Huỷ</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div><h1 className="text-2xl font-bold text-[#171717]">Kinh doanh 3M</h1><p className="text-sm text-muted mt-1">Quản lý kế hoạch kinh doanh 3 team</p></div>
        <button onClick={() => setAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
          <Plus size={18} />Thêm team</button>
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

      
      {/* Business Plan 3M */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-sm font-bold">3M</div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-[#171717]">Kế hoạch Kinh doanh 3M</h2>
              <span className="px-2 py-0.5 bg-[#4f46e5]/10 text-[#4f46e5] text-[10px] font-semibold rounded-md">Tổng quan</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="month" value={planMonth} onChange={e => { setPlanMonth(e.target.value); loadPlan(e.target.value); }}
                className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-ink outline-none cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full" style={{tableLayout:'fixed', borderCollapse:'separate', borderSpacing:0}}>
            <thead>
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-left" style={{width:200}}>Team</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-left" style={{width:160}}>Sản phẩm</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:100}}>Mục tiêu</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:120}}>Ngân sách</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:100}}>CP/đơn</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-center" style={{width:80}}>TV</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:100}}>%KPI</th>
              </tr>
            </thead>
            <tbody>
              {planData.map((team: any, ti: number) => {
                const totalCostPerOrder = team.totalTarget > 0 ? Math.round((team.totalBudget * 30) / team.totalTarget) : 0;
                return (
                  <tr key={team.id} className="border-b border-border/50 hover:bg-[#f8f9fc] transition-all">
                    <td className="px-4 py-3.5 text-xs font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shadow-sm" style={{backgroundColor: team.color || '#4f46e5'}}>
                          {team.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <button onClick={() => nav('/crm/teams/' + slugify(team.name))} className="font-medium text-[#171717] hover:text-[#4f46e5] transition-colors">{team.name}</button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {team.products.length > 0 ? (
                        <div className="space-y-1">
                          {team.products.map((p: any, pi: number) => (
                            <div key={pi} className="flex items-center justify-between gap-3">
                              <span className="text-xs text-ink">{p.name || <span className="italic text-muted">—</span>}</span>
                              <span className="text-[11px] text-muted">{p.target ? p.target.toLocaleString('vi-VN') + ' đơn' : ''}</span>
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-xs italic text-muted/60">Chưa có KPI</span>}
                    </td>
                    <td className="p-4 text-xs text-right font-medium align-top">{team.totalTarget > 0 ? team.totalTarget.toLocaleString('vi-VN') : ''}</td>
                    <td className="p-4 text-xs text-right align-top">{team.totalBudget > 0 ? (team.totalBudget * 30).toLocaleString('vi-VN') + 'đ' : ''}</td>
                    <td className="p-4 text-xs text-right align-top">{totalCostPerOrder > 0 ? totalCostPerOrder.toLocaleString('vi-VN') + 'đ' : ''}</td>
                    <td className="p-4 text-xs text-center align-top">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-muted font-medium text-xs">{team.memberCount || 0}</span>
                    </td>
                    <td className="p-4 text-xs text-right font-bold align-top">
                      {(() => { const totalAllTarget = planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0); return team.totalActual > 0 && totalAllTarget > 0 ? <span className="text-[#4f46e5]">{Math.round(team.totalActual / totalAllTarget * 100)}%</span> : <span className="text-muted italic">—</span>; })()}
                    </td>
                  </tr>
                );
              })}
              {/* Total row */}
              {planData.length > 0 && (
                <tr className="bg-[#f8f9fc] font-semibold border-t-2 border-[#e2e4e7]">
                  <td colSpan={2} className="px-4 py-3.5 text-xs font-bold text-[#4f46e5]">Tổng cộng</td>
                  <td className="px-4 py-3.5 text-xs text-right font-semibold">{planData.reduce((s: number, t: any) => s + (t.totalTarget || 0), 0).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3.5 text-xs text-right font-semibold">{planData.reduce((s: number, t: any) => s + (t.totalBudget || 0) * 30, 0).toLocaleString('vi-VN') + 'đ'}</td>
                  <td className="px-4 py-3.5 text-xs text-right font-semibold">{planData.reduce((s: number, t: any) => s + (t.totalTarget || 0), 0) > 0 ? Math.round(planData.reduce((s: number, t: any) => s + (t.totalBudget || 0) * 30, 0) / planData.reduce((s: number, t: any) => s + (t.totalTarget || 0), 0)).toLocaleString('vi-VN') + 'đ' : ''}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-semibold">{planData.reduce((s: number, t: any) => s + (t.memberCount || 0), 0)}</td>
                  <td className="px-4 py-3.5 text-xs text-right font-bold text-[#4f46e5]">{(()=>{const a=planData.reduce((s:number,t:any)=>s+(t.totalActual||0),0);const b=planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0);return a>0&&b>0?Math.round(a/b*100)+'%':'—';})()}</td>
                </tr>
              )}
              {planData.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Target size={32} className="text-muted opacity-20" />
                    <p className="font-medium">Chưa có dữ liệu kế hoạch</p>
                    <p className="text-xs text-muted">Vào team và nhập KPI để thấy dữ liệu</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* B6 - Tổng tinh hinh kinh doanh pivot */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gray-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white text-xs font-bold">B6</div>
            <div>
              <h2 className="text-sm font-bold text-[#171717]">Tổng tình hình kinh doanh thực tế</h2>
              <p className="text-xs text-muted">Dữ liệu B2 — Tổng hợp theo team & sản phẩm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="month" value={b6Month} onChange={e => setB6Month(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
            {b6GroupBy === 'day' && <>
              <input type="date" value={b6DateFrom} onChange={e => setB6DateFrom(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
              <span className="text-xs text-muted">→</span>
              <input type="date" value={b6DateTo} onChange={e => setB6DateTo(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
            </>}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-0.5">
              {['day','week','month'].map(v => (
                <button key={v} onClick={() => setB6GroupBy(v)}
                  className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' + (b6GroupBy===v ? 'bg-[#4f46e5] text-white' : 'text-muted hover:text-ink')}>
                  {v==='day' ? 'Ngày' : v==='week' ? 'Tuần' : 'Tháng'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{tableLayout:'fixed', borderCollapse:'separate', borderSpacing:0}}>
            <thead>
              <tr className="bg-gray-50/80 border-b border-border">
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-left" style={{width:150}}>Team</th>
                {((b6Data as any)?.products || []).map((p: string) => (
                  <th key={p} className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:140}} colSpan={2}>{p}</th>
                ))}
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:100}}>Tổng Đơn</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:100}}>Tổng CP</th>
              </tr>
            </thead>
            <tbody>
              {!b6Data || ((b6Data as any)?.teams || []).length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-muted">Chưa có dữ liệu</td></tr>
              ) : ((b6Data as any).teams).map((team: any) => {
                  const data = ((b6Data as any).data || {})[team.id] || {};
                  const products = (b6Data as any).products || [];
                  let teamTotalOrders = 0, teamTotalCost = 0;
                  return (
                    <tr key={team.id} className="border-b border-border/50 hover:bg-gray-50/60 transition-all">
                      <td className="px-4 py-3 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md grid place-items-center text-white text-[8px] font-bold" style={{backgroundColor: team.color || '#4f46e5'}}>{team.name.charAt(0)}</div>
                          <span>{team.name}</span>
                        </div>
                      </td>
                      {products.map(p => {
                        const d = data[p];
                        const o = d?.orders || 0;
                        const c = d?.cost || 0;
                        teamTotalOrders += o;
                        teamTotalCost += c;
                        return (
                          <React.Fragment key={p}>
                            <td className="px-3 py-3 text-xs text-right font-medium">{o.toLocaleString('vi-VN')}</td>
                            <td className="px-3 py-3 text-xs text-right text-muted">{c > 0 ? c.toLocaleString('vi-VN')+'d' : '-'}</td>
                          </React.Fragment>
                        );
                      })}
                      <td className="px-4 py-3 text-xs text-right font-bold text-[#4f46e5]">{teamTotalOrders}</td>
                      <td className="px-4 py-3 text-xs text-right font-bold">{teamTotalCost > 0 ? teamTotalCost.toLocaleString('vi-VN')+'d' : '-'}</td>
                    </tr>
                  );
                })}
              {/* Tổng cộng */}
              {((b6Data as any)?.teams || []).length > 0 && (
                <tr className="bg-gray-50/70 border-t-2 border-border font-medium">
                  <td className="px-4 py-3 text-xs font-bold text-[#171717]">Tổng cộng</td>
                  {(b6Data as any).products.map((p: string) => {
                    const totalO = ((b6Data as any).teams || []).reduce((s: number, t: any) => s + ((((b6Data as any).data||{})[t.id]||{})[p]?.orders || 0), 0);
                    const totalC = ((b6Data as any).teams || []).reduce((s: number, t: any) => s + ((((b6Data as any).data||{})[t.id]||{})[p]?.cost || 0), 0);
                    return (
                      <React.Fragment key={'tot-'+p}>
                        <td className="px-3 py-3 text-xs text-right font-bold text-[#4f46e5]">{totalO}</td>
                        <td className="px-3 py-3 text-xs text-right font-bold">{totalC > 0 ? totalC.toLocaleString('vi-VN')+'d' : '-'}</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="px-4 py-3 text-xs text-right font-bold text-[#4f46e5]">{(b6Data as any).teams.reduce((s: number, t: any) => {
                    return s + ((b6Data as any).products || []).reduce((s2: number, p: string) => s2 + ((((b6Data as any).data||{})[t.id]||{})[p]?.orders || 0), 0);
                  }, 0)}</td>
                  <td className="px-4 py-3 text-xs text-right font-bold">{(b6Data as any).teams.reduce((s: number, t: any) => {
                    return s + ((b6Data as any).products || []).reduce((s2: number, p: string) => s2 + ((((b6Data as any).data||{})[t.id]||{})[p]?.cost || 0), 0);
                  }, 0) > 0 ? ((b6Data as any).teams.reduce((s: number, t: any) => {
                    return s + ((b6Data as any).products || []).reduce((s2: number, p: string) => s2 + ((((b6Data as any).data||{})[t.id]||{})[p]?.cost || 0), 0);
                  }, 0)).toLocaleString('vi-VN')+'d' : '-'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {teams.map(t => (
          <div key={t.id} onClick={() => nav('/crm/teams/' + slugify(t.name))} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted opacity-50"><path d="m9 18 6-6-6-6" /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

