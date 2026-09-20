import { useState, useEffect, useCallback } from 'react';
import { FileText, Send, Calendar, ChevronDown, Paperclip, X, CheckCircle2, Clock, Users, BarChart3, TrendingUp, MessageSquare, Download, Eye, Inbox, UserCheck, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { getSocket } from '../lib/socket';

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState('');
  const [reason, setReason] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [extraTasks, setExtraTasks] = useState<string[]>(['']);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>({});
  const [teamId, setTeamId] = useState('');
  const [metrics, setMetrics] = useState<any>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [receivedReports, setReceivedReports] = useState<any[]>([]);
  const [detailReport, setDetailReport] = useState<any>(null);
  const userRole = user.role;
//  const allUsersList = allUsers; // for recipient name lookup
  const getUserName = (id:string) => { const u = allUsers.find(u2 => u2.id === id); return u ? (u.name || u.email) : id.slice(0,8); };
  const nav = useNavigate();
  const { tab: urlTab } = useParams();
  const [tab, setTab] = useState<string>(urlTab || 'create');
  // Sync URL with tab state
  useEffect(() => { if (urlTab && urlTab !== tab) setTab(urlTab); }, [urlTab]);

  const today = new Date().toISOString().slice(0, 10);

  const dateRange = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'week', label: '7 ngày' },
    { key: 'month', label: '30 ngày' },
  ];
  const [dateRangeKey, setDateRangeKey] = useState('week');

  const calcDate = (dr: string) => {
    const d = new Date();
    if (dr === 'today') return { from: d.toISOString().slice(0,10), to: d.toISOString().slice(0,10) };
    if (dr === 'week') { const w = new Date(); w.setDate(w.getDate()-7); return { from: w.toISOString().slice(0,10), to: d.toISOString().slice(0,10) }; }
    return { from: new Date(Date.now()-30*86400000).toISOString().slice(0,10), to: d.toISOString().slice(0,10) };
  };

  const loadMetrics = useCallback(async () => {
    try {
      const u = JSON.parse(localStorage.getItem('zeyfi_user') || '{}');
      setUser(u);
      setTeamId(u.teamId || '');

      const { from, to } = calcDate(dateRangeKey);

      // Fetch metrics from all modules
      // Load users list for recipient selection
    const users = await api("/users").catch(() => []);
    setAllUsers(users || []);
    // Auto-select admin/manager as default recipients
    const adminIds = (users || []).filter((u:any) => u.role === 'admin' || u.role === 'manager').map((u:any) => u.id);
    setRecipients(prev => prev.length > 0 ? prev : adminIds);
    // First, find which team the user belongs to
      let userTeamId = u.teamId || '';
      let userTeamName = '';
      if (!userTeamId && u.id) {
        const allTeams = await api('/teams').catch(() => []);
        for (const team of (allTeams || [])) {
          const members = await api('/teams/' + team.id + '/members').catch(() => []);
          if (Array.isArray(members) && members.some((m:any) => m.id === u.id)) {
            userTeamId = team.id;
            userTeamName = (team.name || team.slug || '').toLowerCase();
            break;
          }
        }
      }
      // Check team type: Kinh doanh 3M uses B3 (daily-perf) for primary data; others use B2
      const is3M = userTeamName.includes('3m') || userTeamName.includes('kinh doanh') || userTeamName.includes('đức việt');
      
      // Fetch all data sources in parallel
      const [b3Data, seoData, b2Data, adsData, socialData] = await Promise.all([
        // B3: dành cho team 3M (daily-perf)
        userTeamId && u.id ? api('/daily-perf/' + userTeamId + '/' + u.id + '?month=' + reportDate.slice(0,7)).catch(() => []) : Promise.resolve([]),
        // SEO: tất cả team
        api('/seo-revenue/' + (u.id || 'all') + '?dateFrom=' + from + '&dateTo=' + to).catch(() => []),
        // B2 (actuals): tất cả team
        userTeamId ? api('/actuals/' + userTeamId + '?month=' + reportDate.slice(0,7) + '&groupBy=day&dateFrom=' + reportDate + '&dateTo=' + reportDate).catch(() => []) : Promise.resolve([]),
        // Ads: tất cả team
        api('/ads?month=' + reportDate.slice(0,7) + '&groupBy=day&dateFrom=' + reportDate + '&dateTo=' + reportDate + (u.id ? '&userId=' + u.id : '')).catch(() => []),
        // Social: tất cả team
        api('/social-content?month=' + reportDate.slice(0,7) + (u.id ? '&assignee=' + u.id : '')).catch(() => []),
      ]);
      
      // Calculate metrics: 3M team lấy orders/cost từ B3; các team khác từ B2
      const todayOrders = is3M && b3Data.length > 0
        ? b3Data.reduce((s:number, r:any) => s + Number(r.orders||0), 0)
        : b2Data.reduce((s:number, r:any) => s + Number(r.actualOrders||0), 0);
      const todayCost = is3M && b3Data.length > 0
        ? b3Data.reduce((s:number, r:any) => s + Number(r.total_cost||0), 0)
        : b2Data.reduce((s:number, r:any) => s + Number(r.fixedCost||0), 0);
      const adsTotal = adsData.reduce((s:number, r:any) => s + Number(r.cost_with_tax||0), 0);
      const adsRevenue = adsData.reduce((s:number, r:any) => s + Number(r.revenue||0), 0);
      const adsOrders = adsData.reduce((s:number, r:any) => s + Number(r.orders||0), 0);
      const seoOrders = Array.isArray(seoData) ? seoData.reduce((s:number, r:any) => s + Number(r.orders||0), 0) : 0;
      const seoRevenue = Array.isArray(seoData) ? seoData.reduce((s:number, r:any) => s + Number(r.revenue||0), 0) : 0;
      const socialPosts = socialData.length;
      const publishedPosts = socialData.filter((r:any) => r.status === 'published').length;
      
      // B3 additional metrics (reach, clicks, messages)
      const b3Reach = is3M ? b3Data.reduce((s:number, r:any) => s + Number(r.reach||0), 0) : 0;
      const b3Clicks = is3M ? b3Data.reduce((s:number, r:any) => s + Number(r.clicks||0), 0) : 0;
      const b3Messages = is3M ? b3Data.reduce((s:number, r:any) => s + Number(r.messages||0), 0) : 0;
      
      setMetrics({
        todayOrders, todayCost,
        adsTotal, adsRevenue, adsOrders,
        seoOrders, seoRevenue,
        socialPosts, publishedPosts,
        b3Reach, b3Clicks, b3Messages,
        is3M,
        totalTeams: 0,
        roas: adsTotal > 0 ? (adsRevenue / adsTotal).toFixed(1) : '—',
        cpOrder: adsOrders > 0 ? Math.round(adsTotal / adsOrders).toLocaleString('vi-VN') : '—',
      });

      setMetrics({
        todayOrders, todayCost,
        adsTotal, adsRevenue, adsOrders,
        seoOrders, seoRevenue,
        socialPosts, publishedPosts,
        totalTeams: 0,
        roas: adsTotal > 0 ? (adsRevenue / adsTotal).toFixed(1) : '—',
        cpOrder: adsOrders > 0 ? Math.round(adsTotal / adsOrders).toLocaleString('vi-VN') : '—',
      });
    } catch {}
  }, [reportDate, dateRangeKey]);

  const loadReports = useCallback(async () => {
    try {
      const data = await api('/reports');
      setReports(data || []);
    } catch {}
  }, []);

  useEffect(() => { loadMetrics(); loadReports(); }, [loadMetrics, loadReports]);
  useEffect(() => {
    if (tab !== 'received' || !user.id) return;
    const loadReceived = async () => {
      try {
        const r = await api('/reports/received?userId=' + user.id);
        setReceivedReports(r || []);
      } catch { setReceivedReports([]); }
    };
    loadReceived();
  }, [tab, user.id]);


  // Realtime
  useEffect(() => {
    const sock = getSocket();
    const handler = () => loadReports();
    sock.on('report:new', handler);
    sock.on('report:deleted', handler);
    return () => { sock.off('report:new', handler); sock.off('report:deleted', handler); };
  }, [loadReports]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const r = await api('/drive/upload', { method:'POST', body:JSON.stringify({
          name: file.name, mimeType: file.type, size: file.size, data: base64, parentId: null
        })});
        if (r?.url) {
          setAttachments(prev => [...prev, r.url]);
        }
      };
      reader.readAsDataURL(file);
    } catch {}
  };

  const submitReport = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await api('/reports', { method:'POST', body:JSON.stringify({
        date: reportDate,
        data: JSON.stringify({
          content: content.trim(),
          recipients: recipients,
          reason: reason.trim(),
          difficulties: difficulties.trim(),
          suggestions: suggestions.trim(),
          extraTasks: extraTasks.filter(t => t.trim()),
          metrics: metrics,
          attachments: attachments,
          teamId: teamId,
        })
      })});
      setContent('');
      setAttachments([]);
      setConfirming(false);
      await loadReports();
    } catch {}
    setSending(false);
  };

  const filteredReports = reports.filter((r: any) => {
    const { from, to } = calcDate(dateRangeKey);
    const d = r.date || '';
    return d >= from && d <= to;
  }).sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] flex items-center gap-2">
            <FileText size={22} className="text-[#4f46e5]" /> Báo cáo hàng ngày
          </h1>
          <p className="text-sm text-muted mt-1">Nhân sự báo cáo công việc hàng ngày, đính kèm số liệu từ các module</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-border p-1 w-fit">
        {[
          { key: 'create', label: 'Tạo báo cáo', icon: FileText },
          { key: 'history', label: 'Lịch sử', icon: Clock },
        (user.role === 'admin' || user.role === 'manager') && { key: 'received', label: 'Đã nhận', icon: Inbox },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); nav('/crm/reports/' + t.key); }}
            className={'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ' + (tab === t.key as any ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-muted hover:text-ink hover:bg-gray-50')}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-gray-50/60 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#171717]">Nội dung báo cáo</h2>
                <div className="relative">
                  <button onClick={() => setShowCalendar(!showCalendar)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-medium hover:bg-gray-50 transition-all">
                    <Calendar size={13} /> {reportDate}
                    <ChevronDown size={12} />
                  </button>
                  {showCalendar && (
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-border shadow-xl p-3">
                      <input type="date" value={reportDate} onChange={e => { setReportDate(e.target.value); setShowCalendar(false); }}
                        className="px-3 py-2 border border-border rounded-lg text-xs outline-none" />
                      <button onClick={() => { setReportDate(today); setShowCalendar(false); }}
                        className="mt-2 w-full px-3 py-1.5 bg-gray-50 rounded-lg text-xs text-muted hover:text-ink transition-all">Hôm nay</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5">
                <textarea value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Mô tả chi tiết công việc hôm nay của bạn..."
                  className="w-full h-32 px-4 py-3 bg-[#f8fafc] border border-border rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-all" />
                
                {/* Additional fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Lý do</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="lý do thực hiện công việc..."
                      className="w-full h-20 px-3 py-2 bg-[#f8fafc] border border-border rounded-xl text-xs outline-none resize-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Khó khăn</label>
                    <textarea value={difficulties} onChange={e => setDifficulties(e.target.value)} placeholder="Khó khăn gặp phải..."
                      className="w-full h-20 px-3 py-2 bg-[#f8fafc] border border-border rounded-xl text-xs outline-none resize-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Đề xuất</label>
                    <textarea value={suggestions} onChange={e => setSuggestions(e.target.value)} placeholder="Đề xuất cải thiện..."
                      className="w-full h-20 px-3 py-2 bg-[#f8fafc] border border-border rounded-xl text-xs outline-none resize-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-all" />
                  </div>
                </div>

                {/* Extra tasks */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted mb-2">Công việc liên quan khác</label>
                  <div className="space-y-2">
                    {extraTasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="text" value={task} onChange={e => {
                          const t = [...extraTasks]; t[i] = e.target.value; setExtraTasks(t);
                        }} placeholder="Nhập công việc..."
                          className="flex-1 px-3 py-2 bg-[#f8fafc] border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-all" />
                        <button onClick={() => setExtraTasks(extraTasks.filter((_, j) => j !== i))}
                          className="p-1 rounded hover:bg-red-50 text-red-400 transition-all"><X size={14} /></button>
                      </div>
                    ))}
                    <button onClick={() => setExtraTasks([...extraTasks, ""])}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-[#4f46e5] transition-all">
                      <span className="w-4 h-4 rounded-full border-2 border-dashed border-current grid place-items-center text-[8px]">+</span>
                      Thêm công việc</button>
                  </div>
                </div>

                {/* Recipient selection */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted mb-2">Gửi báo cáo đến</label>
                  <div className="flex flex-wrap gap-2">
                    {allUsers.filter((u:any) => u.id !== user.id).map((u:any) => {
                      const selected = recipients.includes(u.id);
                      return (
                        <button key={u.id} onClick={() => {
                          if (selected) setRecipients(prev => prev.filter(id => id !== u.id));
                          else setRecipients(prev => [...prev, u.id]);
                        }}
                          className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-all " + (selected ? "bg-[#4f46e5] text-white border-[#4f46e5]" : "bg-white text-muted border-border hover:border-[#4f46e5]/40")}>
                          {selected && "✓ "}{u.name || u.email}
                        </button>
                      );
                    })}
                    {allUsers.filter((u:any) => u.id !== user.id).length === 0 && <span className="text-xs text-muted">Không có nhân sự khác</span>}
                  </div>
                </div>

                {/* Attachments */}
                <div className="mt-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-[#4f46e5]/40 transition-all text-sm text-muted hover:text-ink">
                    <Paperclip size={15} />
                    <span>Đính kèm file (hình ảnh, tài liệu...)</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((url, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-border rounded-lg text-xs">
                          <FileText size={12} className="text-muted" />
                          <span className="text-muted truncate max-w-[150px]">{url.split('/').pop()}</span>
                          <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setContent(''); setAttachments([]); setConfirming(false); }}
                className="px-5 py-2.5 bg-gray-100 text-muted rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">Huỷ</button>
              <button onClick={() => {
                if (!confirming) { setConfirming(true); return; }
                submitReport();
              }} disabled={!content.trim() || sending}
                className="px-6 py-2.5 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-40 flex items-center gap-2">
                {sending ? 'Đang gửi...' : confirming ? 'Xác nhận gửi?' : <><Send size={14} /> Gửi báo cáo</>}
              </button>
            </div>
          </div>

          {/* Metrics sidebar */}
          <div className="space-y-4">
            {/* B2 / Actuals */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center gap-2">
                <BarChart3 size={14} className="text-[#4f46e5]" />
                <h3 className="text-xs font-semibold text-[#171717]">Kết quả kinh doanh</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Đơn hàng (B2)</span>
                  <span className="text-sm font-bold">{metrics.todayOrders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Chi phí thực tế</span>
                  <span className="text-sm font-bold">{metrics.todayCost ? Number(metrics.todayCost).toLocaleString('vi-VN') + 'đ' : '0đ'}</span>
                </div>
              </div>
            </div>

            {/* Ads */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center gap-2">
                <TrendingUp size={14} className="text-amber-600" />
                <h3 className="text-xs font-semibold text-[#171717]">Quảng cáo</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center"><span className="text-xs text-muted">CP có thuế</span><span className="text-sm font-bold">{metrics.adsTotal ? Number(metrics.adsTotal).toLocaleString('vi-VN') + 'đ' : '0đ'}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-muted">Doanh thu</span><span className="text-sm font-bold">{metrics.adsRevenue ? Number(metrics.adsRevenue).toLocaleString('vi-VN') + 'đ' : '0đ'}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-muted">Đơn</span><span className="text-sm font-bold">{metrics.adsOrders || 0}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-muted">ROAS</span><span className="text-sm font-bold text-[#4f46e5]">{metrics.roas || '—'}x</span></div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center gap-2">
                <TrendingUp size={14} className="text-green-600" />
                <h3 className="text-xs font-semibold text-[#171717]">Doanh thu SEO</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center"><span className="text-xs text-muted">Đơn</span><span className="text-sm font-bold">{metrics.seoOrders || 0}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-muted">Doanh thu</span><span className="text-sm font-bold">{metrics.seoRevenue ? Number(metrics.seoRevenue).toLocaleString('vi-VN') + 'đ' : '0đ'}</span></div>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center gap-2">
                <MessageSquare size={14} className="text-purple-600" />
                <h3 className="text-xs font-semibold text-[#171717]">Content Social</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center"><span className="text-xs text-muted">Bài viết</span><span className="text-sm font-bold">{metrics.socialPosts || 0}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-muted">Đã đăng</span><span className="text-sm font-bold text-green-600">{metrics.publishedPosts || 0}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gray-50/60 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#171717]">Lịch sử báo cáo ({filteredReports.length})</h2>
            <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-0.5">
              {dateRange.map(dr => (
                <button key={dr.key} onClick={() => setDateRangeKey(dr.key)}
                  className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' + (dateRangeKey === dr.key ? 'bg-[#4f46e5] text-white' : 'text-muted hover:text-ink')}>
                  {dr.label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border/50">
            {filteredReports.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted">Chưa có báo cáo</div>
            ) : filteredReports.map((r: any) => {
              const d = (() => { try { return JSON.parse(r.data || '{}'); } catch { return {}; } })();
              return (
                <div key={r.id} className="px-5 py-4 hover:bg-gray-50/60 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-md">{r.date}</span>
                        <span className="text-xs text-muted">{r.user_name || user.name || 'Nhân sự'}</span>
                      </div>
                      <p className="text-sm text-[#171717]">{d.content || '—'}</p>
                      {d.recipients && d.recipients.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {d.recipients.map((rid: string, ri: number) => {
                            const ru = allUsers.find((u:any) => u.id === rid);
                            return <span key={ri} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-medium">📨 {ru ? ru.name : rid.slice(0,8)}</span>;
                          })}
                        </div>
                      )}
                      {d.metrics && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {d.metrics.todayOrders > 0 && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-medium">📦 {d.metrics.todayOrders} đơn</span>}
                          {d.metrics.adsTotal > 0 && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-medium">📊 CP QC {Number(d.metrics.adsTotal).toLocaleString('vi-VN')}đ</span>}
                          {d.metrics.seoOrders > 0 && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[10px] font-medium">🔍 SEO {d.metrics.seoOrders} đơn</span>}
                          {d.metrics.publishedPosts > 0 && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[10px] font-medium">📝 {d.metrics.publishedPosts} bài</span>}
                        </div>
                      )}
                      {d.attachments && d.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {d.attachments.map((url: string, i: number) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-border rounded-md text-[10px] text-muted hover:text-[#4f46e5] transition-all">
                              <Download size={10} /> File {i+1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted shrink-0">{new Date(r.created_at).toLocaleString('vi-VN', {hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}