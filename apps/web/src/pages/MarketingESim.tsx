import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart3, MessageSquare, Megaphone, Plus, X, Save, Check, AlertCircle, List, DollarSign, Eye, MousePointerClick, TrendingUp, Percent, Receipt } from 'lucide-react';
import { api } from '../lib/api';

const TABS = [
  { key: 'thongke', label: 'Thống kê', icon: BarChart3 },
  { key: 'social', label: 'Content Social', icon: MessageSquare },
  { key: 'quangcao', label: 'Quảng cáo', icon: Megaphone },
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
  const [adGroupBy, setAdGroupBy] = useState('month');
  const [adFilterPlatform, setAdFilterPlatform] = useState('');
  const [adFilterUser, setAdFilterUser] = useState('');
  const [adSaving, setAdSaving] = useState<Set<string>>(new Set());

  const showToast = (type:string, msg:string) => { setToast({type,msg}); setTimeout(()=>setToast(null),2000); };

  const load = useCallback(async (m?:string) => {
    try {
      const [data, mems] = await Promise.all([
        api('/social-content?month='+(m||month)),
        api('/users')
      ]);
      setRows(data||[]); setMembers(mems||[]);
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
      const u = (JSON.parse(localStorage.getItem('zeyfi_user')||'{}'));
      const res = await api('/ads', {method:'POST', body:JSON.stringify({date:new Date().toISOString().slice(0,10), platform:'facebook_ads', userId:u.id||''})});
      if (res?.id) { loadAds(); showToast('success','✓ Đã thêm'); }
    } catch { showToast('error','✗ Lỗi'); }
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

      {tab === 'thongke' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <BarChart3 size={48} className="text-muted opacity-30" />
            <h2 className="text-lg font-semibold text-[#171717]">Thống kê</h2>
            <p className="text-sm text-muted max-w-md">Đang thiết kế</p>
          </div>
        </div>
      )}

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
              {members.map((m:any) => <option key={m.id} value={m.id}>{m.name}</option>)}
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
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Ngày</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-left">Nền tảng</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">CP(có)</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">CP(chưa)</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">D.thu</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">Đơn</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">SIM</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">Impr</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">Click</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">CTR</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">CP/Đ</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">ROAS</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">CP/DT</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">CPC</th>
                    <th className="px-1 py-1.5 text-[11px] font-semibold text-muted uppercase text-right">Thuế</th>
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
                    const isGrouped = adGroupBy!=='day' || !r.id;
                    return (
                      <tr key={r.id||idx} className={'hover:bg-gray-50/60 transition-all ' + (adSaving.has(r.id) ? 'opacity-50' : '')}>
                        <td className="px-1 py-0.5 text-xs text-muted">{adGroupBy==='day' ? (r.dateStr||(r.date||'').split('T')[0]||r.periodLabel||'') : r.periodLabel||''}</td>
                        <td className="px-1 py-0.5 text-xs">{r.platform==='google_ads'?'Google':r.platform==='facebook_ads'?'Facebook':r.platform==='tiktok_ads'?'Tiktok':r.platform||'-'}</td>
                        <td className="px-1 py-0.5 text-xs text-right">
                          {isGrouped ? <span className="text-muted">{Math.round(Number(r.cost_with_tax||0)).toLocaleString('vi-VN')}</span> :
                            <input type="number" value={r.cost_with_tax||0}
                              onBlur={e => saveAdField(r.id,'cost_with_tax',Number(e.target.value))}
                              onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,cost_with_tax:Number(e.target.value)}:x))}
                              className="w-full bg-transparent text-xs text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-xs text-right text-muted">{Math.round(costEx).toLocaleString('vi-VN')}</td>
                        <td className="px-1 py-0.5 text-xs text-right">
                          {isGrouped ? <span className="text-muted">{Math.round(Number(r.revenue||0)).toLocaleString('vi-VN')}</span> :
                            <input type="number" value={r.revenue||0}
                              onBlur={e => saveAdField(r.id,'revenue',Number(e.target.value))}
                              onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,revenue:Number(e.target.value)}:x))}
                              className="w-full bg-transparent text-xs text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-xs text-right">{isGrouped ? <span className="text-muted">{Number(r.orders||0)}</span> :
                          <input type="number" value={r.orders||0}
                            onBlur={e => saveAdField(r.id,'orders',Number(e.target.value))}
                            onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,orders:Number(e.target.value)}:x))}
                            className="w-full bg-transparent text-xs text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-xs text-right">{isGrouped ? <span className="text-muted">{Number(r.sims||0)}</span> :
                          <input type="number" value={r.sims||0}
                            onBlur={e => saveAdField(r.id,'sims',Number(e.target.value))}
                            onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,sims:Number(e.target.value)}:x))}
                            className="w-full bg-transparent text-xs text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-xs text-right">{isGrouped ? <span className="text-muted">{Math.round(Number(r.impressions||0)).toLocaleString('vi-VN')}</span> :
                          <input type="number" value={r.impressions||0}
                            onBlur={e => saveAdField(r.id,'impressions',Number(e.target.value))}
                            onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,impressions:Number(e.target.value)}:x))}
                            className="w-full bg-transparent text-xs text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-xs text-right">{isGrouped ? <span className="text-muted">{Math.round(Number(r.clicks||0)).toLocaleString('vi-VN')}</span> :
                          <input type="number" value={r.clicks||0}
                            onBlur={e => saveAdField(r.id,'clicks',Number(e.target.value))}
                            onChange={e => setAdRows((prev:any[])=>prev.map((x:any)=>x.id===r.id?{...x,clicks:Number(e.target.value)}:x))}
                            className="w-full bg-transparent text-xs text-right outline-none border-0" />}
                        </td>
                        <td className="px-1 py-0.5 text-xs text-right text-muted">{ctr.toFixed(1)}</td>
                        <td className="px-1 py-0.5 text-xs text-right text-muted">{cpOrder>0 ? Math.round(cpOrder).toLocaleString('vi-VN') : '—'}</td>
                        <td className="px-1 py-0.5 text-xs text-right font-medium text-[#4f46e5]">{roas.toFixed(1)}x</td>
                        <td className="px-1 py-0.5 text-xs text-right text-muted">{cpDt.toFixed(1)}</td>
                        <td className="px-1 py-0.5 text-xs text-right text-muted">{cpc>0 ? Math.round(cpc).toLocaleString('vi-VN') : '—'}</td>
                        <td className="px-1 py-0.5 text-xs text-right text-red-500 font-medium">{Math.round(tax).toLocaleString('vi-VN')}</td>
                        <td className="px-1 py-0.5 text-xs text-center">
                          {!isGrouped && <button onClick={() => { if(confirm('Xoá?')){api('/ads/'+r.id,{method:'DELETE'}).then(()=>loadAds()).catch(()=>{});}}} className="p-0.5 rounded hover:bg-red-50 text-muted hover:text-red-500"><X size={10} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-dashed border-border/50">
                    <td colSpan={16} className="px-2 py-2 text-xs text-center">
                      <button onClick={async () => {
                        try {
                          const res = await fetch('/api/ads', {method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('zeyfi_token')||'')}, body:JSON.stringify({date:new Date().toISOString().slice(0,10), platform:'facebook_ads'})});
                          const data = await res.json();
                          if (data?.id) { window.location.reload(); }
                        } catch(e) { alert('Loi: '+e.message); }
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
      {tab === 'social' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" value={month} onChange={e => { setMonth(e.target.value); load(e.target.value); }} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none">
              <option value="">Nhân sự</option>
              {members.map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}
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
                          {members.map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}
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