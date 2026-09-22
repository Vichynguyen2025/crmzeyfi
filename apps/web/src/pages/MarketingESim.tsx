import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart3, MessageSquare, Megaphone, Plus, X, Save, Check, AlertCircle, List, DollarSign, Eye, MousePointerClick, TrendingUp, Percent, Receipt } from 'lucide-react';
import { api } from '../lib/api';

const TABS = [
  { key: 'thongke', label: 'Thống kê', icon: BarChart3 },
  { key: 'social', label: 'Content Social', icon: MessageSquare },
  { key: 'quangcao', label: 'Quảng cáo', icon: Megaphone },
  { key: 'seo', label: 'Doanh thu SEO', icon: TrendingUp },
];

const PLATFORMS = ['Facebook', 'Instagram', 'Tiktok', 'Zalo', 'Youtube', 'Website'];
const STATUSES = [
  { key: 'idea', label: 'Ý tưởng', color: '#6b7280' },
  { key: 'writing', label: 'Đang viết', color: '#f59e0b' },
  { key: 'review', label: 'Chờ duyệt', color: '#4f46e5' },
  { key: 'approved', label: 'Đã duyệt', color: '#22c55e' },
  { key: 'published', label: 'Đã đăng', color: '#06b6d4' },
];

export default function MarketingESim() {
  const { tab: routeTab } = useParams();
  const nav = useNavigate();
  const tab = routeTab || 'social';
  const setTab = (key:string) => nav('/crm/marketing/' + key);
  const [rows, setRows] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{type:string, msg:string}|null>(null);
  const [wordEditor, setWordEditor] = useState<any>(null);
  const [adRows, setAdRows] = useState<any[]>([]);
  const [adMonth, setAdMonth] = useState(new Date().toISOString().slice(0, 7));
  const [adGroupBy, setAdGroupBy] = useState('day');
  const [adFilterPlatform, setAdFilterPlatform] = useState('');
  const [adFilterUser, setAdFilterUser] = useState('');
  const [adSaving, setAdSaving] = useState<Set<string>>(new Set());
  const [seoRows, setSeoRows] = useState<any[]>([]);
  const [seoGroupBy, setSeoGroupBy] = useState('day');
  const [seoMonth, setSeoMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [seoDateFrom, setSeoDateFrom] = useState('');
  const [seoDateTo, setSeoDateTo] = useState('');
  const [seoSaving, setSeoSaving] = useState(false);
  const [tkMonth, setTkMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tkGroupBy, setTkGroupBy] = useState('month');
  const [tkSocialData, setTkSocialData] = useState<any[]>([]);
  const [tkAdsData, setTkAdsData] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({name:'', email:'', phone:'', password:'', role:'member'});
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const showToast = (type:string, msg:string) => { setToast({type,msg}); setTimeout(()=>setToast(null),2000); };

  const load = useCallback(async (m?:string) => {
    try {
      const [data, modUsers, allU] = await Promise.all([
        api('/social-content?month='+(m||month)),
        api('/user-modules?moduleKey=marketing'),
        api('/users')
      ]);
      setRows(data||[]);
      setMembers(modUsers||[]);
      setAllUsers(allU||[]);
    } catch { setRows([]); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const saveField = async (id:string, field:string, val:any) => {
    setSaving(s => new Set(s).add(id));
    setRows((prev:any[]) => prev.map(r => r.id===id ? {...r, [field]:val} : r));
    try { await api('/social-content/'+id, {method:'PUT', body:JSON.stringify({[field]:val})}); showToast('success','✓ Đã lưu'); }
    catch { setRows((prev:any[]) => prev.map(r => r.id===id ? {...r, [field]:(prev.find((x:any)=>x.id===id)||{})[field]||''} : r)); showToast('error','✗ Lỗi lưu'); }
    setSaving(s => { const n = new Set(s); n.delete(id); return n; });
  };

  const addRow = async () => {
    try {
      const res = await api('/social-content', {method:'POST', body:JSON.stringify({date:new Date().toISOString().slice(0,10)})});
      if (res?.id) { load(); showToast('success','✓ Đã thêm'); }
    } catch { showToast('error','✗ Lỗi'); }
  };

  const deleteRow = async (id:string) => {
    if (!confirm('Xoá?')) return;
    try { await api('/social-content/'+id, {method:'DELETE'}); load(); showToast('success','✓ Đã xoá'); }
    catch { showToast('error','✗ Lỗi'); }
  };

  const loadAds = useCallback(async () => {
    try {
      let url = '/ads?month='+adMonth+'&groupBy='+adGroupBy;
      if (adFilterPlatform) url += '&platform='+adFilterPlatform;
      if (adFilterUser) url += '&userId='+adFilterUser;
      const data = await api(url);
      setAdRows(data||[]);
    } catch { setAdRows([]); }
  }, [adMonth, adGroupBy, adFilterPlatform, adFilterUser]);

  useEffect(() => { loadAds(); }, [loadAds]);

  const saveAdField = async (id:string, field:string, val:any) => {
    setAdSaving(s => new Set(s).add(id));
    setAdRows((prev:any[]) => prev.map(r => r.id===id ? {...r, [field]:val} : r));
    try { await api('/ads/'+id, {method:'PUT', body:JSON.stringify({[field]:val})}); showToast('success','✓ Đã lưu'); }
    catch { setAdRows((prev:any[]) => prev.map(r => r.id===id ? {...r, [field]:(prev.find((x:any)=>x.id===id)||{})[field]||0} : r)); showToast('error','✗ Lỗi lưu'); }
    setAdSaving(s => { const n = new Set(s); n.delete(id); return n; });
  };

const addAdRow = async () => {
    try {
      const u = JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
      const res = await api('/ads', {method:'POST', body:JSON.stringify({date:new Date().toISOString().slice(0,10), platform:'facebook_ads', userId:u.id||''})});
      if (res?.id) { loadAds(); showToast('success','✓ Đã thêm'); }
    } catch { showToast('error','✗ Lỗi'); }
  };

  const loadTk = useCallback(async () => {
    try {
      const [social, ads] = await Promise.all([
        api('/social-content?month='+tkMonth),
        api('/ads?month='+tkMonth+'&groupBy='+tkGroupBy)
      ]);
      setTkSocialData(social||[]);
      setTkAdsData(ads||[]);
    } catch { setTkSocialData([]); setTkAdsData([]); }
  }, [tkMonth, tkGroupBy]);

  useEffect(() => { loadTk(); }, [loadTk]);
  useEffect(() => {
    if (tab !== 'seo') return;
    const loadSeo = async () => {
      try {
        const u = JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
        const r = await api('/seo-revenue/'+(u.id||'all')+'?month='+seoMonth);
        setSeoRows(r||[]);
      } catch { setSeoRows([]); }
    };
    loadSeo();
  }, [tab, seoMonth]);
  // Auto-save seo data with debounce
  useEffect(() => {
    if (!seoSaving && seoRows.length > 0 && tab === 'seo') {
      const timer = setTimeout(async () => {
        try {
          const u = JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
          await api('/seo-revenue/'+(u.id||'all'), { method:'POST', body:JSON.stringify({rows: seoRows, month: seoMonth}) });
        } catch {}
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [seoRows, seoMonth, tab]);

  const addMember = async (userId: string) => {
    if (!userId) return;
    try {
      await api('/user-modules/toggle', {method:'POST', body:JSON.stringify({userId, moduleKey:'marketing', add:true})});
      setShowAddMember(false);
      setSelectedUserId('');
      setMembers(prev => {
        const u = allUsers.find(u => u.id === userId);
        if (!u) return prev;
        if (prev.some(m => m.id === userId || m.user_id === userId)) return prev;
        return [...prev, {user_id: userId, userName: u.name, userIdRef: u.id}];
      });
      showToast('success', '✓ Đã thêm vào Marketing');
    } catch(e:any) { showToast('error', '✗ ' + e.message); }
  };
  
  const removeMarketingMember = async (userId: string) => {
    if (!confirm('Xoá thành viên này khỏi Marketing?')) return;
    try {
      await api('/user-modules/toggle', {method:'POST', body:JSON.stringify({userId, moduleKey:'marketing', add:false})});
      setMembers(prev => prev.filter((m:any) => (m.user_id || m.id) !== userId));
      showToast('success', '✓ Đã xoá khỏi Marketing');
    } catch(e:any) { showToast('error', '✗ ' + e.message); }
  };

  const filteredRows = rows.filter((r:any) => {
    if (filterAssignee && r.assignee !== filterAssignee) return false;
    if (filterPlatform && r.platform !== filterPlatform) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium ' +
          (toast.type==='success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type==='success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {toast.msg}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#171717]">Marketing eSim</h1>
        <div className="flex items-center gap-1 bg-white rounded-xl border border-border shadow-sm p-0.5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ' +
                (tab===t.key ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-muted hover:bg-gray-50')}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'thongke' && (() => {
    const totalSocial = tkSocialData.length;
    const published = tkSocialData.filter((r:any) => r.status === 'published').length;
    const inProgress = tkSocialData.filter((r:any) => r.status === 'writing' || r.status === 'review').length;
    const completionRate = totalSocial > 0 ? Math.round(published / totalSocial * 100) : 0;
    const platformCount: Record<string, number> = {};
    tkSocialData.forEach((r:any) => { const p = r.platform || 'unknown'; platformCount[p] = (platformCount[p]||0) + 1; });
    const topPlatform = Object.entries(platformCount).sort((a,b) => b[1]-a[1]);
    const sum = (f:string) => tkAdsData.reduce((a:number,r:any) => a + Number(r[f]||0), 0);
    const sumTax = sum('cost_with_tax');
    const sumEx = sumTax > 0 ? sumTax / 1.08 : 0;
    const sumRev = sum('revenue'); const sumOrd = sum('orders'); const sumSim = sum('sims');
    const sumImp = sum('impressions'); const sumClk = sum('clicks');
    const roas = sumEx > 0 ? sumRev / sumEx : 0;
    const cpOrder = sumOrd > 0 ? sumEx / sumOrd : 0;
    const cpc = sumClk > 0 ? sumEx / sumClk : 0;
    const ctr = sumImp > 0 ? sumClk / sumImp * 100 : 0;
    const tax = sumTax - sumEx;
    const costPerContent = totalSocial > 0 ? sumEx / totalSocial : 0;
    const revPerContent = totalSocial > 0 ? sumRev / totalSocial : 0;
    const roasPct = sumRev > 0 ? sumRev / Math.max(1,sumTax) * 100 : 0;
    const fmt = (n:number) => Math.round(n).toLocaleString('vi-VN');

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#171717]">Thống kê Marketing</h1>
            <input type="month" value={tkMonth} onChange={e => setTkMonth(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
          </div>
          <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-0.5">
            {(['day','week','month'] as const).map(v => (
              <button key={v} onClick={() => setTkGroupBy(v)}
                className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' + (tkGroupBy===v ? 'bg-[#4f46e5] text-white' : 'text-muted hover:text-ink')}>
                {v==='day' ? 'Ngày' : v==='week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs text-muted mb-1">Tổng đầu tư (có thuế)</p>
            <p className="text-xl font-bold text-[#171717]">{sumTax > 0 ? fmt(sumTax)+'đ' : '0đ'}</p>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs text-muted mb-1">Tổng doanh thu</p>
            <p className="text-xl font-bold text-green-600">{sumRev > 0 ? fmt(sumRev)+'đ' : '0đ'}</p>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs text-muted mb-1">Đơn hàng</p>
            <p className="text-xl font-bold text-[#171717]">{sumOrd} đơn · {sumSim} SIM</p>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs text-muted mb-1">Hiệu quả</p>
            <p className="text-xl font-bold text-[#4f46e5]">{roas.toFixed(1)}x ROAS</p>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Content Social */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#171717]">Content Social</h3>
              <span className="text-xs text-muted">{totalSocial} bài</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-indigo-50/50 rounded-xl">
                  <p className="text-lg font-bold text-[#4f46e5]">{published}</p>
                  <p className="text-[10px] text-muted mt-0.5">Đã đăng</p>
                </div>
                <div className="text-center p-3 bg-amber-50/50 rounded-xl">
                  <p className="text-lg font-bold text-amber-600">{inProgress}</p>
                  <p className="text-[10px] text-muted mt-0.5">Đang xử lý</p>
                </div>
                <div className="text-center p-3 bg-blue-50/50 rounded-xl">
                  <p className="text-lg font-bold text-blue-600">{completionRate}%</p>
                  <p className="text-[10px] text-muted mt-0.5">Hoàn thành</p>
                </div>
              </div>
              {topPlatform.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {topPlatform.map(([p,c]:[string,number]) => (
                    <span key={p} className="px-2 py-0.5 bg-gray-50 border border-border rounded text-[10px] text-muted font-medium">
                      {p==='Facebook'?'FB':p==='Instagram'?'IG':p==='Tiktok'?'TT':p==='Zalo'?'ZL':p==='Youtube'?'YT':p==='Website'?'WEB':p} {c}
                    </span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-muted">CP / bài</p>
                  <p className="text-sm font-bold text-[#171717]">{costPerContent>0 ? fmt(costPerContent)+'đ' : '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-muted">DT / bài</p>
                  <p className="text-sm font-bold text-[#171717]">{revPerContent>0 ? fmt(revPerContent)+'đ' : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quảng cáo */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#171717]">Quảng cáo</h3>
              <span className="text-xs text-muted">{tkAdsData.length} dòng</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-indigo-50/50 rounded-xl">
                  <p className="text-lg font-bold text-[#4f46e5]">{sumTax>0 ? fmt(sumTax)+'đ' : '0đ'}</p>
                  <p className="text-[10px] text-muted mt-0.5">CP (có thuế)</p>
                </div>
                <div className="text-center p-3 bg-emerald-50/50 rounded-xl">
                  <p className="text-lg font-bold text-green-600">{sumRev>0 ? fmt(sumRev)+'đ' : '0đ'}</p>
                  <p className="text-[10px] text-muted mt-0.5">Doanh thu</p>
                </div>
                <div className="text-center p-3 bg-amber-50/50 rounded-xl">
                  <p className="text-lg font-bold text-amber-600">{sumOrd} đơn</p>
                  <p className="text-[10px] text-muted mt-0.5">{sumSim} SIM</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-2.5 border border-indigo-100">
                  <p className="text-[10px] text-muted">ROAS</p>
                  <p className="text-sm font-bold text-[#4f46e5]">{roas.toFixed(1)}x</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-muted">CTR</p>
                  <p className="text-sm font-bold text-[#171717]">{ctr.toFixed(1)}%</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-muted">CPC</p>
                  <p className="text-sm font-bold text-[#171717]">{cpc>0 ? fmt(cpc)+'đ' : '—'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-red-50/50 rounded-lg border border-red-100">
                <span className="text-xs text-muted">Thuế 8%</span>
                <span className="text-sm font-bold text-red-500">{tax>0 ? fmt(tax)+'đ' : '0đ'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Member list */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#171717]">Thành viên</h3>
            <button onClick={() => setShowAddMember(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4f46e5] text-white rounded-lg text-xs font-medium hover:bg-[#4338ca] transition-all"><Plus size={13} /> Thêm</button>
          </div>
          <div className="divide-y divide-border/50">
            {members.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">Chưa có thành viên</div>}
            {members.map((m:any) => { const mId = m.user_id || m.id;
              const mySocial = tkSocialData.filter((r:any) => r.assignee === mId);
              const myAds = tkAdsData.filter((r:any) => r.user_id === mId);
              const myPublished = mySocial.filter((r:any) => r.status === 'published').length;
              const myCPSum = myAds.reduce((a:number,r:any) => a + Number(r.cost_with_tax||0), 0);
              const myRev = myAds.reduce((a:number,r:any) => a + Number(r.revenue||0), 0);
              const myOrders = myAds.reduce((a:number,r:any) => a + Number(r.orders||0), 0);
              return (
                <div key={m.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50/60 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">
                    {(m.userName||m.name||'?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#171717] truncate">{m.userName||m.name}</p>
                    <p className="text-[11px] text-muted">{mySocial.length} bài · {myPublished} đã đăng</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#171717]">{myCPSum>0 ? fmt(myCPSum)+'đ' : '0đ'}</p>
                    <p className="text-[10px] text-muted">CP · {myRev>0 ? fmt(myRev)+'đ' : '0đ'} DT</p>
                  </div>
                
                  <button onClick={() => removeMarketingMember(mId)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xoá khỏi Marketing"><Trash2 size={14} /></button></div>
              );
            })}
          </div>
        </div>

        {/* Add member modal */}
        {showAddMember && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAddMember(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-3 border-b border-border bg-gray-50/60 flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#171717]">Thêm thành viên</h3>
                <button onClick={() => setShowAddMember(false)} className="p-1 rounded hover:bg-gray-200 text-muted"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-4">
                <input value={newMember.name} onChange={e => setNewMember({...newMember, name:e.target.value})} placeholder="Tên *" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
                <input value={newMember.email} onChange={e => setNewMember({...newMember, email:e.target.value})} placeholder="Email *" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={newMember.phone} onChange={e => setNewMember({...newMember, phone:e.target.value})} placeholder="Số điện thoại" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
                  <select value={newMember.role} onChange={e => setNewMember({...newMember, role:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none cursor-pointer">
                    <option value="member">Nhân viên</option>
                    <option value="manager">Quản lý</option>
                  </select>
                </div>
                <input type="password" value={newMember.password} onChange={e => setNewMember({...newMember, password:e.target.value})} placeholder="Mật khẩu *" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
                <div className="flex gap-3 pt-1">
                  <button onClick={() => addMember(selectedUserId)} disabled={!selectedUserId} className="flex-1 px-5 py-2.5 bg-[#4f46e5] text-white font-semibold rounded-xl text-sm hover:bg-[#4338ca] transition-all disabled:opacity-50"><Plus size={15} className="inline mr-1" />Thêm</button>
                  <button onClick={() => setShowAddMember(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium transition-all">Huỷ</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  })()}
      {tab === 'quangcao' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" value={adMonth} onChange={e => setAdMonth(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
            <select value={adFilterPlatform} onChange={e => setAdFilterPlatform(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none">
              <option value="">Tất cả nền tảng</option>
              <option value="google_ads">Google Ads</option>
              <option value="facebook_ads">Facebook Ads</option>
              <option value="tiktok_ads">Tiktok Ads</option>
            </select>
            <select value={adFilterUser} onChange={e => setAdFilterUser(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none">
              <option value="">Tất cả nhân sự</option>
              {members.map((m:any) => <option key={m.id} value={m.id}>{m.userName||m.name}</option>)}
            </select>
            <button onClick={addAdRow} className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:bg-[#4338ca] transition-all"><Plus size={16} />Thêm</button>
          </div>

          {(() => {
            const s = (f:string) => adRows.reduce((a:number,r:any)=>a+Number(r[f]||0),0);
            const sumTax = s('cost_with_tax');
            const sumEx = sumTax / 1.08;
            const sumRev = s('revenue');
            const sumOrd = s('orders');
            const sumSim = s('sims');
            const sumImp = s('impressions');
            const sumClk = s('clicks');
            const ctr = sumImp>0 ? sumClk/sumImp*100 : 0;
            const cpOrder = sumOrd>0 ? sumEx/sumOrd : 0;
            const roas = sumEx>0 ? sumRev/sumEx : 0;
            const cpDt = sumEx>0 ? sumEx/Math.max(1,sumRev)*100 : 0;
            const cpc = sumClk>0 ? sumEx/sumClk : 0;
            const tax = sumTax - sumEx;
            const fmt = (n:number) => Math.round(n).toLocaleString('vi-VN');
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><Receipt size={13} /><span>CP Ads (Có thuế)</span></div>
                  <p className="text-lg font-bold text-[#171717]">{sumTax>0 ? fmt(sumTax)+'đ' : '0đ'}</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><Receipt size={13} className="opacity-50" /><span>CP Ads (Chưa thuế)</span></div>
                  <p className="text-lg font-bold text-[#171717]">{sumEx>0 ? fmt(sumEx)+'đ' : '0đ'}</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><TrendingUp size={13} className="text-green-500" /><span>Doanh thu</span></div>
                  <p className="text-lg font-bold text-green-600">{sumRev>0 ? fmt(sumRev)+'đ' : '0đ'}</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><DollarSign size={13} className="text-blue-500" /><span>Đơn hàng</span></div>
                  <p className="text-lg font-bold text-[#171717]">{sumOrd}</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><DollarSign size={13} className="text-purple-500" /><span>Số SIM</span></div>
                  <p className="text-lg font-bold text-[#171717]">{sumSim}</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><Eye size={13} /><span>Impression</span></div>
                  <p className="text-lg font-bold text-[#171717]">{fmt(sumImp)}</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><MousePointerClick size={13} /><span>Click (TB)</span></div>
                  <p className="text-lg font-bold text-[#171717]">{sumClk>0 ? String(Math.round(sumClk/Math.max(1,adRows.length))) : '0'}</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><Percent size={13} /><span>CTR (TB)</span></div>
                  <p className="text-lg font-bold text-[#171717]">{ctr.toFixed(1)}%</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><DollarSign size={13} /><span>CP/Đơn (TB)</span></div>
                  <p className="text-lg font-bold text-[#171717]">{cpOrder>0 ? fmt(cpOrder)+'đ' : '—'}</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><TrendingUp size={13} className="text-emerald-500" /><span>ROAS</span></div>
                  <p className="text-lg font-bold text-[#4f46e5]">{roas.toFixed(1)}x</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><Percent size={13} className="text-orange-500" /><span>CP Ads / DT</span></div>
                  <p className="text-lg font-bold text-orange-600">{cpDt.toFixed(1)}%</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><MousePointerClick size={13} /><span>CPC (TB)</span></div>
                  <p className="text-lg font-bold text-[#171717]">{cpc>0 ? fmt(cpc)+'đ' : '—'}</p>
                </div>
                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted mb-2"><Percent size={13} className="text-red-500" /><span>Thuế (8%)</span></div>
                  <p className="text-lg font-bold text-red-500">{tax>0 ? fmt(tax)+'đ' : '0đ'}</p>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-0.5 w-fit">
            {(['day','week','month'] as const).map(v => (
              <button key={v} onClick={() => setAdGroupBy(v)}
                className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' +
                  (adGroupBy===v ? 'bg-[#4f46e5] text-white' : 'text-muted hover:text-ink')}>
                {v==='day' ? 'Ngày' : v==='week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed" style={{borderCollapse:'separate',borderSpacing:0}}>
                <colgroup>
                  <col style={{width:80}} /><col style={{width:80}} /><col style={{width:120}} /><col style={{width:120}} /><col style={{width:120}} /><col style={{width:50}} /><col style={{width:50}} /><col style={{width:50}} /><col style={{width:50}} /><col style={{width:40}} /><col style={{width:60}} /><col style={{width:50}} /><col style={{width:50}} /><col style={{width:50}} /><col style={{width:50}} /><col style={{width:25}} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-left">Ngày</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-left">Nền tảng</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">CP(có)</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">CP(chưa)</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">D.thu</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">Đơn</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">SIM</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">Impr</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">Click</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">CTR</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">CP/Đ</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">ROAS</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">CP/DT</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">CPC</th>
                    <th className="px-1 py-1.5 text-xs font-semibold text-muted uppercase text-right">Thuế</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {adRows.length===0 && (
                    <tr><td colSpan={16} className="px-6 py-12 text-center text-sm text-muted">
                      <div className="flex flex-col items-center gap-2"><List size={32} className="opacity-20" /><p>Chưa có dữ liệu</p></div>
                    </td></tr>
                  )}
                  {adRows.map((r:any, idx:number) => {
                    const costEx = Number(r.cost_with_tax||0) / 1.08;
                    const tax = Number(r.cost_with_tax||0) - costEx;
                    const ctr = Number(r.impressions||0)>0 ? Number(r.clicks||0)/Number(r.impressions||0)*100 : 0;
                    const cpOrder = Number(r.orders||0)>0 ? costEx/Number(r.orders||0) : 0;
                    const roas = costEx>0 ? Number(r.revenue||0)/costEx : 0;
                    const cpDt = costEx>0 ? costEx/Math.max(1,Number(r.revenue||0))*100 : 0;
                    const cpc = Number(r.clicks||0)>0 ? costEx/Number(r.clicks||0) : 0;
                    const isGrouped = adGroupBy !== 'day';
                    return (
                      <tr key={r.id||idx} className={'hover:bg-gray-50/60 transition-all ' + (adSaving.has(r.id) ? 'opacity-50' : '')}>
                        <td className="px-1 py-1 text-sm text-muted">{adGroupBy==='day' ? (r.dateStr||(r.date||'').split('T')[0]||r.periodLabel||'') : r.periodLabel||''}</td>
                        <td className="px-1 py-0.5 text-sm">
                        {isGrouped ? <span className="text-muted">{r.platform==='google_ads'?'Google':r.platform==='facebook_ads'?'Facebook':r.platform==='tiktok_ads'?'Tiktok':r.platform||'-'}</span> :
                          <select value={r.platform||'facebook_ads'} onChange={e => saveAdField(r.id,'platform',e.target.value)}
                            className="w-full bg-transparent text-sm outline-none border-0 cursor-pointer">
                            <option value="google_ads">Google Ads</option>
                            <option value="facebook_ads">Facebook Ads</option>
                            <option value="tiktok_ads">Tiktok Ads</option>
                          </select>}
                      </td>
                        <td className="px-1 py-0.5 text-sm text-right">
                          {isGrouped ? <span className="text-muted">{Math.round(Number(r.cost_with_tax||0)).toLocaleString('vi-VN')}</span> :
                            <input type="number" value={r.cost_with_tax||0}
                              onBlur={e => saveAdField(r.id,'cost_with_tax',Number(e.target.value))}
                              onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,cost_with_tax:Number(e.target.value)}:x))}
                              className="w-full bg-transparent text-sm text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-sm text-right text-muted">{Math.round(costEx).toLocaleString('vi-VN')}</td>
                        <td className="px-1 py-0.5 text-sm text-right">
                          {isGrouped ? <span className="text-muted">{Math.round(Number(r.revenue||0)).toLocaleString('vi-VN')}</span> :
                            <input type="number" value={r.revenue||0}
                              onBlur={e => saveAdField(r.id,'revenue',Number(e.target.value))}
                              onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,revenue:Number(e.target.value)}:x))}
                              className="w-full bg-transparent text-sm text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-sm text-right">{isGrouped ? <span className="text-muted">{Number(r.orders||0)}</span> :
                          <input type="number" value={r.orders||0}
                            onBlur={e => saveAdField(r.id,'orders',Number(e.target.value))}
                            onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,orders:Number(e.target.value)}:x))}
                            className="w-full bg-transparent text-sm text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-sm text-right">{isGrouped ? <span className="text-muted">{Number(r.sims||0)}</span> :
                          <input type="number" value={r.sims||0}
                            onBlur={e => saveAdField(r.id,'sims',Number(e.target.value))}
                            onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,sims:Number(e.target.value)}:x))}
                            className="w-full bg-transparent text-sm text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-sm text-right">{isGrouped ? <span className="text-muted">{Math.round(Number(r.impressions||0)).toLocaleString('vi-VN')}</span> :
                          <input type="number" value={r.impressions||0}
                            onBlur={e => saveAdField(r.id,'impressions',Number(e.target.value))}
                            onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,impressions:Number(e.target.value)}:x))}
                            className="w-full bg-transparent text-sm text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-sm text-right">{isGrouped ? <span className="text-muted">{Math.round(Number(r.clicks||0)).toLocaleString('vi-VN')}</span> :
                          <input type="number" value={r.clicks||0}
                            onBlur={e => saveAdField(r.id,'clicks',Number(e.target.value))}
                            onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,clicks:Number(e.target.value)}:x))}
                            className="w-full bg-transparent text-sm text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-sm text-right text-muted">{ctr.toFixed(1)}</td>
                        <td className="px-1 py-0.5 text-sm text-right text-muted">{cpOrder>0 ? Math.round(cpOrder).toLocaleString('vi-VN') : '—'}</td>
                        <td className="px-1 py-0.5 text-sm text-right font-medium text-[#4f46e5]">{roas.toFixed(1)}x</td>
                        <td className="px-1 py-0.5 text-sm text-right text-muted">{cpDt.toFixed(1)}</td>
                        <td className="px-1 py-0.5 text-sm text-right text-muted">{cpc>0 ? Math.round(cpc).toLocaleString('vi-VN') : '—'}</td>
                        <td className="px-1 py-0.5 text-sm text-right text-red-500 font-medium">{Math.round(tax).toLocaleString('vi-VN')}</td>
                        <td className="px-1 py-1 text-sm text-center">
                          {!isGrouped && <button onClick={() => { if(confirm('Xoá?')){api('/ads/'+r.id,{method:'DELETE'}).then(()=>loadAds()).catch(()=>{});}}} className="p-0.5 rounded hover:bg-red-50 text-muted hover:text-red-500"><X size={10} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-dashed border-border/50">
                    <td colSpan={16} className="px-2 py-2 text-xs text-center">
                      <button onClick={async () => {
                        try {
                          const res = await api('/ads', {method:'POST', body:JSON.stringify({date:new Date().toISOString().slice(0,10), platform:'facebook_ads'})});
                          if (res?.id) { loadAds(); showToast('success','✓ Đã thêm dòng'); }
                          else { showToast('error','✗ Lỗi thêm'); }
                        } catch(e:any) { showToast('error','✗ '+e.message); }
                      }} className="flex items-center justify-center gap-1 w-full py-2 text-xs text-muted hover:text-[#4f46e5] border-2 border-dashed border-border/50 rounded-lg hover:bg-gray-50/30 transition-all">
                        <Plus size={14} /> Thêm dòng
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {tab === 'seo' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-border p-4 shadow-sm">
            <input type="month" value={seoMonth} onChange={e=>setSeoMonth(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
            {seoGroupBy==='day'&&<>
              <input type="date" value={seoDateFrom} onChange={e=>setSeoDateFrom(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
              <span className="text-xs text-muted">→</span>
              <input type="date" value={seoDateTo} onChange={e=>setSeoDateTo(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
            </>}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-0.5">
              {['day','week','month'].map(v=>(
                <button key={v} onClick={()=>setSeoGroupBy(v)} className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all '+(seoGroupBy===v?'bg-[#4f46e5] text-white':'text-muted hover:text-ink')}>{v==='day'?'Ngày':v==='week'?'Tuần':'Tháng'}</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50/80 border-b border-border">
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted text-left w-28">Ngày</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted text-left w-24">Kênh</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted text-right w-16">Đơn</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted text-right w-24">Doanh thu</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted text-right w-20">CP</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted text-right w-20">Impr</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted text-right w-16">Click</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr></thead>
                <tbody>
                  {(!seoRows||seoRows.length===0)?<tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-muted">Chưa có dữ liệu</td></tr>
                  :seoRows.map((r,i)=>(
                    <tr key={i} className="border-b border-border/50 hover:bg-gray-50/60 transition-all">
                      <td className="px-4 py-2.5 text-xs">{r.date?new Date(r.date).toLocaleDateString('fr-CA'):''}</td>
                      <td className="px-4 py-2.5">
                        <select value={r.channel||''} onChange={e=>{const x=[...seoRows];x[i]={...x[i],channel:e.target.value};setSeoRows(x);}} className="w-full px-2 py-1.5 bg-white border border-border rounded-lg text-xs outline-none">
                          <option value="">Chọn</option>
                          <option value="google_organic">Google Organic</option>
                          <option value="google_ads">Google Ads</option>
                          <option value="facebook">Facebook</option>
                          <option value="zalo">Zalo</option>
                          <option value="tiktok">Tiktok</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5"><input type="number" value={r.orders||''} onChange={e=>{const x=[...seoRows];x[i]={...x[i],orders:Number(e.target.value)};setSeoRows(x);}} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/20" /></td>
                      <td className="px-4 py-2.5"><input type="number" value={r.revenue||''} onChange={e=>{const x=[...seoRows];x[i]={...x[i],revenue:Number(e.target.value)};setSeoRows(x);}} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/20" /></td>
                      <td className="px-4 py-2.5"><input type="number" value={r.cost||''} onChange={e=>{const x=[...seoRows];x[i]={...x[i],cost:Number(e.target.value)};setSeoRows(x);}} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none focus:ring-2 focus:ring-[#4f46e5]/20" /></td>
                      <td className="px-4 py-2.5"><input type="number" value={r.impressions||''} onChange={e=>{const x=[...seoRows];x[i]={...x[i],impressions:Number(e.target.value)};setSeoRows(x);}} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none" /></td>
                      <td className="px-4 py-2.5"><input type="number" value={r.clicks||''} onChange={e=>{const x=[...seoRows];x[i]={...x[i],clicks:Number(e.target.value)};setSeoRows(x);}} className="w-full px-2 py-1.5 bg-[#f8fafc] border border-border rounded-lg text-xs text-right outline-none" /></td>
                      <td className="px-4 py-2.5"><button onClick={()=>setSeoRows(seoRows.filter((_,j)=>j!==i))} className="p-1 rounded hover:bg-red-50 text-red-400">✕</button></td>
                    </tr>
                  ))}
                  {/* Total row */}
                  {seoRows.length>0&&<tr className="bg-gray-50/70 border-t-2 border-border font-medium">
                    <td className="px-4 py-3 text-xs font-bold" colSpan={2}>Tổng cộng</td>
                    <td className="px-4 py-3 text-xs font-bold text-[#4f46e5] text-right">{seoRows.reduce((s:number,r:any)=>s+Number(r.orders||0),0).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 text-xs font-bold text-right">{seoRows.reduce((s:number,r:any)=>s+Number(r.revenue||0),0).toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-3 text-xs font-bold text-right">{seoRows.reduce((s:number,r:any)=>s+Number(r.cost||0),0).toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-3 text-xs font-bold text-right">{seoRows.reduce((s:number,r:any)=>s+Number(r.impressions||0),0).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 text-xs font-bold text-right">{seoRows.reduce((s:number,r:any)=>s+Number(r.clicks||0),0).toLocaleString('vi-VN')}</td>
                    <td></td>
                  </tr>}
                  {/* Add row */}
                  <tr className="border-t-2 border-dashed border-border/50">
                    <td colSpan={8} className="px-4 py-3">
                      <button onClick={()=>setSeoRows([...seoRows,{date:seoGroupBy==='day'?(seoDateFrom||new Date().toISOString().slice(0,10)):new Date().toISOString().slice(0,10),channel:'',orders:0,revenue:0,cost:0,impressions:0,clicks:0}])} className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted hover:text-[#4f46e5] transition-all">
                        <span className="w-5 h-5 rounded-full border-2 border-dashed border-current grid place-items-center text-[10px]">+</span> Thêm dòng</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-muted">{seoRows.length} dòng</span>
              <button onClick={async()=>{
                if(!seoRows.some(r=>r.channel)){alert('Nhập kênh trước');return;}
                setSeoSaving(true);
                try{
                  const u=JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
                  await api('/seo-revenue/'+(u.id||'all'),{method:'POST',body:JSON.stringify({rows:seoRows,month:seoMonth})});
                  showToast('success','Đã lưu');
                }catch(e:any){showToast('error',e.message);}setSeoSaving(false);
              }} disabled={seoSaving} className="px-5 py-2 bg-[#4f46e5] text-white text-sm font-medium rounded-xl hover:shadow-md transition-all disabled:opacity-40">
                {seoSaving?'Đang lưu...':'Lưu dữ liệu'}
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === 'social' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" value={month} onChange={e => { setMonth(e.target.value); load(e.target.value); }} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none">
              <option value="">Nhân sự</option>
              {members.map((m:any)=><option key={m.id} value={m.id}>{m.userName||m.name}</option>)}
            </select>
            <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none">
              <option value="">Nền tảng</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none">
              <option value="">Trạng thái</option>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:bg-[#4338ca] transition-all"><Plus size={16} />Thêm</button>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed" style={{borderCollapse:'separate', borderSpacing:0}}>
                <colgroup>
                  <col style={{width:100}} /><col style={{width:150}} /><col style={{width:100}} /><col style={{width:160}} /><col style={{width:200}} /><col style={{width:100}} /><col style={{width:100}} /><col style={{width:160}} /><col style={{width:30}} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Ngày</th>
                    <th className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Nhân sự</th>
                    <th className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Nền tảng</th>
                    <th className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Tiêu đề</th>
                    <th className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Tóm tắt</th>
                    <th className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Trạng thái</th>
                    <th className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Ngày đăng</th>
                    <th className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Link</th>
                    <th className="px-2 py-1.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredRows.length===0 && (
                    <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-muted">
                      <div className="flex flex-col items-center gap-2"><List size={32} className="opacity-20" /><p>Chưa có nội dung</p></div>
                    </td></tr>
                  )}
                  {filteredRows.map((r:any) => (
                    <tr key={r.id} className={'hover:bg-gray-50/60 transition-all ' + (saving.has(r.id) ? 'opacity-50' : '')}>
                      <td className="px-2 py-1 text-xs">{(r.date||'').split('T')[0]}</td>
                      <td className="px-2 py-1 text-xs">
                        <select value={r.assignee||''} onChange={e => saveField(r.id,'assignee',e.target.value)} className="w-full bg-transparent text-xs outline-none border-0 cursor-pointer">
                          <option value="">—</option>
                          {members.map((m:any)=><option key={m.id} value={m.id}>{m.userName||m.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 text-xs">
                        <select value={r.platform||''} onChange={e => saveField(r.id,'platform',e.target.value)} className="w-full bg-transparent text-xs outline-none border-0 cursor-pointer">
                          <option value="">—</option>
                          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 text-xs">
                        <input type="text" value={r.title||''} onBlur={e => saveField(r.id,'title',e.target.value)} onChange={e => setRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,title:e.target.value}:x))} placeholder="Tiêu đề..." className="w-full bg-transparent text-xs outline-none border-0" />
                      </td>
                      <td className="px-2 py-1 text-xs">
                        <span onClick={() => setWordEditor({id:r.id,title:r.title||'',summary:r.summary||''})} className="block truncate cursor-pointer hover:text-[#4f46e5]" title="Click để soạn nội dung">
                          {r.summary ? <span>{r.summary.slice(0,60)}{r.summary.length>60?'...':''}</span> : <span className="italic text-muted">Soạn nội dung</span>}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-xs">
                        <select value={r.status||'idea'} onChange={e => saveField(r.id,'status',e.target.value)} className="text-xs outline-none border-0 rounded-md px-1.5 py-0.5 font-medium cursor-pointer"
                          style={{backgroundColor:(STATUSES.find((s:any)=>s.key===(r.status||'idea'))?.color||'#6b7280')+'20', color:STATUSES.find((s:any)=>s.key===(r.status||'idea'))?.color||'#6b7280'}}>
                          {STATUSES.map((s:any) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 text-xs">
                        <input type="date" value={(r.publish_date||'').split('T')[0]} onBlur={e => saveField(r.id,'publishDate',e.target.value)} onChange={e => setRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,publish_date:e.target.value}:x))} className="w-full bg-transparent text-xs outline-none border-0" />
                      </td>
                      <td className="px-2 py-1 text-xs">
                        <input type="text" value={r.post_link||''} onBlur={e => saveField(r.id,'postLink',e.target.value)} onChange={e => setRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,post_link:e.target.value}:x))} placeholder="https://..." className="w-full bg-transparent text-xs outline-none border-0 truncate" />
                      </td>
                      <td className="px-2 py-1 text-xs text-center">
                        <button onClick={() => deleteRow(r.id)} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all"><X size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {wordEditor && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setWordEditor(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-gray-50/80">
                  <h3 className="font-bold text-sm text-[#171717]">Soạn nội dung Content Social</h3>
                  <button onClick={async () => {
                    if (!wordEditor) return;
                    try {
                      await api('/social-content/'+wordEditor.id, {method:'PUT', body:JSON.stringify({title:wordEditor.title, summary:wordEditor.summary})});
                      setRows((prev:any[])=>prev.map((r:any)=>r.id===wordEditor.id?{...r,title:wordEditor.title,summary:wordEditor.summary}:r));
                      setWordEditor(null); showToast('success','✓ Đã lưu');
                    } catch { showToast('error','✗ Lỗi lưu'); }
                  }} className="flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white font-semibold rounded-xl text-sm hover:bg-[#4338ca] transition-all"><Save size={16} />Lưu & Đóng</button>
                </div>
                <div className="flex-1 overflow-auto p-8 bg-[#fafafa]">
                  <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-border p-8 min-h-[500px] space-y-4">
                    <input value={wordEditor.title} onChange={e => setWordEditor({...wordEditor, title: e.target.value})} placeholder="Tiêu đề bài viết..." className="w-full text-xl font-bold text-[#171717] border-0 outline-none placeholder-muted/40 bg-transparent" />
                    <textarea value={wordEditor.summary} onChange={e => setWordEditor({...wordEditor, summary: e.target.value})} placeholder="Viết nội dung chi tiết tại đây..." className="w-full min-h-[400px] resize-none bg-transparent border-0 text-sm text-[#171717] leading-7 outline-none placeholder-muted/40" />
                  </div>
                </div>
                <div className="px-6 py-2.5 bg-gray-50/80 border-t border-border flex items-center gap-4 text-xs text-muted">
                  <span><span className="font-medium">Dòng đầu</span> hiển thị tóm tắt trên bảng</span>
                  <span className="w-px h-3 bg-border/60" />
                  <span>{(wordEditor.summary||'').length} ký tự</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}