import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, Search, Check, AlertCircle, TrendingUp, TrendingDown, Minus, BarChart3, FileText, Target, Calendar, Eye, MousePointer, DollarSign, Users, List, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

const WORK_CATEGORIES = ['Content', 'Onpage', 'Offpage', 'Technical SEO', 'Internal Link', 'Nghiên cứu từ khóa', 'Audit SEO', 'Theo dõi thứ hạng', 'Khác'];
const WORK_STATUSES = ['pending', 'in_progress', 'completed', 'paused', 'overdue'];
const PLAN_STATUSES = ['not_started', 'in_progress', 'completed', 'overdue', 'paused'];
const STATUS_LABELS: Record<string, string> = { pending: 'Chưa làm', in_progress: 'Đang làm', completed: 'Hoàn thành', paused: 'Tạm dừng', overdue: 'Quá hạn', not_started: 'Chưa bắt đầu' };
const STATUS_COLORS: Record<string, string> = { pending:'bg-gray-100 text-gray-600', in_progress:'bg-amber-100 text-amber-700', completed:'bg-green-100 text-green-700', paused:'bg-blue-100 text-blue-700', overdue:'bg-red-100 text-red-700', not_started:'bg-gray-100 text-gray-600' };

function cn(...a: any[]) { return a.filter(Boolean).join(' '); }

function showToast(type: 'success' | 'error', msg: string, setToast: any) {
  setToast({type, msg});
  setTimeout(() => setToast(null), 2500);
}

export default function SeoPage() {
  const [tab, setTab] = useState<'dashboard' | 'work' | 'results' | 'plans'>('dashboard');
  const [toast, setToast] = useState<{type: string, msg: string} | null>(null);
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zeyfi_user') || '{}'); } catch { return {}; }
  });
  const isAdmin = user.role === 'admin' || user.role === 'manager';

  // Dashboard
  const [dashData, setDashData] = useState<any>({});
  const [dashFilter, setDashFilter] = useState('30');

  // Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [planFilterPeriod, setPlanFilterPeriod] = useState('');
  const [planForm, setPlanForm] = useState<any>(null);

  // Work Reports
  const [works, setWorks] = useState<any[]>([]);
  const [workFilter, setWorkFilter] = useState({dateFrom:'',dateTo:'',category:'',employeeId:'',status:''});
  const [workEdit, setWorkEdit] = useState<{id:string,field:string}|null>(null);
  const [workVal, setWorkVal] = useState('');
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());

  // Results
  const [results, setResults] = useState<any[]>([]);
  const [resultFilter, setResultFilter] = useState({dateFrom:'',dateTo:'',keyword:''});
  const [resultEdit, setResultEdit] = useState<{id:string,field:string}|null>(null);
  const [resultVal, setResultVal] = useState('');

  // Users for dropdowns
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { api('/users').then(setUsers).catch(()=>{}); }, []);

  // Load functions
  const loadDash = useCallback((range: string) => {
    const today = new Date();
    const to = today.toISOString().slice(0,10);
    let from = '';
    if (range === '7') from = new Date(today.getTime()-7*86400000).toISOString().slice(0,10);
    else if (range === '30') from = new Date(today.getTime()-30*86400000).toISOString().slice(0,10);
    else if (range === '90') from = new Date(today.getTime()-90*86400000).toISOString().slice(0,10);
    else from = '1970-01-01';
    api('/seo/dashboard?from='+from+'&to='+to).then(setDashData).catch(()=>{});
  }, []);

  const loadPlans = useCallback((period?: string) => {
    api('/seo/plans' + (period ? '?period='+period : '')).then(r => setPlans(r || [])).catch(()=>{});
  }, []);
  const loadWorks = useCallback(() => {
    const params = new URLSearchParams();
    if (workFilter.dateFrom) params.set('dateFrom', workFilter.dateFrom);
    if (workFilter.dateTo) params.set('dateTo', workFilter.dateTo);
    if (workFilter.category) params.set('category', workFilter.category);
    if (workFilter.employeeId) params.set('employeeId', workFilter.employeeId);
    if (workFilter.status) params.set('status', workFilter.status);
    api('/seo/work-reports?'+params.toString()).then(r => setWorks(r || [])).catch(()=>{});
  }, [workFilter]);
  const loadResults = useCallback(() => {
    const params = new URLSearchParams();
    if (resultFilter.dateFrom) params.set('dateFrom', resultFilter.dateFrom);
    if (resultFilter.dateTo) params.set('dateTo', resultFilter.dateTo);
    if (resultFilter.keyword) params.set('keyword', resultFilter.keyword);
    api('/seo/results?'+params.toString()).then(r => setResults(r || [])).catch(()=>{});
  }, [resultFilter]);

  useEffect(() => { if (tab === 'dashboard') loadDash(dashFilter); }, [tab, dashFilter, loadDash]);
  useEffect(() => { if (tab === 'plans') loadPlans(planFilterPeriod); }, [tab, planFilterPeriod, loadPlans]);
  useEffect(() => { if (tab === 'work') loadWorks(); }, [tab, loadWorks]);
  useEffect(() => { if (tab === 'results') loadResults(); }, [tab, loadResults]);

  const savePlan = async () => {
    if (!planForm.task?.trim()) return;
    try {
      if (planForm.id) { await api('/seo/plans/'+planForm.id, {method:'PUT', body:JSON.stringify(planForm)}); }
      else { await api('/seo/plans', {method:'POST', body:JSON.stringify(planForm)}); }
      setPlanForm(null); loadPlans(planFilterPeriod);
      showToast('success', 'Đã lưu kế hoạch', setToast);
    } catch { showToast('error', 'Lỗi lưu kế hoạch', setToast); }
  };

  const updateWorkCell = async (id: string, field: string, val: any) => {
    const prev = works.find(w => w.id === id);
    setWorks((prev: any[]) => prev.map(w => w.id === id ? {...w, [field]: val} : w));
    setWorkEdit(null);
    try { await api('/seo/work-reports/'+id, {method:'PUT', body:JSON.stringify({[field]: val})}); }
    catch { setWorks((prev: any[]) => prev.map(w => w.id === id ? {...w, [field]: prev[field]} : w)); showToast('error', 'Lỗi lưu', setToast); }
  };

  const updateResultCell = async (id: string, field: string, val: any) => {
    setResults((prev: any[]) => prev.map(r => r.id === id ? {...r, [field]: val} : r));
    setResultEdit(null);
    try { await api('/seo/results/'+id, {method:'PUT', body:JSON.stringify({[field]: val})}); }
    catch { showToast('error', 'Lỗi lưu', setToast); }
  };

  const deleteSelectedWorks = async () => {
    if (!confirm('Xoá '+selectedWorks.size+' báo cáo?')) return;
    for (const id of selectedWorks) { try { await api('/seo/work-reports/'+id, {method:'DELETE'}); } catch {} }
    setSelectedWorks(new Set()); loadWorks(); showToast('success', 'Đã xoá', setToast);
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Xoá kế hoạch này?')) return;
    try { await api('/seo/plans/'+id, {method:'DELETE'}); loadPlans(planFilterPeriod); showToast('success', 'Đã xoá', setToast); } catch {}
  };
  const deleteWork = async (id: string) => {
    if (!confirm('Xoá báo cáo này?')) return;
    try { await api('/seo/work-reports/'+id, {method:'DELETE'}); loadWorks(); showToast('success', 'Đã xoá', setToast); } catch {}
  };
  const deleteResult = async (id: string) => {
    if (!confirm('Xoá kết quả này?')) return;
    try { await api('/seo/results/'+id, {method:'DELETE'}); loadResults(); showToast('success', 'Đã xoá', setToast); } catch {}
  };

  const DASH_CARDS = [
    { label:'Tổng công việc', value:dashData.totalTasks||0, icon:List, color:'bg-indigo-50 text-indigo-600' },
    { label:'Đã hoàn thành', value:dashData.completedTasks||0, icon:Check, color:'bg-green-50 text-green-600' },
    { label:'Đang thực hiện', value:dashData.inProgressTasks||0, icon:RefreshCw, color:'bg-amber-50 text-amber-600' },
    { label:'Quá hạn', value:dashData.overdueTasks||0, icon:AlertCircle, color:'bg-red-50 text-red-600' },
    { label:'Từ khóa', value:dashData.totalKeywords||0, icon:FileText, color:'bg-purple-50 text-purple-600' },
    { label:'Tăng hạng', value:dashData.keywordsUp||0, icon:TrendingUp, color:'bg-green-50 text-green-600' },
    { label:'Giảm hạng', value:dashData.keywordsDown||0, icon:TrendingDown, color:'bg-red-50 text-red-600' },
    { label:'Top 3', value:dashData.top3||0, icon:Target, color:'bg-emerald-50 text-emerald-600' },
    { label:'Top 10', value:dashData.top10||0, icon:BarChart3, color:'bg-blue-50 text-blue-600' },
    { label:'Click', value:dashData.totalClicks||0, icon:MousePointer, color:'bg-indigo-50 text-indigo-600' },
    { label:'Impression', value:dashData.totalImpressions||0, icon:Eye, color:'bg-cyan-50 text-cyan-600' },
    { label:'CTR', value:dashData.avgCtr||'0', icon:BarChart3, color:'bg-teal-50 text-teal-600', suffix:'%' },
    { label:'Traffic', value:dashData.totalTraffic||0, icon:TrendingUp, color:'bg-orange-50 text-orange-600' },
    { label:'Lead', value:dashData.totalLeads||0, icon:Users, color:'bg-pink-50 text-pink-600' },
    { label:'Đơn hàng', value:dashData.totalOrders||0, icon:Check, color:'bg-green-50 text-green-600' },
    { label:'Doanh thu', value:dashData.totalRevenue?.toLocaleString('vi-VN')||'0', icon:DollarSign, color:'bg-yellow-50 text-yellow-600', suffix:'đ' },
  ];

  const TABS = [
    { key:'dashboard', label:'Tổng quan', icon:BarChart3 },
    { key:'work', label:'Báo cáo công việc', icon:FileText },
    { key:'results', label:'Kết quả SEO', icon:TrendingUp },
    { key:'plans', label:'Kế hoạch & KPI', icon:Target },
  ];

  return (
    <div className="text-sm" style={{fontFamily:"'Inter', system-ui, -apple-system, sans-serif"}}>
      {toast && (
        <div className={'fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl border animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#171717]">SEO</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-border shadow-sm p-0.5 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ' +
              (tab === t.key ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-muted hover:bg-gray-50')}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ============ DASHBOARD ============ */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Khoảng thời gian:</span>
            {['7','30','90','all'].map(r => (
              <button key={r} onClick={() => setDashFilter(r)}
                className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' +
                  (dashFilter === r ? 'bg-[#4f46e5] text-white' : 'bg-white border border-border text-muted hover:bg-gray-50')}>
                {r === '7' ? '7 ngày' : r === '30' ? '30 ngày' : r === '90' ? '90 ngày' : 'Tất cả'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {DASH_CARDS.map(c => (
              <div key={c.label} className="bg-white rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={'w-10 h-10 rounded-xl grid place-items-center ' + c.color}>
                    <c.icon size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#171717]">{c.value}{c.suffix || ''}</p>
                <p className="text-xs text-muted mt-1">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ WORK REPORTS ============ */}
      {tab === 'work' && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input type="date" value={workFilter.dateFrom} onChange={e => setWorkFilter(p=>({...p,dateFrom:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input type="date" value={workFilter.dateTo} onChange={e => setWorkFilter(p=>({...p,dateTo:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <select value={workFilter.category} onChange={e => setWorkFilter(p=>({...p,category:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer">
              <option value="">Nhóm CV</option>
              {WORK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={workFilter.employeeId} onChange={e => setWorkFilter(p=>({...p,employeeId:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer">
              <option value="">Nhân sự</option>
              {users.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={workFilter.status} onChange={e => setWorkFilter(p=>({...p,status:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer">
              <option value="">Trạng thái</option>
              {WORK_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]||s}</option>)}
            </select>
            {selectedWorks.size > 0 && (
              <button onClick={deleteSelectedWorks} className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600">
                <Trash2 size={13} /> Xoá {selectedWorks.size}
              </button>
            )}
            <button onClick={() => {
              const today = new Date().toISOString().slice(0,10);
              setWorks((prev:any[]) => [{id:'new', date:today, employee_id:user.id, employeeName:user.name, category:'', task:'', url:'', qty:0, status:'pending', completion_percent:0, plan_id:'', note:''}, ...prev]);
            }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-medium hover:shadow-md"><Plus size={14} /> Thêm dòng</button>
          </div>

          {/* Data Grid */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/90 border-b-2 border-border">
                    <th className="w-8 p-0 text-center py-3">
                      <input type="checkbox" checked={selectedWorks.size === works.length && works.length > 0}
                        onChange={() => setSelectedWorks(selectedWorks.size === works.length ? new Set() : new Set(works.map(w=>w.id)))}
                        className="accent-[#4f46e5] scale-90" />
                    </th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-24">Ngày</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-36">Nhân sự</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-28">Nhóm CV</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left min-w-[200px]">Công việc</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left min-w-[140px]">URL</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">SL</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-28">Trạng thái</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-center w-16">%</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-28">KPI</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-28">Ghi chú</th>
                    <th className="w-8 py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {works.map((w:any, i:number) => (
                    <tr key={w.id || i} className="hover:bg-gray-50/60 transition-all">
                      <td className="p-0 text-center py-3">
                        <input type="checkbox" checked={selectedWorks.has(w.id)} onChange={() => {
                          const n = new Set(selectedWorks);
                          n.has(w.id) ? n.delete(w.id) : n.add(w.id);
                          setSelectedWorks(n);
                        }} className="accent-[#4f46e5] scale-90" />
                      </td>
                      <td className="py-2 px-3">
                        <input type="date" value={w.date || ''} onChange={e => {
                          if (w.id === 'new') setWorks((prev:any[]) => prev.map(r => r.id === w.id ? {...r, date: e.target.value} : r));
                          else updateWorkCell(w.id, 'date', e.target.value);
                        }}
                          className="w-full px-1 py-1 bg-transparent text-xs outline-none border-0" />
                      </td>
                      <td className="py-2 px-3 text-xs text-muted">{w.employeeName || user.name}</td>
                      <td className="py-2 px-3">
                        <select value={w.category || ''} onChange={e => {
                          if (w.id === 'new') setWorks((prev:any[]) => prev.map(r => r.id === w.id ? {...r, category: e.target.value} : r));
                          else updateWorkCell(w.id, 'category', e.target.value);
                        }} className="w-full px-1 py-1 bg-transparent text-xs outline-none border-0 cursor-pointer">
                          <option value="">—</option>
                          {WORK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        {workEdit?.id === w.id && workEdit?.field === 'task' ? (
                          <input autoFocus value={workVal} onChange={e => setWorkVal(e.target.value)}
                            onBlur={() => { updateWorkCell(w.id, 'task', workVal); }}
                            onKeyDown={e => { if (e.key === 'Enter') updateWorkCell(w.id, 'task', workVal); if (e.key === 'Escape') setWorkEdit(null); }}
                            className="w-full px-2 py-1 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none" />
                        ) : (
                          <span onClick={() => { setWorkEdit({id:w.id,field:'task'}); setWorkVal(w.task||''); }}
                            className={'block px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-gray-100/80 ' + (w.task ? 'text-[#171717]' : 'text-muted italic')}>
                            {w.task || 'Nhập...'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {workEdit?.id === w.id && workEdit?.field === 'url' ? (
                          <input autoFocus value={workVal} onChange={e => setWorkVal(e.target.value)}
                            onBlur={() => updateWorkCell(w.id, 'url', workVal)}
                            onKeyDown={e => { if (e.key === 'Enter') updateWorkCell(w.id, 'url', workVal); if (e.key === 'Escape') setWorkEdit(null); }}
                            className="w-full px-2 py-1 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none" />
                        ) : (
                          <span onClick={() => { setWorkEdit({id:w.id,field:'url'}); setWorkVal(w.url||''); }}
                            className={'block px-2 py-1 rounded-lg text-xs truncate max-w-[130px] cursor-pointer hover:bg-gray-100/80 ' + (w.url ? 'text-[#4f46e5]' : 'text-muted italic')}>
                            {w.url || 'URL...'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {workEdit?.id === w.id && workEdit?.field === 'qty' ? (
                          <input autoFocus type="number" value={workVal} onChange={e => setWorkVal(e.target.value)}
                            onBlur={() => updateWorkCell(w.id, 'qty', Number(workVal))}
                            onKeyDown={e => { if (e.key === 'Enter') updateWorkCell(w.id, 'qty', Number(workVal)); if (e.key === 'Escape') setWorkEdit(null); }}
                            className="w-16 px-2 py-1 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none text-right" />
                        ) : (
                          <span onClick={() => { setWorkEdit({id:w.id,field:'qty'}); setWorkVal(String(w.qty||0)); }}
                            className="block px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-gray-100/80">{w.qty || 0}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <select value={w.status || 'pending'} onChange={e => updateWorkCell(w.id, 'status', e.target.value)}
                          className={'px-2 py-1 rounded-md text-xs font-medium outline-none cursor-pointer ' + (STATUS_COLORS[w.status] || 'bg-gray-100')}>
                          {WORK_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]||s}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input type="number" value={w.completion_percent || 0} onChange={e => updateWorkCell(w.id, 'completionPercent', Number(e.target.value))}
                          className="w-12 px-1 py-1 bg-transparent text-xs text-center outline-none" />%
                      </td>
                      <td className="py-2 px-3 text-xs text-muted">{w.planTask || <span className="italic">—</span>}</td>
                      <td className="py-2 px-3">
                        {workEdit?.id === w.id && workEdit?.field === 'note' ? (
                          <input autoFocus value={workVal} onChange={e => setWorkVal(e.target.value)}
                            onBlur={() => updateWorkCell(w.id, 'note', workVal)}
                            onKeyDown={e => { if (e.key === 'Enter') updateWorkCell(w.id, 'note', workVal); if (e.key === 'Escape') setWorkEdit(null); }}
                            className="w-full px-2 py-1 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none" />
                        ) : (
                          <span onClick={() => { setWorkEdit({id:w.id,field:'note'}); setWorkVal(w.note||''); }}
                            className={'block px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-gray-100/80 ' + (w.note ? '' : 'text-muted italic')}>
                            {w.note || '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {w.id !== 'new' ? (
                          <button onClick={() => deleteWork(w.id)} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                        ) : (
                          <button onClick={async () => {
                            try {
                              await api('/seo/work-reports', {method:'POST', body:JSON.stringify({
                                date: w.date, employeeId: user.id, category: w.category, task: w.task, url: w.url, qty: w.qty, status: w.status, completionPercent: w.completion_percent, note: w.note
                              })});
                              loadWorks(); showToast('success', 'Đã thêm', setToast);
                            } catch { showToast('error', 'Lỗi thêm', setToast); }
                          }} className="p-1 rounded hover:bg-green-50 text-green-500 transition-all" title="Lưu"><Check size={12} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {works.length === 0 && (
                    <tr><td colSpan={12} className="py-12 text-center text-sm text-muted">
                      <FileText size={36} className="mx-auto mb-2 opacity-30" />
                      Chưa có báo cáo công việc
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ SEO RESULTS ============ */}
      {tab === 'results' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input type="date" value={resultFilter.dateFrom} onChange={e => setResultFilter(p=>({...p,dateFrom:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input type="date" value={resultFilter.dateTo} onChange={e => setResultFilter(p=>({...p,dateTo:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input value={resultFilter.keyword} onChange={e => setResultFilter(p=>({...p,keyword:e.target.value}))}
                placeholder="Từ khóa..." className="w-40 pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            </div>
            <button onClick={() => {
              setResults((prev:any[]) => [{id:'new', date:new Date().toISOString().slice(0,10), keyword:'', url:'', prev_rank:'', curr_rank:'', clicks:0, impressions:0, ctr:0, traffic:0, leads:0, orders:0, revenue:0}, ...prev]);
            }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-medium hover:shadow-md"><Plus size={14} /> Thêm</button>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/90 border-b-2 border-border">
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-24">Ngày</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left min-w-[160px]">Từ khóa</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left min-w-[140px]">URL</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">Rank cũ</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">Rank mới</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-center w-20">Thay đổi</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">Click</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-20">Impression</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">CTR</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">Traffic</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-12">Lead</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">Đơn</th>
                    <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-24">Doanh thu</th>
                    <th className="w-8 py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r:any, i:number) => {
                    const change = r.prev_rank && r.curr_rank ? r.prev_rank - r.curr_rank : 0;
                    const ctr = r.impressions > 0 ? ((r.clicks||0) / r.impressions * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={r.id || i} className="hover:bg-gray-50/60 transition-all">
                        <td className="py-2 px-3">
                          <input type="date" value={r.date || ''} onChange={e => {
                            if (r.id === 'new') setResults((prev:any[]) => prev.map(x => x.id === r.id ? {...x, date: e.target.value} : x));
                            else updateResultCell(r.id, 'date', e.target.value);
                          }} className="w-full px-1 py-1 bg-transparent text-xs outline-none border-0" />
                        </td>
                        <td className="py-2 px-3">
                          {resultEdit?.id === r.id && resultEdit?.field === 'keyword' ? (
                            <input autoFocus value={resultVal} onChange={e => setResultVal(e.target.value)}
                              onBlur={() => updateResultCell(r.id, 'keyword', resultVal)}
                              onKeyDown={e => { if (e.key === 'Enter') updateResultCell(r.id, 'keyword', resultVal); if (e.key === 'Escape') setResultEdit(null); }}
                              className="w-full px-2 py-1 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none" />
                          ) : (
                            <span onClick={() => { setResultEdit({id:r.id,field:'keyword'}); setResultVal(r.keyword||''); }}
                              className={'block px-2 py-1 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-100/80 ' + (r.keyword ? '' : 'text-muted italic')}>
                              {r.keyword || 'Nhập từ khóa...'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-xs text-muted truncate max-w-[130px]">{r.url || '—'}</td>
                        <td className="py-2 px-3 text-xs text-right">{r.prev_rank || '—'}</td>
                        <td className="py-2 px-3 text-xs text-right">{r.curr_rank || '—'}</td>
                        <td className="py-2 px-3 text-center">
                          {change > 0 ? <span className="text-green-600 text-xs font-medium flex items-center justify-center gap-1"><TrendingUp size={12} /> +{change}</span>
                          : change < 0 ? <span className="text-red-600 text-xs font-medium flex items-center justify-center gap-1"><TrendingDown size={12} /> {change}</span>
                          : <span className="text-muted text-xs"><Minus size={12} className="inline" /></span>}
                        </td>
                        <td className="py-2 px-3">{resultEdit?.id === r.id && resultEdit?.field === 'clicks' ? (
                          <input autoFocus type="number" value={resultVal} onChange={e => setResultVal(e.target.value)}
                            onBlur={() => updateResultCell(r.id, 'clicks', Number(resultVal))}
                            onKeyDown={e => { if (e.key === 'Enter') updateResultCell(r.id, 'clicks', Number(resultVal)); if (e.key === 'Escape') setResultEdit(null); }}
                            className="w-full px-2 py-1 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none text-right" />
                        ) : <span onClick={() => { setResultEdit({id:r.id,field:'clicks'}); setResultVal(String(r.clicks||0)); }}
                            className="block px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-gray-100/80 text-right">{r.clicks||0}</span>}</td>
                        <td className="py-2 px-3">{resultEdit?.id === r.id && resultEdit?.field === 'impressions' ? (
                          <input autoFocus type="number" value={resultVal} onChange={e => setResultVal(e.target.value)}
                            onBlur={() => updateResultCell(r.id, 'impressions', Number(resultVal))}
                            onKeyDown={e => { if (e.key === 'Enter') updateResultCell(r.id, 'impressions', Number(resultVal)); if (e.key === 'Escape') setResultEdit(null); }}
                            className="w-full px-2 py-1 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none text-right" />
                        ) : <span onClick={() => { setResultEdit({id:r.id,field:'impressions'}); setResultVal(String(r.impressions||0)); }}
                            className="block px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-gray-100/80 text-right">{r.impressions||0}</span>}</td>
                        <td className="py-2 px-3 text-xs text-right font-medium">{ctr}%</td>
                        <td className="py-2 px-3 text-xs text-right">{r.traffic||0}</td>
                        <td className="py-2 px-3 text-xs text-right">{r.leads||0}</td>
                        <td className="py-2 px-3 text-xs text-right">{r.orders||0}</td>
                        <td className="py-2 px-3 text-xs text-right">{r.revenue?.toLocaleString('vi-VN') || '0'}</td>
                        <td className="py-2 px-3 text-center">
                          {r.id !== 'new' ? (
                            <button onClick={() => deleteResult(r.id)} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                          ) : (
                            <button onClick={async () => {
                              try {
                                await api('/seo/results', {method:'POST', body:JSON.stringify({
                                  date: r.date, keyword: r.keyword, url: r.url, prevRank: Number(r.prev_rank)||0,
                                  currRank: Number(r.curr_rank)||0, clicks: r.clicks||0, impressions: r.impressions||0,
                                  traffic: r.traffic||0, leads: r.leads||0, orders: r.orders||0, revenue: r.revenue||0
                                })});
                                loadResults(); showToast('success', 'Đã thêm', setToast);
                              } catch { showToast('error', 'Lỗi thêm', setToast); }
                            }} className="p-1 rounded hover:bg-green-50 text-green-500 transition-all"><Check size={12} /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {results.length === 0 && (
                    <tr><td colSpan={14} className="py-12 text-center text-sm text-muted">
                      <TrendingUp size={36} className="mx-auto mb-2 opacity-30" />
                      Chưa có kết quả SEO
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ PLANS ============ */}
      {tab === 'plans' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input type="month" value={planFilterPeriod} onChange={e => { setPlanFilterPeriod(e.target.value); loadPlans(e.target.value); }}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <button onClick={() => setPlanForm({period: planFilterPeriod || new Date().toISOString().slice(0,7), objective:'', kpi:'', task:'', assigneeId:'', deadline:'', plannedQty:0, status:'not_started', note:''})}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-medium hover:shadow-md"><Plus size={14} /> Thêm kế hoạch</button>
          </div>

          {/* Plan form modal */}
          {planForm && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPlanForm(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="font-bold text-sm">{planForm.id ? 'Sửa kế hoạch' : 'Thêm kế hoạch SEO'}</h3>
                  <button onClick={() => setPlanForm(null)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-auto p-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted mb-1 block">Công việc *</label>
                    <input value={planForm.task} onChange={e => setPlanForm({...planForm, task: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted mb-1 block">Mục tiêu</label>
                      <input value={planForm.objective} onChange={e => setPlanForm({...planForm, objective: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted mb-1 block">KPI</label>
                      <input value={planForm.kpi} onChange={e => setPlanForm({...planForm, kpi: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted mb-1 block">Người phụ trách</label>
                      <select value={planForm.assigneeId} onChange={e => setPlanForm({...planForm, assigneeId: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer">
                        <option value="">—</option>
                        {users.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted mb-1 block">Deadline</label>
                      <input type="date" value={planForm.deadline} onChange={e => setPlanForm({...planForm, deadline: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted mb-1 block">Số lượng KH</label>
                      <input type="number" value={planForm.plannedQty} onChange={e => setPlanForm({...planForm, plannedQty: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted mb-1 block">Đã làm</label>
                      <input type="number" value={planForm.completedQty || ''} disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-xs text-muted outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted mb-1 block">Trạng thái</label>
                      <select value={planForm.status} onChange={e => setPlanForm({...planForm, status: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer">
                        {PLAN_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]||s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted mb-1 block">Ghi chú</label>
                    <textarea value={planForm.note} onChange={e => setPlanForm({...planForm, note: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs outline-none resize-none h-20 focus:ring-2 focus:ring-[#4f46e5]/25" />
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-border flex justify-end gap-3">
                  <button onClick={() => setPlanForm(null)} className="px-4 py-2 bg-white border border-border rounded-xl text-xs font-medium hover:bg-gray-50">Huỷ</button>
                  <button onClick={savePlan} className="px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-xs font-medium hover:shadow-md">Lưu</button>
                </div>
              </div>
            </div>
          )}

          {/* Plans list */}
          <div className="space-y-3">
            {plans.map((p:any) => {
              const remaining = (p.planned_qty || 0) - (p.completed_qty || 0);
              const pct = p.planned_qty > 0 ? Math.round((p.completed_qty||0) / p.planned_qty * 100) : 0;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-border shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{p.task}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted mt-2">
                        <span>📅 {p.period || '—'}</span>
                        {p.assigneeName && <span>👤 {p.assigneeName}</span>}
                        {p.deadline && <span>⏰ {p.deadline}</span>}
                        <span className={'px-2 py-0.5 rounded-md ' + (STATUS_COLORS[p.status] || 'bg-gray-100')}>{STATUS_LABELS[p.status]}</span>
                      </div>
                      {p.objective && <p className="text-xs text-muted mt-2">{p.objective}</p>}
                      {p.kpi && <p className="text-xs text-muted mt-1">📊 KPI: {p.kpi}</p>}
                      {p.note && <p className="text-xs text-muted mt-1">💬 {p.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold">{pct}%</p>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-[#4f46e5] rounded-full" style={{width: pct+'%'}} />
                      </div>
                      <p className="text-xs text-muted mt-1">{p.completed_qty||0}/{p.planned_qty||0}</p>
                      {remaining > 0 && <p className="text-xs text-amber-600">Còn {remaining}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <button onClick={() => setPlanForm({id:p.id, period:p.period, objective:p.objective||'', kpi:p.kpi||'', task:p.task, assigneeId:p.assignee_id||'', deadline:p.deadline||'', plannedQty:p.planned_qty||0, completedQty:p.completed_qty||0, status:p.status, note:p.note||''})}
                      className="text-xs text-muted hover:text-[#4f46e5] transition-all">Sửa</button>
                    <button onClick={() => deletePlan(p.id)} className="text-xs text-muted hover:text-red-500 transition-all">Xoá</button>
                  </div>
                </div>
              );
            })}
            {plans.length === 0 && (
              <div className="text-center py-12 text-sm text-muted">
                <Target size={36} className="mx-auto mb-2 opacity-30" />
                Chưa có kế hoạch SEO
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}