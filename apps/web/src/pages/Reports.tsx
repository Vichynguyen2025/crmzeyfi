import { useState, useEffect, useCallback } from 'react';
import { FileText, Send, Calendar, ChevronDown, Paperclip, X, CheckCircle2, Clock, Users, BarChart3, TrendingUp, MessageSquare, Download, Eye, Inbox, UserCheck, ChevronRight, Folder, Trash2 } from 'lucide-react';
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
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [historyDetail, setHistoryDetail] = useState<any>(null);
  const [reportComments, setReportComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');

  const addComment = async () => {
    if (!commentInput.trim() || !historyDetail) return;
    const text = commentInput;
    setCommentInput('');
    try {
      const r = await api('/reports/' + historyDetail.id + '/comments', { method:'POST', body:JSON.stringify({ content: text }) });
      if (r?.success) {
        const u = JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
        setReportComments(prev => [...prev, { id: r.id, user_id: u.id, userName: u.name, content: text, created_at: new Date().toISOString() }]);
      }
    } catch { showToast('error', 'Lỗi gửi góp ý'); setCommentInput(text); }
  };
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveFolderId, setDriveFolderId] = useState<string|null>(null);
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
  const formatDate = (d: string) => d ? (d.includes('T') ? new Date(d).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}) : d.includes('-') ? d.split('-').reverse().join('/') : d) : '';
  const formatTime = (d: string) => d ? new Date(d).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'}) : '';
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
  const [reportDateFrom, setReportDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10); });
  const [reportDateTo, setReportDateTo] = useState(() => new Date().toISOString().slice(0,10));
  const [recvDateFrom, setRecvDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10); });
  const [recvDateTo, setRecvDateTo] = useState(() => new Date().toISOString().slice(0,10));
  const [receivedDateRangeKey, setReceivedDateRangeKey] = useState('week');

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
    // Không tự tích chọn — nhân sự tự chọn người nhận
    const adminIds = (users || []).filter((u:any) => u.role === 'admin' || u.role === 'manager').map((u:any) => u.id);
    setRecipients([]);
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
        userTeamId && u.id ? api('/daily-perf/' + userTeamId + '/' + u.id + '?month=' + reportDate.slice(0,7) + '&dateFrom=' + from + '&dateTo=' + to).catch(() => []) : Promise.resolve([]),
        // SEO: tất cả team
        api('/seo-revenue/' + (u.id || 'all') + '?dateFrom=' + from + '&dateTo=' + to).catch(() => []),
        // B2 (actuals): tất cả team
        userTeamId ? api('/actuals/' + userTeamId + '?month=' + reportDate.slice(0,7) + '&groupBy=day&dateFrom=' + reportDate + '&dateTo=' + reportDate + '&userId=' + (u.id || '')).catch(() => []) : Promise.resolve([]),
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
      const b3TotalCost = b3Data.reduce((s:number, r:any) => s + Number(r.total_cost||0), 0);
      const b3Reach = is3M ? b3Data.reduce((s:number, r:any) => s + Number(r.reach||0), 0) : 0;
      const b3Clicks = is3M ? b3Data.reduce((s:number, r:any) => s + Number(r.clicks||0), 0) : 0;
      const b3Messages = is3M ? b3Data.reduce((s:number, r:any) => s + Number(r.messages||0), 0) : 0;
      const todayMessages = is3M ? b3Messages : b2Data.reduce((s:number, r:any) => s + Number(r.totalMessages||0), 0);
      const avgMessCost = todayMessages > 0 ? Math.round(todayCost / todayMessages) : 0;
      
      setMetrics({
        todayOrders, todayCost,
        adsTotal, adsRevenue, adsOrders,
        seoOrders, seoRevenue,
        socialPosts, publishedPosts,
        b3TotalCost, b3Reach, b3Clicks, b3Messages,
        todayMessages, avgMessCost,
        is3M,
        totalTeams: 0,
        roas: adsTotal > 0 ? (adsRevenue / adsTotal).toFixed(1) : '—',
        cpOrder: adsOrders > 0 ? Math.round(adsTotal / adsOrders).toLocaleString('vi-VN') : '—',
      });


    } catch {}
  }, [reportDate, dateRangeKey]);

  const loadReports = useCallback(async () => {
    try {
      const { from, to } = dateRangeKey === 'custom' ? { from: reportDateFrom, to: reportDateTo } : calcDate(dateRangeKey);
      const data = await api('/reports?from=' + from + '&to=' + to);
      setReports(data || []);
    } catch {}
  }, []);

  useEffect(() => { loadMetrics(); loadReports(); }, [loadMetrics, loadReports]);
  useEffect(() => {
    if (tab !== 'received' || !user.id) return;
    const loadReceived = async () => {
      try {
        const { from, to } = receivedDateRangeKey === 'custom' ? { from: recvDateFrom, to: recvDateTo } : calcDate(receivedDateRangeKey);
        const r = await api('/reports/received?userId=' + user.id + '&from=' + from + '&to=' + to);
        setReceivedReports(r || []);
      } catch { setReceivedReports([]); }
    };
    loadReceived();
  }, [tab, user.id, receivedDateRangeKey]);


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
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <FileText size={22} className="text-primary" /> Báo cáo hàng ngày
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
        ].filter(Boolean).map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); nav('/crm/reports/' + t.key); }}
            className={'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ' + (tab === t.key as any ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-ink hover:bg-gray-50')}>
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
                <h2 className="text-sm font-bold text-ink">Nội dung báo cáo</h2>
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
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-primary transition-all">
                      <span className="w-4 h-4 rounded-full border-2 border-dashed border-current grid place-items-center text-[8px]">+</span>
                      Thêm công việc</button>
                  </div>
                </div>

                {/* Recipient selection */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted mb-2">Gửi báo cáo đến (Admin/Manager)</label>
                  <div className="flex flex-wrap gap-2">
                    {allUsers.filter((u:any) => u.role === 'admin' || u.role === 'manager').map((u:any) => {
                      const selected = recipients.includes(u.id);
                      return (
                        <button key={u.id} onClick={() => {
                          if (selected) setRecipients(prev => prev.filter(id => id !== u.id));
                          else setRecipients(prev => [...prev, u.id]);
                        }}
                          className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-all " + (selected ? "bg-primary text-white border-[#4f46e5]" : "bg-white text-muted border-border hover:border-[#4f46e5]/40")}>
                          {selected && "✓ "}{u.name || u.email}
                        </button>
                      );
                    })}
                    {allUsers.filter((u:any) => u.role === 'admin' || u.role === 'manager').length === 0 && <span className="text-xs text-muted">Không có admin/manager</span>}
                  </div>
                </div>

                {/* Attachments */}
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-[#4f46e5]/40 transition-all text-sm text-muted hover:text-ink">
                    <Paperclip size={15} />
                    <span>Đính kèm file</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <button onClick={async () => { try { const files = await api('/drive'); setDriveFiles(files || []); setDriveFolderId(null); setDriveSearch(''); setShowDrivePicker(true); } catch { } }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted hover:text-ink hover:bg-[#fafafa] transition-all">
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    <span>Chọn từ Kho dữ liệu</span>
                  </button>
                </div>
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
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-40 flex items-center gap-2">
                {sending ? 'Đang gửi...' : confirming ? 'Xác nhận gửi?' : <><Send size={14} /> Gửi báo cáo</>}
              </button>
            </div>
          </div>

          {/* Metrics sidebar */}
          <div className="space-y-4">
            {/* B2 / Actuals */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center gap-2">
                <BarChart3 size={14} className="text-primary" />
                <h3 className="text-xs font-semibold text-ink">Kết quả kinh doanh</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Đơn hàng (B2)</span>
                  <span className="text-sm font-bold">{metrics.todayOrders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">CP QC 3M</span>
                  <span className="text-sm font-bold text-primary">{metrics.b3TotalCost ? Number(metrics.b3TotalCost).toLocaleString('vi-VN') + 'đ' : '0đ'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">CP QC eSim</span>
                  <span className="text-sm font-bold text-[#db2777]">{metrics.adsTotal ? Number(metrics.adsTotal).toLocaleString('vi-VN') + 'đ' : '0đ'}</span>
                </div>
                <div className="border-t border-border/50 pt-2 mt-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Tổng Mess</span>
                  <span className="text-sm font-bold">{metrics.todayMessages || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Giá Mess T.bình</span>
                  <span className="text-sm font-bold text-primary">{metrics.avgMessCost ? Number(metrics.avgMessCost).toLocaleString('vi-VN') + 'đ' : '0đ'}</span>
                </div>
              </div>
            </div>

            {/* Ads */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center gap-2">
                <TrendingUp size={14} className="text-amber-600" />
                <h3 className="text-xs font-semibold text-ink">Quảng cáo</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center"><span className="text-xs text-muted">CP có thuế</span><span className="text-sm font-bold">{metrics.adsTotal ? Number(metrics.adsTotal).toLocaleString('vi-VN') + 'đ' : '0đ'}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-muted">Doanh thu</span><span className="text-sm font-bold">{metrics.adsRevenue ? Number(metrics.adsRevenue).toLocaleString('vi-VN') + 'đ' : '0đ'}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-muted">Đơn</span><span className="text-sm font-bold">{metrics.adsOrders || 0}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-muted">ROAS</span><span className="text-sm font-bold text-primary">{metrics.roas || '—'}x</span></div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gray-50/60 flex items-center gap-2">
                <TrendingUp size={14} className="text-green-600" />
                <h3 className="text-xs font-semibold text-ink">Doanh thu SEO</h3>
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
                <h3 className="text-xs font-semibold text-ink">Content Social</h3>
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
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Lịch sử báo cáo <span className="text-sm font-normal text-muted">({filteredReports.length})</span></h2>
            <div style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px'}} className="flex items-center gap-1 bg-white rounded-lg p-0.5">
              {dateRange.map(dr => (
                <button key={dr.key} onClick={() => setReceivedDateRangeKey(dr.key)}
                  className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' + (receivedDateRangeKey === dr.key ? 'bg-[#171717] text-white' : 'text-muted hover:text-ink')}>
                  {dr.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px'}}>
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Ngày</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Người gửi</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Nội dung</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Chỉ số</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Tình trạng</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Người nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-[#666]">Chưa có báo cáo nào trong khoảng thời gian này</p>
                    </td>
                  </tr>
                ) : filteredReports.map((r: any) => {
                  const d = (() => { try { return JSON.parse(r.data || '{}'); } catch { return {}; } })();
                  const senderName = getUserName(r.user_id);
                  const fmtDate = formatDate(r.date);
                  const fmtTime = formatTime(r.created_at);
                  const recvs = (d.recipients || []).map((rid: string) => getUserName(rid)).join(', ');
                  return (
                    <tr key={r.id} onClick={async () => { setHistoryDetail(r); try { const c = await api('/reports/' + r.id + '/comments'); setReportComments(c || []); } catch { setReportComments([]); } }}
                      className="cursor-pointer transition-all duration-150 hover:bg-[#fafafa]">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-ink">{fmtDate}</p>
                        <p className="text-xs text-muted">{fmtTime}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">{senderName[0]}</div>
                          <p className="text-sm font-semibold text-ink">{senderName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#4d4d4d] leading-relaxed line-clamp-2 max-w-xs">{d.content || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {d.metrics?.todayOrders > 0 && <span className="inline-flex items-center px-2.5 py-1 bg-[#f0f4ff] text-[#0068d6] text-xs font-medium rounded-full">{d.metrics.todayOrders}</span>}
                          {d.metrics?.todayCost > 0 && <span className="inline-flex items-center px-2.5 py-1 bg-[#fffbeb] text-[#b8860b] text-xs font-medium rounded-full">{Number(d.metrics.todayCost).toLocaleString('vi-VN')}đ</span>}
                          {d.metrics?.adsTotal > 0 && <span className="inline-flex items-center px-2.5 py-1 bg-[#fdf2f8] text-[#db2777] text-xs font-medium rounded-full">{Number(d.metrics.adsTotal).toLocaleString('vi-VN')}đ</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className={'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full '+(r.status==='approved'?'bg-[#f0fdf4] text-[#16a34a]':r.status==='rejected'?'bg-[#fef2f2] text-[#dc2626]':'bg-[#fff7ed] text-[#ea580c]')}>{(r.status==='approved'?'✓ Duyệt':r.status==='rejected'?'✗ Từ chối':'● Chờ')}</span></td>
                      <td className="px-6 py-4 text-xs text-muted max-w-[120px] truncate" title={recvs}>{recvs || '—'}</td>
                      <td className="px-6 py-4">
                        <button onClick={e => { e.stopPropagation(); if (confirm('Xoá báo cáo này?')) api('/reports/' + r.id, { method:'DELETE' }).then(() => loadReports()).catch(() => {}); }} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xoá"><Trash2 size={14} /></button>
                      </td></tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}{tab === 'received' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Báo cáo đã nhận <span className="text-sm font-normal text-muted">({receivedReports.length})</span></h2>
            <div style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px'}} className="flex items-center gap-1 bg-white rounded-lg p-0.5">
              {[
                { key: 'today', label: 'Hôm nay' },
                { key: 'week', label: '7 ngày' },
                { key: 'month', label: '30 ngày' },
              ].map(dr => (
                <button key={dr.key} onClick={() => setReceivedDateRangeKey(dr.key)}
                  className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' + (receivedDateRangeKey === dr.key ? 'bg-[#171717] text-white' : 'text-muted hover:text-ink')}>
                  {dr.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px'}}>
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Người gửi</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Ngày</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Nội dung</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Chỉ số</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-[#fafafa]">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {receivedReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
                        <Inbox size={22} className="text-muted" />
                      </div>
                      <p className="text-sm font-medium text-[#666]">Chưa có báo cáo nào</p>
                      <p className="text-xs text-[#999] mt-1">Khi nhân sự gửi báo cáo, chúng sẽ xuất hiện ở đây</p>
                    </td>
                  </tr>
                ) : receivedReports.map((r: any, i: number) => {
                  const d = (() => { try { return JSON.parse(r.data || '{}'); } catch { return {}; } })();
                  const senderName = getUserName(r.user_id);
                  const fmtDate = formatDate(r.date);
                  const fmtTime = formatTime(r.created_at);
                  return (
                    <tr key={r.id} onClick={async () => { setHistoryDetail(r); try { const c = await api('/reports/' + r.id + '/comments'); setReportComments(c || []); } catch { setReportComments([]); } }}
                      className="cursor-pointer transition-all duration-150 hover:bg-[#fafafa]">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-ink">{senderName}</p>
                        <p className="text-xs text-muted mt-0.5">{fmtTime}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">{fmtDate}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#4d4d4d] leading-relaxed line-clamp-2 max-w-xs">{d.content || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {d.metrics?.todayOrders > 0 && <span className="inline-flex items-center px-2.5 py-1 bg-[#f0f4ff] text-[#0068d6] text-xs font-medium rounded-full">{d.metrics.todayOrders}</span>}
                          {d.metrics?.todayCost > 0 && <span className="inline-flex items-center px-2.5 py-1 bg-[#fffbeb] text-[#b8860b] text-xs font-medium rounded-full">{Number(d.metrics.todayCost).toLocaleString('vi-VN')}đ</span>}
                          {d.metrics?.adsTotal > 0 && <span className="inline-flex items-center px-2.5 py-1 bg-[#fdf2f8] text-[#db2777] text-xs font-medium rounded-full">{Number(d.metrics.adsTotal).toLocaleString('vi-VN')}đ</span>}
                          {d.metrics?.seoOrders > 0 && <span className="inline-flex items-center px-2.5 py-1 bg-[#f0fdf4] text-[#16a34a] text-xs font-medium rounded-full">{d.metrics.seoOrders}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4"><select value={r.status||'pending'} onChange={async e=>{const v=e.target.value;if(v==='approved'){await api('/reports/'+r.id+'/status',{method:'PATCH',body:JSON.stringify({status:'approved'})})}else if(v==='rejected'){const fb=prompt('Nhập lý do từ chối:');if(!fb)return;await api('/reports/'+r.id+'/status',{method:'PATCH',body:JSON.stringify({status:'rejected',feedback:fb})})}const u=JSON.parse(localStorage.getItem('zeyfi_user')||'{}');const dt=receivedDateRangeKey==='custom'?{from:recvDateFrom,to:recvDateTo}:calcDate(receivedDateRangeKey);const r2=await api('/reports/received?userId='+u.id+'&from='+dt.from+'&to='+dt.to);setReceivedReports(r2||[]);}} className={'px-2.5 py-1 text-xs font-medium rounded-full border-0 outline-none cursor-pointer '+(r.status==='approved'?'bg-[#f0fdf4] text-[#16a34a]':r.status==='rejected'?'bg-[#fef2f2] text-[#dc2626]':'bg-[#fff7ed] text-[#ea580c]')}><option value='pending'>● Chờ</option><option value='approved'>✓ Duyệt</option><option value='rejected'>✗ Từ chối</option></select></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
{detailReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailReport(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            style={{boxShadow:'rgba(0,0,0,0.12) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 12px, rgba(0,0,0,0.04) 0px 20px 40px -8px'}}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb] bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-sm font-bold">{getUserName(detailReport.user_id)[0]}</div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{getUserName(detailReport.user_id)}</h3>
                  <p className="text-xs text-muted">{formatDate(detailReport.date)} · {formatTime(detailReport.created_at)}</p>
                </div>
              </div>
              <button onClick={() => setDetailReport(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f5f5f5] transition-all"><X size={16} className="text-muted" /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {(() => {
                const dd = (() => { try { return JSON.parse(detailReport.data || '{}'); } catch { return {}; } })();
                return (
                  <>
                    {/* Nội dung c\u00f4ng vi\u1ec7c */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Nội dung</h4>
                      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{dd.content || '—'}</p>
                    </div>

                    {/* Lý do / Khó khăn / Đề xuất */}
                    <div className="grid grid-cols-3 gap-4">
                      {dd.reason && (
                        <div className="bg-[#fafafa] rounded-xl p-4" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                          <p className="text-xs font-semibold text-[#0068d6] mb-1">Lý do</p>
                          <p className="text-xs text-[#4d4d4d] leading-relaxed">{dd.reason}</p>
                        </div>
                      )}
                      {dd.difficulties && (
                        <div className="bg-[#fafafa] rounded-xl p-4" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                          <p className="text-xs font-semibold text-[#dc2626] mb-1">Khó khăn</p>
                          <p className="text-xs text-[#4d4d4d] leading-relaxed">{dd.difficulties}</p>
                        </div>
                      )}
                      {dd.suggestions && (
                        <div className="bg-[#fafafa] rounded-xl p-4" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                          <p className="text-xs font-semibold text-[#b8860b] mb-1">Đề xuất</p>
                          <p className="text-xs text-[#4d4d4d] leading-relaxed">{dd.suggestions}</p>
                        </div>
                      )}
                    </div>

                    {/* Công việc liên quan */}
                    {dd.extraTasks && dd.extraTasks.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Công việc liên quan</h4>
                        <div className="space-y-2">
                          {dd.extraTasks.filter((t:string) => t.trim()).map((t:string, i:number) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-[#fafafa] rounded-xl" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              <span className="text-sm text-ink">{t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chỉ số */}
                    {dd.metrics && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Chỉ số kinh doanh</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {dd.metrics.todayOrders > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-ink">{dd.metrics.todayOrders}</p>
                              <p className="text-xs text-muted mt-1 font-medium">Đơn hàng</p>
                            </div>
                          )}
                          {dd.metrics.todayCost > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-ink">{Number(dd.metrics.todayCost).toLocaleString('vi-VN')}đ</p>
                              <p className="text-xs text-muted mt-1 font-medium">Chi phí</p>
                            </div>
                          )}
                          {dd.metrics.adsTotal > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-[#0068d6]">{Number(dd.metrics.adsTotal).toLocaleString('vi-VN')}đ</p>
                              <p className="text-xs text-muted mt-1 font-medium">CP QC</p>
                            </div>
                          )}
                          {dd.metrics.roas !== '—' && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-[#7c3aed]">{dd.metrics.roas}x</p>
                              <p className="text-xs text-muted mt-1 font-medium">ROAS</p>
                            </div>
                          )}
                          {dd.metrics.seoOrders > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-[#16a34a]">{dd.metrics.seoOrders}</p>
                              <p className="text-xs text-muted mt-1 font-medium">Đơn SEO</p>
                            </div>
                          )}
                          {dd.metrics.publishedPosts > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-ink">{dd.metrics.publishedPosts}</p>
                              <p className="text-xs text-muted mt-1 font-medium">Bài đã đăng</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* File đính kèm */}
                    {dd.attachments && dd.attachments.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">File đính kèm</h4>
                        <div className="flex flex-wrap gap-2">
                          {dd.attachments.map((url:string, i:number) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 bg-[#fafafa] rounded-xl text-xs text-[#4d4d4d] hover:text-primary transition-all"
                              style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1={12} y1={15} x2={12} y2={3}/></svg>
                              {url.split('/').pop() || ('File ' + (i+1))}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Drive picker modal */}
      {showDrivePicker && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDrivePicker(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[70vh] flex flex-col overflow-hidden" style={{boxShadow:'rgba(0,0,0,0.12) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 12px'}} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ebebeb]">
              <h3 className="text-sm font-semibold text-ink">Chọn file từ Kho dữ liệu</h3>
              <button onClick={() => setShowDrivePicker(false)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-all"><X size={16} className="text-muted" /></button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#ebebeb] bg-[#fafafa]">
              {driveFolderId && <button onClick={async()=>{const r=await api('/drive');setDriveFiles(r||[]);setDriveFolderId(null);setDriveSearch('');}} className="flex items-center gap-1 text-xs text-muted hover:text-ink transition-all"><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>Kho dữ liệu</button>}
              <input value={driveSearch} onChange={e => setDriveSearch(e.target.value)} placeholder="Tìm kiếm..." autoFocus
                className="flex-1 px-3 py-1.5 bg-white border border-[#ebebeb] rounded-lg text-xs text-ink outline-none focus:border-[#4f46e5]/40 transition-all" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {driveFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Folder size={36} className="mx-auto mb-3 text-[#d4d4d4]" />
                  <p className="text-sm text-muted">Chưa có file nào</p>
                </div>
              ) : (
                <div>
                  {driveFiles.filter((f:any) => !driveSearch || f.name.toLowerCase().includes(driveSearch.toLowerCase())).map((f:any) => { const isF = f.type === 'folder'; return (
                    <div key={f.id} onClick={async () => { if (isF) { const r2 = await api('/drive?parentId=' + f.id); setDriveFiles(r2 || []); setDriveFolderId(f.id); setDriveSearch(''); return; } setAttachments(prev => [...prev, f.url]); setShowDrivePicker(false); }}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] cursor-pointer transition-all border-b border-[#ebebeb]/50 last:border-0">
                      {isF ? <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-amber-500"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div> : f.mime_type?.startsWith('image/') ? (
                        <img src={f.url} alt={f.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] flex items-center justify-center"><FileText size={18} className="text-muted" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{f.name}</p>
                        <p className="text-xs text-muted">{isF ? 'Thư mục' : (f.uploadedByName || 'File')}</p>
                      </div>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-[#d4d4d4] shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    
      {/* History detail modal */}
      {historyDetail && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setHistoryDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-border overflow-hidden max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-border bg-gray-50/60 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-sm text-ink">Chi tiết báo cáo</h3>
              <button onClick={() => setHistoryDetail(null)} className="p-1 rounded hover:bg-gray-200 text-muted"><X size={16} /></button>
            </div>
            <div className="p-6 flex gap-6">
              {/* Left: Report Details */}
              <div className="flex-1 min-w-0 space-y-5">
                {/* Sender header */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shadow-lg shadow-indigo-200">{getUserName(historyDetail.user_id)?.charAt(0) || '?'}</div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{getUserName(historyDetail.user_id)}</p>
                    <p className="text-xs text-muted">{formatDate(historyDetail.date)} · {formatTime(historyDetail.created_at)}</p>
                  </div>
                </div>
                {/* Content */}
                <div className="rounded-xl p-4" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px'}}>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Nội dung báo cáo</p>
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{(JSON.parse(historyDetail.data||'{}')).content||'—'}</p>
                  {(JSON.parse(historyDetail.data||'{}')).notes && <p className="text-xs text-muted mt-2 pt-2" style={{borderTop:'1px solid rgba(0,0,0,0.06)'}}>{(JSON.parse(historyDetail.data||'{}')).notes}</p>}
                </div>
                {/* Difficulties & Suggestions */}
                <div className="grid grid-cols-2 gap-3">
                  {(JSON.parse(historyDetail.data||'{}')).difficulties && <div className="rounded-xl p-3" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px'}}><p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Khó khăn</p><p className="text-xs text-[#4d4d4d]">{(JSON.parse(historyDetail.data||'{}')).difficulties}</p></div>}
                  {(JSON.parse(historyDetail.data||'{}')).suggestions && <div className="rounded-xl p-3" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px'}}><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Đề xuất</p><p className="text-xs text-[#4d4d4d]">{(JSON.parse(historyDetail.data||'{}')).suggestions}</p></div>}
                </div>
                {/* Extra Tasks */}
                {(JSON.parse(historyDetail.data||'{}')).extraTasks?.length > 0 && <div><p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Công việc khác</p><div className="flex flex-wrap gap-1.5">{(JSON.parse(historyDetail.data||'{}')).extraTasks.map((t:any,i:number)=><span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px',backgroundColor:'#fafafa'}}>{t}</span>)}</div></div>}
                {/* Metrics */}
                {(JSON.parse(historyDetail.data||'{}')).metrics?.todayOrders > 0 && <div><p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Chỉ số kinh doanh</p><div className="flex flex-wrap gap-3">{(JSON.parse(historyDetail.data||'{}')).metrics?.todayOrders > 0 && <div className="rounded-xl px-4 py-3 text-center min-w-[90px]" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px'}}><p className="text-xl font-bold text-primary">{(JSON.parse(historyDetail.data||'{}')).metrics.todayOrders}</p><p className="text-xs text-muted mt-0.5 font-medium">Đơn</p></div>}{(JSON.parse(historyDetail.data||'{}')).metrics?.todayCost > 0 && <div className="rounded-xl px-4 py-3 text-center min-w-[90px]" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px'}}><p className="text-xl font-bold text-[#d97706]">{Number((JSON.parse(historyDetail.data||'{}')).metrics.todayCost).toLocaleString('vi-VN')}</p><p className="text-xs text-muted mt-0.5 font-medium">Chi phí</p></div>}{(JSON.parse(historyDetail.data||'{}')).metrics?.adsTotal > 0 && <div className="rounded-xl px-4 py-3 text-center min-w-[90px]" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px'}}><p className="text-xl font-bold text-[#db2777]">{Number((JSON.parse(historyDetail.data||'{}')).metrics.adsTotal).toLocaleString('vi-VN')}</p><p className="text-xs text-muted mt-0.5 font-medium">QC</p></div>}</div></div>}
                {/* Recipients */}
                {(JSON.parse(historyDetail.data||'{}')).recipients?.length > 0 && <div className="pt-3" style={{borderTop:'1px solid rgba(0,0,0,0.06)'}}><p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Đã gửi đến</p><div className="flex flex-wrap gap-1.5">{(JSON.parse(historyDetail.data||'{}')).recipients.map((rid:string)=><span key={rid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px',backgroundColor:'#fafafa'}}>{getUserName(rid)}</span>)}</div></div>}
              </div>
              {/* Right: Comments */}
              <div className="w-80 shrink-0 flex flex-col" style={{borderLeft:'1px solid rgba(0,0,0,0.06)', paddingLeft:'1.25rem', maxHeight:'calc(80vh - 80px)'}}>
                <p className="text-sm font-semibold text-ink mb-4">Góp ý <span className="text-muted font-medium">({reportComments.length})</span></p>
                <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                  {reportComments.length === 0 && <div className="flex flex-col items-center justify-center py-10 text-center"><div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px',backgroundColor:'#fafafa'}}><MessageSquare size={18} className="text-muted" /></div><p className="text-sm font-medium text-muted">Chưa có góp ý</p></div>}
                  {reportComments.map((c: any) => (
                    <div key={c.id} className="rounded-xl p-3" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px'}}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-[8px] font-bold">{c.userName?.charAt(0) || '?'}</div>
                        <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-ink truncate">{c.userName} <span className="text-xs text-muted font-normal">{new Date(c.created_at).toLocaleString('vi-VN')}</span></p></div>
                      </div>
                      <p className="text-xs text-[#4d4d4d] leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-3" style={{borderTop:'1px solid rgba(0,0,0,0.06)'}}>
                  <input value={commentInput} onChange={e=>setCommentInput(e.target.value)} placeholder="Viết góp ý..." className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px',backgroundColor:'#fff'}} onKeyDown={e=>{if(e.key==='Enter')addComment();}} />
                  <button onClick={addComment} disabled={!commentInput.trim()} className="px-4 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 transition-all">Gửi</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
</div>
  );
}