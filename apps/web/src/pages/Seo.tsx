import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, Search, Check, AlertCircle, TrendingUp, TrendingDown, Minus, BarChart3, FileText, Target, Calendar, Eye, MousePointer, DollarSign, Users, List, RefreshCw, Download, Clock, Activity, Zap, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';

const WORK_CATEGORIES = ['Content', 'Onpage', 'Offpage', 'Technical SEO', 'Internal Link', 'Nghiên cứu từ khóa', 'Audit SEO', 'Theo dõi thứ hạng', 'Khác'];
const WORK_STATUSES = ['pending', 'in_progress', 'completed', 'paused', 'overdue'];
const PLAN_STATUSES = ['not_started', 'in_progress', 'completed', 'overdue', 'paused'];
const STATUS_LABELS: Record<string, string> = { pending:'Chưa làm', in_progress:'Đang làm', completed:'Hoàn thành', paused:'Tạm dừng', overdue:'Quá hạn', not_started:'Chưa bắt đầu', '':'Chưa bắt đầu'};
const STATUS_BADGE: Record<string, string> = {
  pending:'bg-amber-50 text-amber-700 border-amber-200',
  in_progress:'bg-blue-50 text-blue-700 border-blue-200',
  completed:'bg-green-50 text-green-700 border-green-200',
  paused:'bg-gray-50 text-gray-600 border-gray-200',
  overdue:'bg-red-50 text-red-700 border-red-200',
  not_started:'bg-gray-50 text-gray-500 border-gray-200',
};
const fmtDate = (d: string) => d ? d.split('T')[0] : '';

export default function SeoPage() {
  const [tab, setTab] = useState<'dashboard' | 'work' | 'results' | 'plans'>('dashboard');
  const [toast, setToast] = useState<{type: string, msg: string} | null>(null);
  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('zeyfi_user') || '{}'); } catch { return {}; } });

  // Tab states
  const [dashData, setDashData] = useState<any>({});
  const [dashRange, setDashRange] = useState('30d');
  const [plans, setPlans] = useState<any[]>([]);
  const [planPeriod, setPlanPeriod] = useState('');
  const [planForm, setPlanForm] = useState<any>(null);
  const [works, setWorks] = useState<any[]>([]);
  const [wf, setWf] = useState({dateFrom:'',dateTo:'',category:'',employeeId:'',status:''});
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<any[]>([]);
  const [rf, setRf] = useState({dateFrom:'',dateTo:'',keyword:''});
  const [users, setUsers] = useState<any[]>([]);

  // New row form state
  const [showNewWork, setShowNewWork] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newQty, setNewQty] = useState(0);
  const [newStatus, setNewStatus] = useState('pending');
  const [newPct, setNewPct] = useState(0);
  const [newPlanId, setNewPlanId] = useState('');
  const [newNote, setNewNote] = useState('');

  // New result form state
  const [showNewResult, setShowNewResult] = useState(false);
  const [nrDate, setNrDate] = useState('');
  const [nrKeyword, setNrKeyword] = useState('');
  const [nrUrl, setNrUrl] = useState('');
  const [nrPrev, setNrPrev] = useState(0);
  const [nrCurr, setNrCurr] = useState(0);
  const [nrClicks, setNrClicks] = useState(0);
  const [nrImpressions, setNrImpressions] = useState(0);
  const [nrTraffic, setNrTraffic] = useState(0);
  const [nrLeads, setNrLeads] = useState(0);
  const [nrOrders, setNrOrders] = useState(0);
  const [nrRevenue, setNrRevenue] = useState(0);

  // Editing state
  const [editId, setEditId] = useState<string|null>(null);
  const [editField, setEditField] = useState<string|null>(null);
  const [editVal, setEditVal] = useState('');

  useEffect(() => { api('/users').then(setUsers).catch(()=>{}); }, []);

  const showMsg = (t: string, m: string) => { setToast({type:t, msg:m}); setTimeout(() => setToast(null), 2500); };

  const getRange = (r: string) => {
    const to = new Date().toISOString().slice(0,10);
    const from = new Date(Date.now() - ({'7d':7,'30d':30,'90d':90}[r]||30)*86400000).toISOString().slice(0,10);
    return { from, to };
  };

  const loadDash = useCallback((r: string) => { const d=getRange(r); api('/seo/dashboard?from='+d.from+'&to='+d.to).then(setDashData).catch(()=>{}); }, []);
  const loadPlans = useCallback((p?: string) => { api('/seo/plans'+(p?'?period='+p:'')).then(r=>setPlans(r||[])).catch(()=>{}); }, []);
  const loadWorks = useCallback(() => {
    const p = new URLSearchParams();
    if (wf.dateFrom) p.set('dateFrom', wf.dateFrom); if (wf.dateTo) p.set('dateTo', wf.dateTo);
    if (wf.category) p.set('category', wf.category); if (wf.employeeId) p.set('employeeId', wf.employeeId); if (wf.status) p.set('status', wf.status);
    api('/seo/work-reports?'+p.toString()).then(r=>setWorks(r||[])).catch(()=>{});
  }, [wf]);
  const loadResults = useCallback(() => {
    const p = new URLSearchParams();
    if (rf.dateFrom) p.set('dateFrom', rf.dateFrom); if (rf.dateTo) p.set('dateTo', rf.dateTo); if (rf.keyword) p.set('keyword', rf.keyword);
    api('/seo/results?'+p.toString()).then(r=>setResults(r||[])).catch(()=>{});
  }, [rf]);

  useEffect(() => { if (tab === 'dashboard') loadDash(dashRange); }, [tab, dashRange, loadDash]);
  useEffect(() => { if (tab === 'plans') loadPlans(planPeriod); }, [tab, planPeriod, loadPlans]);
  useEffect(() => { if (tab === 'work') loadWorks(); }, [tab, loadWorks]);
  useEffect(() => { if (tab === 'results') loadResults(); }, [tab, loadResults]);

  // Edit field: update local state + API on blur
  const editCell = (id: string, field: string, val: any, isNew: boolean) => {
    if (isNew) return; // new rows use the form, not inline editing
    const prev = (field.startsWith('r_') ? results : works).find((w:any) => w.id === id);
    const setter = field.startsWith('r_') ? setResults : setWorks;
    setter((prevState:any[]) => prevState.map((w:any) => w.id === id ? {...w, [field.replace('r_','')]: val} : w));
    if (field.startsWith('r_')) {
      api('/seo/results/'+id, {method:'PUT', body:JSON.stringify({[field.replace('r_','')]: val})}).catch(()=>showMsg('error','Lỗi lưu'));
    } else {
      api('/seo/work-reports/'+id, {method:'PUT', body:JSON.stringify({[field]: val})}).catch(()=>{
        if (prev) setter((p:any[]) => p.map((w:any) => w.id === id ? {...w, [field]: (prev as any)[field]} : w));
        showMsg('error','Lỗi lưu');
      });
    }
  };

  // Delete
  const delWork = async (id: string) => { if (!confirm('Xoá?')) return; await api('/seo/work-reports/'+id,{method:'DELETE'}).catch(()=>{}); loadWorks(); showMsg('success','Đã xoá'); };
  const delResult = async (id: string) => { if (!confirm('Xoá?')) return; await api('/seo/results/'+id,{method:'DELETE'}).catch(()=>{}); loadResults(); showMsg('success','Đã xoá'); };
  const delPlan = async (id: string) => { if (!confirm('Xoá kế hoạch?')) return; await api('/seo/plans/'+id,{method:'DELETE'}).catch(()=>{}); loadPlans(planPeriod); showMsg('success','Đã xoá'); };
  const delSelected = async () => {
    if (!confirm('Xoá '+selectedWorks.size+' dòng?')) return;
    for (const id of selectedWorks) await api('/seo/work-reports/'+id,{method:'DELETE'}).catch(()=>{});
    setSelectedWorks(new Set()); loadWorks(); showMsg('success','Đã xoá');
  };

  const savePlan = async () => {
    if (!planForm.task?.trim()) return;
    try {
      if (planForm.id) await api('/seo/plans/'+planForm.id,{method:'PUT',body:JSON.stringify(planForm)});
      else await api('/seo/plans',{method:'POST',body:JSON.stringify(planForm)});
      setPlanForm(null); loadPlans(planPeriod); showMsg('success','Đã lưu kế hoạch');
    } catch { showMsg('error','Lỗi lưu kế hoạch'); }
  };

  const addWork = async () => {
    if (!newTask.trim()) { showMsg('error','Nhập tên công việc'); return; }
    try {
      await api('/seo/work-reports', {method:'POST', body:JSON.stringify({
        date: newDate || new Date().toISOString().slice(0,10),
        employeeId: user.id, category: newCategory, task: newTask, url: newUrl,
        qty: Number(newQty)||0, status: newStatus, completionPercent: Number(newPct)||0, planId: newPlanId||null, note: newNote
      })});
      setShowNewWork(false);
      setNewTask(''); setNewUrl(''); setNewQty(0); setNewStatus('pending'); setNewPct(0); setNewNote('');
      loadWorks(); showMsg('success','Đã thêm công việc');
    } catch { showMsg('error','Lỗi thêm'); }
  };

  const addResult = async () => {
    if (!nrKeyword.trim()) { showMsg('error','Nhập từ khóa'); return; }
    try {
      await api('/seo/results', {method:'POST', body:JSON.stringify({
        date: nrDate || new Date().toISOString().slice(0,10), keyword: nrKeyword, url: nrUrl,
        prevRank: Number(nrPrev)||0, currRank: Number(nrCurr)||0, clicks: Number(nrClicks)||0,
        impressions: Number(nrImpressions)||0, traffic: Number(nrTraffic)||0, leads: Number(nrLeads)||0,
        orders: Number(nrOrders)||0, revenue: Number(nrRevenue)||0
      })});
      setShowNewResult(false); setNrKeyword(''); setNrUrl('');
      loadResults(); showMsg('success','Đã thêm kết quả');
    } catch { showMsg('error','Lỗi thêm'); }
  };

  const TABS = [
    { key:'dashboard', label:'Tổng quan', icon:BarChart3 },
    { key:'work', label:'Báo cáo công việc', icon:FileText },
    { key:'results', label:'Kết quả SEO', icon:TrendingUp },
    { key:'plans', label:'Kế hoạch & KPI', icon:Target },
  ];

  const workGroup = [
    { label:'Tổng CV', val:dashData.totalTasks||0, icon:List, color:'from-indigo-500 to-blue-500' },
    { label:'Đã hoàn thành', val:dashData.completedTasks||0, icon:Check, color:'from-green-500 to-emerald-500' },
    { label:'Đang làm', val:dashData.inProgressTasks||0, icon:RefreshCw, color:'from-amber-500 to-orange-500' },
    { label:'Quá hạn', val:dashData.overdueTasks||0, icon:AlertCircle, color:'from-red-500 to-rose-500' },
  ];
  const kwGroup = [
    { label:'Từ khóa', val:dashData.totalKeywords||0, icon:FileText, color:'from-purple-500 to-violet-500' },
    { label:'Tăng hạng', val:dashData.keywordsUp||0, icon:TrendingUp, color:'from-green-500 to-emerald-500', diff:true },
    { label:'Giảm hạng', val:dashData.keywordsDown||0, icon:TrendingDown, color:'from-red-500 to-rose-500', diff:true },
    { label:'Top 3', val:dashData.top3||0, color:'from-emerald-500 to-teal-500' },
    { label:'Top 10', val:dashData.top10||0, color:'from-blue-500 to-cyan-500' },
    { label:'Top 20', val:dashData.top20||0, color:'from-indigo-500 to-purple-500' },
  ];
  const perfGroup = [
    { label:'Click', val:dashData.totalClicks?.toLocaleString('vi-VN')||'0', icon:MousePointer, color:'from-cyan-500 to-blue-500' },
    { label:'Impression', val:dashData.totalImpressions?.toLocaleString('vi-VN')||'0', icon:Eye, color:'from-sky-500 to-indigo-500' },
    { label:'CTR', val:dashData.avgCtr||'0', icon:Activity, color:'from-teal-500 to-green-500', suffix:'%' },
    { label:'Traffic', val:dashData.totalTraffic?.toLocaleString('vi-VN')||'0', icon:Zap, color:'from-orange-500 to-amber-500' },
    { label:'Lead', val:dashData.totalLeads?.toLocaleString('vi-VN')||'0', icon:Users, color:'from-pink-500 to-rose-500' },
    { label:'Đơn hàng', val:dashData.totalOrders?.toLocaleString('vi-VN')||'0', icon:DollarSign, color:'from-green-500 to-emerald-500' },
    { label:'Doanh thu', val:dashData.totalRevenue?.toLocaleString('vi-VN')||'0', icon:BarChart3, color:'from-yellow-500 to-amber-500', suffix:'đ' },
  ];

  return (
    <div className="text-sm space-y-6">
      {toast && (
        <div className={'fixed top-4 right-4 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl border font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />} {toast.msg}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#171717] tracking-tight">SEO</h1>
        <div className="flex items-center gap-1 bg-white rounded-xl border border-border shadow-sm p-0.5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ' +
                (tab === t.key ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-muted hover:bg-gray-50')}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============ DASHBOARD ============ */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            {['7d','30d','90d'].map(r => (
              <button key={r} onClick={() => setDashRange(r)}
                className={'px-4 py-2 rounded-xl text-xs font-medium transition-all ' +
                  (dashRange === r ? 'bg-[#4f46e5] text-white shadow-sm' : 'bg-white border border-border text-muted hover:bg-gray-50')}>
                {r === '7d' ? '7 ngày' : r === '30d' ? '30 ngày' : '90 ngày'}
              </button>
            ))}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">📋 Công việc SEO</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {workGroup.map(c => (
                <div key={c.label} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className={'h-1.5 bg-gradient-to-r ' + c.color} />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3"><c.icon size={22} className="text-muted" /></div>
                    <p className="text-2xl font-bold text-[#171717]">{c.val}</p>
                    <p className="text-xs text-muted mt-1">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">🔑 Từ khóa SEO</h2>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
              {kwGroup.map(c => (
                <div key={c.label} className="bg-white rounded-2xl border border-border shadow-sm p-5 text-center">
                  <div className={'text-2xl font-bold '+(c.diff?(Number(c.val)>0?'text-green-600':Number(c.val)<0?'text-red-600':''):'text-[#171717]')}>{c.val}</div>
                  <p className="text-[11px] text-muted mt-1.5">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">📊 Hiệu quả SEO</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {perfGroup.map(c => (
                <div key={c.label} className="bg-white rounded-2xl border border-border shadow-sm p-5">
                  <div className={'w-9 h-9 rounded-xl grid place-items-center mb-3 bg-gradient-to-br '+c.color+' shadow-sm'}><c.icon size={18} className="text-white" /></div>
                  <p className="text-lg font-bold text-[#171717]">{c.val}{c.suffix||''}</p>
                  <p className="text-[11px] text-muted mt-1">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ WORK REPORTS ============ */}
      {tab === 'work' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {['dateFrom','dateTo'].map(k => (
              <input key={k} type="date" value={(wf as any)[k]||''} onChange={e=>setWf(p=>({...p,[k]:e.target.value}))}
                className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            ))}
            <select value={wf.category} onChange={e=>setWf(p=>({...p,category:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer">
              <option value="">Nhóm CV</option>
              {WORK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={wf.employeeId} onChange={e=>setWf(p=>({...p,employeeId:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer">
              <option value="">Nhân sự</option>
              {users.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={wf.status} onChange={e=>setWf(p=>({...p,status:e.target.value}))}
              className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer">
              <option value="">Trạng thái</option>
              {WORK_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            {selectedWorks.size > 0 && (
              <button onClick={delSelected} className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600 transition-all"><Trash2 size={14} /> Xoá {selectedWorks.size}</button>
            )}
            <button onClick={() => { setShowNewWork(true); setNewDate(new Date().toISOString().slice(0,10)); setNewCategory(wf.category||''); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-medium hover:shadow-md transition-all"><Plus size={14} /> Thêm dòng</button>
          </div>

          {/* New Work Form */}
          {showNewWork && (
            <div className="bg-white rounded-2xl border-2 border-[#4f46e5] shadow-md p-5 space-y-3 animate-slide-in">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Thêm công việc mới</h3><button onClick={()=>setShowNewWork(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16}/></button></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div><label className="text-[11px] text-muted font-medium">Ngày</label><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div><label className="text-[11px] text-muted font-medium">Nhóm CV</label><select value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none cursor-pointer"><option value="">—</option>{WORK_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="col-span-2"><label className="text-[11px] text-muted font-medium">Công việc *</label><input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Nhập công việc..." className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div className="col-span-2"><label className="text-[11px] text-muted font-medium">URL</label><input value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="URL..." className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div><label className="text-[11px] text-muted font-medium">SL</label><input type="number" value={newQty} onChange={e=>setNewQty(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div><label className="text-[11px] text-muted font-medium">Trạng thái</label><select value={newStatus} onChange={e=>setNewStatus(e.target.value)} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none cursor-pointer">{WORK_STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
                <div><label className="text-[11px] text-muted font-medium">%</label><input type="number" value={newPct} onChange={e=>setNewPct(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
                <div className="col-span-2"><label className="text-[11px] text-muted font-medium">Ghi chú</label><input value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Ghi chú..." className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={()=>setShowNewWork(false)} className="px-4 py-2 bg-white border border-border rounded-xl text-xs font-medium hover:bg-gray-50">Huỷ</button>
                <button onClick={addWork} className="flex items-center gap-1.5 px-5 py-2 bg-[#4f46e5] text-white rounded-xl text-xs font-medium hover:shadow-md transition-all"><Check size={14}/> Lưu công việc</button>
              </div>
            </div>
          )}

          {/* Work Data Grid */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full table-fixed border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/90 border-b-2 border-border">
                    <th className="w-9 px-3 py-3"><input type="checkbox" checked={selectedWorks.size===works.length&&works.length>0} onChange={()=>setSelectedWorks(selectedWorks.size===works.length?new Set():new Set(works.map(w=>w.id)))} className="accent-[#4f46e5] scale-90" /></th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-28">Ngày</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-36">Nhân sự</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-28">Nhóm CV</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left min-w-[180px]">Công việc</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left min-w-[120px]">URL</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">SL</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-32">Trạng thái</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-36">KPI</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-28">Ghi chú</th>
                    <th className="w-9 px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {works.map((w:any,i:number) => (
                    <tr key={w.id} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2.5"><input type="checkbox" checked={selectedWorks.has(w.id)} onChange={()=>{const n=new Set(selectedWorks);n.has(w.id)?n.delete(w.id):n.add(w.id);setSelectedWorks(n);}} className="accent-[#4f46e5] scale-90" /></td>
                      <td className="px-3 py-2.5"><input type="date" value={fmtDate(w.date)} onChange={e=>setWorks((p:any[])=>p.map((r:any)=>r.id===w.id?{...r,date:e.target.value}:r))} onBlur={e=>editCell(w.id,'date',(e.target as HTMLInputElement).value,false)} className="w-full px-1 py-1 bg-transparent text-xs outline-none border-0" /></td>
                      <td className="px-3 py-2.5 text-xs text-muted">{w.employeeName||user.name}</td>
                      <td className="px-3 py-2.5">
                        <select value={w.category||''} onChange={e=>setWorks((p:any[])=>p.map((r:any)=>r.id===w.id?{...r,category:e.target.value}:r))} onBlur={e=>editCell(w.id,'category',(e.target as HTMLSelectElement).value,false)}
                          className="w-full px-1 py-1 bg-transparent text-xs outline-none border-0 cursor-pointer rounded-lg hover:bg-gray-50">
                          <option value="">—</option>
                          {WORK_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2.5"><input value={w.task||''} onChange={e=>setWorks((p:any[])=>p.map((r:any)=>r.id===w.id?{...r,task:e.target.value}:r))} onBlur={e=>editCell(w.id,'task',(e.target as HTMLInputElement).value,false)} placeholder="Nhập công việc..." className="w-full px-2 py-1.5 bg-transparent text-xs outline-none border-0 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-[#4f46e5]/25" /></td>
                      <td className="px-3 py-2.5"><input value={w.url||''} onChange={e=>setWorks((p:any[])=>p.map((r:any)=>r.id===w.id?{...r,url:e.target.value}:r))} onBlur={e=>editCell(w.id,'url',(e.target as HTMLInputElement).value,false)} placeholder="URL..." className="w-full px-2 py-1.5 bg-transparent text-xs outline-none border-0 rounded-lg truncate max-w-[110px] hover:bg-gray-50 focus:ring-2 focus:ring-[#4f46e5]/25" /></td>
                      <td className="px-3 py-2.5 text-right"><input type="number" value={w.qty||0} onChange={e=>setWorks((p:any[])=>p.map((r:any)=>r.id===w.id?{...r,qty:Number(e.target.value)}:r))} onBlur={e=>editCell(w.id,'qty',Number((e.target as HTMLInputElement).value),false)} className="w-16 px-2 py-1.5 bg-transparent text-xs outline-none border-0 rounded-lg text-right hover:bg-gray-50 focus:ring-2 focus:ring-[#4f46e5]/25" /></td>
                      <td className="px-3 py-2.5">
                        <select value={w.status||'pending'} onChange={e=>setWorks((p:any[])=>p.map((r:any)=>r.id===w.id?{...r,status:e.target.value}:r))} onBlur={e=>editCell(w.id,'status',(e.target as HTMLSelectElement).value,false)}
                          className={'px-2 py-1 rounded-md text-xs font-medium outline-none cursor-pointer border '+(STATUS_BADGE[w.status]||'bg-gray-50 text-gray-600')}>
                          {WORK_STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted">{w.planTask||""} <span className="text-muted/60">{w.completion_percent||0}%</span></td>
                      <td className="px-3 py-2.5"><input value={w.note||''} onChange={e=>setWorks((p:any[])=>p.map((r:any)=>r.id===w.id?{...r,note:e.target.value}:r))} onBlur={e=>editCell(w.id,'note',(e.target as HTMLInputElement).value,false)} placeholder="Ghi chú..." className="w-full px-2 py-1.5 bg-transparent text-xs outline-none border-0 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-[#4f46e5]/25" /></td>
                      <td className="px-3 py-2.5 text-center"><button onClick={()=>delWork(w.id)} className="p-1.5 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                  {works.length===0&&<tr><td colSpan={12} className="py-16 text-center text-sm text-muted"><FileText size={36} className="mx-auto mb-3 opacity-30"/>Chưa có báo cáo công việc</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ SEO RESULTS ============ */}
      {tab === 'results' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input type="date" value={rf.dateFrom||''} onChange={e=>setRf(p=>({...p,dateFrom:e.target.value}))} className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input type="date" value={rf.dateTo||''} onChange={e=>setRf(p=>({...p,dateTo:e.target.value}))} className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input value={rf.keyword} onChange={e=>setRf(p=>({...p,keyword:e.target.value}))} placeholder="Từ khóa..." className="w-40 pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
            <button onClick={()=>setShowNewResult(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-medium hover:shadow-md"><Plus size={14}/> Thêm</button>
          </div>

          {showNewResult && (
            <div className="bg-white rounded-2xl border-2 border-[#4f46e5] shadow-md p-5 space-y-3 animate-slide-in">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Thêm kết quả SEO mới</h3><button onClick={()=>setShowNewResult(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16}/></button></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div><label className="text-[11px] text-muted font-medium">Ngày</label><input type="date" value={nrDate} onChange={e=>setNrDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
                <div className="col-span-2"><label className="text-[11px] text-muted font-medium">Từ khóa *</label><input value={nrKeyword} onChange={e=>setNrKeyword(e.target.value)} placeholder="Nhập từ khóa..." className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div className="col-span-2"><label className="text-[11px] text-muted font-medium">URL</label><input value={nrUrl} onChange={e=>setNrUrl(e.target.value)} placeholder="URL..." className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div><label className="text-[11px] text-muted font-medium">Rank cũ</label><input type="number" value={nrPrev} onChange={e=>setNrPrev(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
                <div><label className="text-[11px] text-muted font-medium">Rank mới</label><input type="number" value={nrCurr} onChange={e=>setNrCurr(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
                <div><label className="text-[11px] text-muted font-medium">Click</label><input type="number" value={nrClicks} onChange={e=>setNrClicks(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
                <div><label className="text-[11px] text-muted font-medium">Impression</label><input type="number" value={nrImpressions} onChange={e=>setNrImpressions(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
                <div><label className="text-[11px] text-muted font-medium">Traffic</label><input type="number" value={nrTraffic} onChange={e=>setNrTraffic(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
                <div><label className="text-[11px] text-muted font-medium">Lead</label><input type="number" value={nrLeads} onChange={e=>setNrLeads(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
                <div><label className="text-[11px] text-muted font-medium">Đơn</label><input type="number" value={nrOrders} onChange={e=>setNrOrders(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
                <div><label className="text-[11px] text-muted font-medium">Doanh thu</label><input type="number" value={nrRevenue} onChange={e=>setNrRevenue(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={()=>setShowNewResult(false)} className="px-4 py-2 bg-white border border-border rounded-xl text-xs font-medium hover:bg-gray-50">Huỷ</button>
                <button onClick={addResult} className="flex items-center gap-1.5 px-5 py-2 bg-[#4f46e5] text-white rounded-xl text-xs font-medium hover:shadow-md transition-all"><Check size={14}/> Lưu kết quả</button>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full table-fixed border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/90 border-b-2 border-border">
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-28">Ngày</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left min-w-[140px]">Từ khóa</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left min-w-[120px]">URL</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">Rank cũ</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">Rank mới</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-center w-24">Thay đổi</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">Click</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-20">Impression</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-14">CTR</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-16">Traffic</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-12">Lead</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-14">Đơn</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-right w-28">Doanh thu</th>
                    <th className="w-9 px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r:any,i:number)=>{
                    const change = (r.prev_rank||0)-(r.curr_rank||0);
                    const ctr = r.impressions>0?((r.clicks||0)/r.impressions*100).toFixed(1):'0.0';
                    return (<tr key={r.id||i} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2.5"><input type="date" value={fmtDate(r.date)} onChange={e=>setResults((p:any[])=>p.map((x:any)=>x.id===r.id?{...x,date:e.target.value}:x))} onBlur={()=>editCell(r.id,'r_date',(document.activeElement as HTMLInputElement)?.value||'','_')} className="w-full px-1 py-1 bg-transparent text-xs outline-none border-0" /></td>
                      <td className="px-3 py-2.5">
                        {editId===r.id&&editField==='keyword'?<input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={()=>{setEditId(null);api('/seo/results/'+r.id,{method:'PUT',body:JSON.stringify({keyword:editVal})}).catch(()=>showMsg('error','Lỗi lưu'))}} onKeyDown={e=>{if(e.key==='Enter'){setEditId(null);api('/seo/results/'+r.id,{method:'PUT',body:JSON.stringify({keyword:editVal})}).catch(()=>showMsg('error','Lỗi'));}if(e.key==='Escape')setEditId(null);}} className="w-full px-2 py-1.5 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none" />
                        :<span onClick={()=>{setEditId(r.id);setEditField('keyword');setEditVal(r.keyword||'');}} className={'block px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-100/80 '+(!r.keyword?'text-muted italic':'')}>{r.keyword||'Nhập từ khóa...'}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted truncate max-w-[110px]">{r.url||'—'}</td>
                      <td className="px-3 py-2.5 text-xs text-right">{r.prev_rank||'—'}</td>
                      <td className="px-3 py-2.5 text-xs text-right">{r.curr_rank||'—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        {change>0?<span className="text-green-600 text-xs font-medium flex items-center justify-center gap-1"><TrendingUp size={12}/>+{change}</span>:change<0?<span className="text-red-600 text-xs font-medium flex items-center justify-center gap-1"><TrendingDown size={12}/>{change}</span>:<span className="text-muted text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2.5"><input type="number" value={r.clicks||0} onChange={e=>setResults((p:any[])=>p.map((x:any)=>x.id===r.id?{...x,clicks:Number(e.target.value)}:x))} onBlur={()=>editCell(r.id,'r_clicks',(document.activeElement as HTMLInputElement)?.value||'0','_')} className="w-full px-2 py-1.5 bg-transparent text-xs outline-none border-0 rounded-lg text-right hover:bg-gray-50 focus:ring-2 focus:ring-[#4f46e5]/25" /></td>
                      <td className="px-3 py-2.5"><input type="number" value={r.impressions||0} onChange={e=>setResults((p:any[])=>p.map((x:any)=>x.id===r.id?{...x,impressions:Number(e.target.value)}:x))} onBlur={()=>editCell(r.id,'r_impressions',(document.activeElement as HTMLInputElement)?.value||'0','_')} className="w-full px-2 py-1.5 bg-transparent text-xs outline-none border-0 rounded-lg text-right hover:bg-gray-50 focus:ring-2 focus:ring-[#4f46e5]/25" /></td>
                      <td className="px-3 py-2.5 text-xs text-right font-medium">{ctr}%</td>
                      <td className="px-3 py-2.5 text-xs text-right">{r.traffic||0}</td>
                      <td className="px-3 py-2.5 text-xs text-right">{r.leads||0}</td>
                      <td className="px-3 py-2.5 text-xs text-right">{r.orders||0}</td>
                      <td className="px-3 py-2.5 text-xs text-right font-medium">{(r.revenue||0).toLocaleString('vi-VN')}đ</td>
                      <td className="px-3 py-2.5 text-center"><button onClick={()=>delResult(r.id)} className="p-1.5 rounded hover:bg-red-50 text-muted hover:text-red-500"><Trash2 size={12}/></button></td>
                    </tr>);
                  })}
                  {results.length===0&&<tr><td colSpan={14} className="py-16 text-center text-sm text-muted"><TrendingUp size={36} className="mx-auto mb-3 opacity-30"/>Chưa có kết quả SEO</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ PLANS ============ */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input type="month" value={planPeriod} onChange={e=>{setPlanPeriod(e.target.value);loadPlans(e.target.value);}} className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <button onClick={()=>setPlanForm({period:planPeriod||new Date().toISOString().slice(0,7),objective:'',kpi:'',task:'',assigneeId:'',deadline:'',plannedQty:0,status:'not_started',note:''})}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-medium hover:shadow-md"><Plus size={14}/> Thêm kế hoạch</button>
          </div>
          {planForm&&(
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setPlanForm(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-border overflow-hidden" onClick={e=>e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border"><h3 className="font-bold text-sm">{planForm.id?'Sửa kế hoạch':'Kế hoạch SEO mới'}</h3><button onClick={()=>setPlanForm(null)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18}/></button></div>
                <div className="flex-1 overflow-auto p-6 space-y-5">
                  <div><label className="text-xs font-medium text-muted mb-1.5 block">Công việc *</label><input value={planForm.task} onChange={e=>setPlanForm({...planForm,task:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="VD: Viết 20 bài SEO" /></div>
                  <div className="grid grid-cols-2 gap-5"><div><label className="text-xs font-medium text-muted mb-1.5 block">Mục tiêu</label><input value={planForm.objective} onChange={e=>setPlanForm({...planForm,objective:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="Ví dụ: Tăng traffic" /></div><div><label className="text-xs font-medium text-muted mb-1.5 block">KPI</label><input value={planForm.kpi} onChange={e=>setPlanForm({...planForm,kpi:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="Ví dụ: 20 bài/tháng" /></div></div>
                  <div className="grid grid-cols-3 gap-5">
                    <div><label className="text-xs font-medium text-muted mb-1.5 block">Người phụ trách</label><select value={planForm.assigneeId} onChange={e=>setPlanForm({...planForm,assigneeId:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none cursor-pointer"><option value="">—</option>{users.map((u:any)=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    <div><label className="text-xs font-medium text-muted mb-1.5 block">Deadline</label><input type="date" value={fmtDate(planForm.deadline)} onChange={e=>setPlanForm({...planForm,deadline:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                    <div><label className="text-xs font-medium text-muted mb-1.5 block">Số lượng</label><input type="number" value={planForm.plannedQty} onChange={e=>setPlanForm({...planForm,plannedQty:Number(e.target.value)})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                  </div>
                  <div><label className="text-xs font-medium text-muted mb-1.5 block">Ghi chú</label><textarea value={planForm.note} onChange={e=>setPlanForm({...planForm,note:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none resize-none h-24" /></div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border"><button onClick={()=>setPlanForm(null)} className="px-5 py-2.5 bg-white border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">Huỷ</button><button onClick={savePlan} className="px-5 py-2.5 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all">Lưu kế hoạch</button></div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {plans.map((p:any)=>{
              const remaining = (p.planned_qty||0)-(p.completed_qty||0);
              const pct = p.planned_qty>0?Math.round((p.completed_qty||0)/p.planned_qty*100):0;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <div className={'h-1.5 '+(pct>=100?'bg-green-500':pct>=50?'bg-amber-500':'bg-gray-200')} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0"><h3 className="font-semibold text-sm text-[#171717]">{p.task}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted mt-2 flex-wrap">
                          {p.period&&<span>📅 {p.period}</span>}{p.assigneeName&&<span>👤 {p.assigneeName}</span>}{p.deadline&&<span>⏰ {p.deadline}</span>}
                          <span className={'px-2 py-0.5 rounded-md text-xs font-medium border '+(STATUS_BADGE[p.status]||'bg-gray-50 text-gray-500')}>{STATUS_LABELS[p.status]}</span>
                        </div>
                        {p.objective&&<p className="text-xs text-muted mt-2">{p.objective}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold">{pct}%</p>
                        <div className="w-28 h-2 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                          <div className={'h-full rounded-full transition-all '+(pct>=100?'bg-green-500':pct>=50?'bg-amber-500':'bg-[#4f46e5]')} style={{width:pct+'%'}} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted"><span>Đã làm: <strong className="text-[#171717]">{p.completed_qty||0}</strong></span><span>/ {p.planned_qty||0}</span>{remaining>0&&<span className="text-amber-600">· Còn {remaining}</span>}</div>
                      <div className="flex items-center gap-3">
                        <button onClick={()=>setPlanForm({id:p.id,period:p.period,objective:p.objective||'',kpi:p.kpi||'',task:p.task,assigneeId:p.assignee_id||'',deadline:p.deadline||'',plannedQty:p.planned_qty||0,completedQty:p.completed_qty||0,status:p.status,note:p.note||''})} className="text-xs text-muted hover:text-[#4f46e5] transition-all font-medium">Sửa</button>
                        <button onClick={()=>delPlan(p.id)} className="text-xs text-muted hover:text-red-500 transition-all font-medium">Xoá</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {plans.length===0&&<div className="lg:col-span-2 text-center py-16 text-sm text-muted"><Target size={36} className="mx-auto mb-3 opacity-30"/>Chưa có kế hoạch SEO</div>}
          </div>
        </div>
      )}
    </div>
  );
}