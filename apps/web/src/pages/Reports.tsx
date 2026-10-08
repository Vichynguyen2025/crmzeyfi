import { useState, useEffect, useCallback } from 'react';
import { FileText, Send, Calendar, ChevronDown, Paperclip, X, CheckCircle2, Clock, Users, BarChart3, TrendingUp, MessageSquare, Download, Eye, Inbox, UserCheck, ChevronRight, Folder, Trash2, Link } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { getSocket } from '../lib/socket';


const CardSection = ({ title, type, borderColor, bgColor, icon, iconBg, iconColor, children }: { title: string; type: string; borderColor: string; bgColor: string; icon: any; iconBg: string; iconColor: string; children: any }) => (
  <div className="rounded-xl border overflow-hidden" style={{borderColor, background: bgColor}}>
    <div style={{borderLeft:'4px solid '+borderColor}} className="p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: iconBg}}><span style={{color: iconColor}}>{icon}</span></div>
        <h3 className="text-sm font-semibold text-[#101828]">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);
export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState('');
  const [reason, setReason] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [extraTasks, setExtraTasks] = useState<string[]>(['']);
  const [completedCount, setCompletedCount] = useState(0);
  const [uncompletedCount, setUncompletedCount] = useState(0);
  const [incompleteReason, setIncompleteReason] = useState('');
  const [commitChecked, setCommitChecked] = useState(false);
  const [receivedDevices, setReceivedDevices] = useState(0);
  const [khachManhSon, setKhachManhSon] = useState(0);
  const [khachFamily, setKhachFamily] = useState(0);
  const [khachDangKyLai, setKhachDangKyLai] = useState(0);
  const [khachCamTay, setKhachCamTay] = useState(0);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [reportLinks, setReportLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
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
  const showToast = (type:string, msg:string) => { const e = document.createElement('div'); e.className = 'fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' + (type==='success'?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'); e.textContent = msg; document.body.appendChild(e); setTimeout(() => e.remove(), 3000); };
  const userRole = user.role;
//  const allUsersList = allUsers; // for recipient name lookup
  const getUserName = (id:string) => { const u = allUsers.find(u2 => u2.id === id); return u ? (u.name || u.email) : id.slice(0,8); };
  const formatDate = (d: string) => d ? (d.includes('T') ? new Date(d).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}) : d.includes('-') ? d.split('-').reverse().join('/') : d) : '';
  const formatTime = (d: string) => d ? new Date(d).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'}) : '';
  const nav = useNavigate();
  const { tab: urlTab } = useParams();
  const [tab, setTab] = useState<string>(urlTab || 'create');
  const [employeeRole, setEmployeeRole] = useState('officer');
  const ROLES = [
    { key: 'officer', label: 'Văn phòng', icon: FileText },
    { key: 'digital-marketing', label: 'Digital Marketing', icon: TrendingUp },
    { key: 'content', label: 'Content', icon: FileText },
    { key: 'editor', label: 'Editor', icon: CheckCircle2 },
    { key: 'seo', label: 'SEO', icon: Eye },
  ];
  // Read role from query param on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('role');
    if (r && ['officer','digital-marketing','content','editor','seo'].includes(r)) setEmployeeRole(r);
  }, []);
  // Sync URL with tab state
  useEffect(() => { if (urlTab && urlTab !== tab) setTab(urlTab); }, [urlTab]);

  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));

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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string|null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisCount, setAnalysisCount] = useState<number|null>(null);
  const [analysisStats, setAnalysisStats] = useState<any>(null);
  const [analysisPeriod, setAnalysisPeriod] = useState('');
const [analysisSummary, setAnalysisSummary] = useState<any>(null);
  const [analysisHtml, setAnalysisHtml] = useState('');
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);

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
        userTeamId && u.id ? api('/daily-perf/' + userTeamId + '/' + u.id + '?month=' + reportDate.slice(0,7) + '&dateFrom=' + reportDate + '&dateTo=' + reportDate).catch(() => []) : Promise.resolve([]),
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

  // Auto-advance to new day every 30s
  useEffect(() => {
    const check = () => {
      const d = new Date().toISOString().slice(0, 10);
      if (d !== today) {
        setToday(d);
        setReportDate(d);
        setContent('');
        setReason('');
        setDifficulties('');
        setSuggestions('');
        setExtraTasks([]);
        setAttachments([]);
        setReportLinks([]);
        setNewLink('');
        setConfirming(false);
        loadReports();
        loadMetrics();
        showToast('success', '\u0110\u00e3 sang ng\u00e0y m\u1edbi (' + d + ') — form b\u00e1o c\u00e1o m\u1edbi');
      }
    };
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [today]);
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
    if (employeeRole === 'digital-marketing' && !commitChecked) { showToast('error', 'Vui lòng tích vào Cam kết đã điền đầy đủ lý do trước khi gửi'); return; }
    if (!content.trim()) return;
    setSending(true);
    try {
      await api('/reports', { method:'POST', body:JSON.stringify({
        date: reportDate,
        data: JSON.stringify({role: employeeRole,
          content: content.trim(),
          recipients: recipients,
          reason: reason.trim(),
          difficulties: difficulties.trim(),
          suggestions: suggestions.trim(),
          extraTasks: extraTasks.filter(t => t.trim()),
          completedCount, uncompletedCount, incompleteReason: incompleteReason.trim(), commitChecked, receivedDevices, khachManhSon, khachFamily, khachDangKyLai, khachCamTay,
          metrics: metrics,
          attachments: attachments,
          links: reportLinks,
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
    <>
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
        <>
        <div className="mb-3">
          <div className="bg-white border border-[#E5E7EB] rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#475467] whitespace-nowrap">Bạn là:</span>
              <div className="flex flex-wrap items-center gap-2">
                {ROLES.map(r => (
                  <button key={r.key} onClick={async () => {
                    setEmployeeRole(r.key);
                    nav('/crm/reports/create?role=' + r.key);
                  }}
                    className={'inline-flex items-center gap-2 px-4 text-sm font-medium rounded-lg border transition-all duration-150 whitespace-nowrap ' + (employeeRole === r.key ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5] font-semibold' : 'bg-white border-[#E5E7EB] text-[#667085] hover:bg-[#F5F3FF] hover:border-[#C7D2FE]')}
                    style={{height:40}}>
                    <r.icon size={16} className={employeeRole === r.key ? 'text-[#4F46E5]' : 'text-[#98A2B3]'} /> {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
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
                
                {/* Digital Marketing: Installation Completion Table */}
                {employeeRole === 'digital-marketing' && (
                  <div className="mt-5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-[#4F46E5]/5 border-b border-[#E5E7EB]">
                      <h3 className="text-sm font-semibold text-[#101828]">Bảng xác nhận hoàn thành lắp đặt</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#475467] mb-1">Số lượng khách hoàn thành</label>
                          <input type="number" min={0} value={completedCount} onChange={e => setCompletedCount(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#4F46E5]/20" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#475467] mb-1">Số lượng khách chưa hoàn thành</label>
                          <input type="number" min={0} value={uncompletedCount} onChange={e => setUncompletedCount(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#4F46E5]/20" />
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="block text-xs font-medium text-[#475467] mb-1">Số khách đã nhận thiết bị trong tháng</label>
                        <input type="number" min={0} value={receivedDevices} onChange={e => setReceivedDevices(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#4F46E5]/20" />
                      </div>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={commitChecked} onChange={e => setCommitChecked(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5]" />
                        <span className="text-xs text-[#475467] leading-relaxed">Cam kết đã điền đầy đủ lý do theo form Trưởng phòng quy định</span>
                      </label>
                    </div>
                  </div>
                )}
                
                {/* DM: Customer hierarchy */}
                {employeeRole === 'digital-marketing' && (
                  <div className="mt-4 bg-white border border-[#E5E7EB] rounded-xl px-5 py-4">
                    <div style={{display:'grid', gridTemplateColumns:'auto 96px 96px 96px auto 96px auto', gap:'8px 8px', alignItems:'center', justifyContent:'center'}}>
                                            <span className="invisible text-sm font-semibold select-none">Khách hàng:</span>
                                            <div className="text-xs font-semibold text-[#6366F1] text-center">Manshon</div>
                                            <div className="text-xs font-semibold text-[#0891B2] text-center">Family</div>
                                            <div className="text-xs font-semibold text-[#16A34A] text-center">Đ.ký lại</div>
                                            <span className="text-sm font-semibold text-[#6366F1] invisible px-4">_</span>
                                            <div className="text-xs font-semibold text-[#0891B2] text-center">Cầm tay</div>
                                            <span className="text-sm font-semibold text-[#101828] invisible px-4">_</span>
                                            <span className="text-sm font-semibold text-[#475467] whitespace-nowrap" style={{alignSelf:'center'}}>Khách hàng:</span>
                                            <input type="number" min={0} value={khachManhSon} onChange={e => setKhachManhSon(Number(e.target.value))}
                                              className="w-full h-11 text-center rounded-xl border border-[#E5E7EB] text-sm font-semibold p-0 outline-none" />
                                            <input type="number" min={0} value={khachFamily} onChange={e => setKhachFamily(Number(e.target.value))}
                                              className="w-full h-11 text-center rounded-xl border border-[#E5E7EB] text-sm font-semibold p-0 outline-none" />
                                            <input type="number" min={0} value={khachDangKyLai} onChange={e => setKhachDangKyLai(Number(e.target.value))}
                                              className="w-full h-11 text-center rounded-xl border border-[#E5E7EB] text-sm font-semibold p-0 outline-none" />
                                            <span className="text-sm font-semibold text-[#6366F1] bg-[#EEF2FF] border border-[#C7D2FE] rounded-md px-3 whitespace-nowrap inline-flex items-center justify-center h-11 gap-2" style={{width:'100%'}}><span>Cố định:</span><span className="text-lg font-bold text-[#4F46E5]">{khachManhSon + khachFamily + khachDangKyLai}</span></span>
                                            <input type="number" min={0} value={khachCamTay} onChange={e => setKhachCamTay(Number(e.target.value))}
                                              className="w-full h-11 text-center rounded-xl border border-[#E5E7EB] text-sm font-semibold p-0 outline-none" />
                                            <span className="text-sm font-semibold text-[#101828] bg-[#F5F3FF] border border-[#C7D2FE] rounded-md px-3 whitespace-nowrap inline-flex items-center justify-center h-11 gap-2" style={{width:'100%'}}><span>Tổng:</span><span className="text-lg font-bold text-[#4F46E5]">{khachManhSon + khachFamily + khachDangKyLai + khachCamTay}</span></span>
                    </div>
                  </div>
                )}
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

                {/* Link attachment */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted mb-2">Đính kèm link</label>
                  <div className="flex items-center gap-2">
                    <input type="url" value={newLink} onChange={e => setNewLink(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-[#f8fafc] border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-all" />
                    <button onClick={() => { if (newLink.trim()) { setReportLinks([...reportLinks, newLink.trim()]); setNewLink(''); } }}
                      className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium">Thêm</button>
                  </div>
                  {reportLinks.length > 0 && reportLinks.map((link, i) => (
                    <div key={i} className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-border rounded-lg text-xs">
                      <Link size={12} className="text-primary shrink-0" />
                      <span className="text-primary truncate max-w-[200px]">{link}</span>
                      <button onClick={() => setReportLinks(prev => prev.filter(function(_, j) { return j !== i; }))} className="text-red-400 hover:text-red-600 ml-auto shrink-0"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setContent(''); setAttachments([]); setReportLinks([]); setConfirming(false); }}
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
        </>
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
              <button onClick={() => setReceivedDateRangeKey('custom')}
                className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' + (receivedDateRangeKey === 'custom' ? 'bg-[#171717] text-white' : 'text-muted hover:text-ink')}>Tùy chọn</button>
            </div>
            <button onClick={async () => {
              let data: any[] = [];
              if (selectedReports.size > 0) {
                data = receivedReports.filter((x:any) => selectedReports.has(x.id));
              } else {
                try {
                  const u = JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
                  const dt = receivedDateRangeKey==='custom' ? {from:recvDateFrom,to:recvDateTo} : calcDate(receivedDateRangeKey);
                  const r = await api('/reports/received?userId='+u.id+'&from='+dt.from+'&to='+dt.to);
                  data = r || [];
                } catch {}
              }
              setAnalyzing(true);
              setShowAnalysis(true);
              setAnalysisResult(null);
              setAnalysisProgress(8);
              setAnalysisStage('Thu thập dữ liệu báo cáo...');
              if (data.length === 0) {
                setAnalysisResult('_Không có báo cáo nào trong kỳ để phân tích._ Vui lòng chọn báo cáo bằng checkbox hoặc chọn kỳ khác.');
                setAnalysisHtml('<p class="text-sm text-[#374151] leading-relaxed">Không có báo cáo nào trong kỳ để phân tích. Vui lòng chọn báo cáo bằng checkbox hoặc chọn kỳ khác.</p>');
                setAnalysisProgress(100);
                setAnalysisStage('Không có dữ liệu');
                setAnalyzing(false);
                return;
              }
              try {
                setAnalysisProgress(25);
                setAnalysisStage('Xử lý & chuẩn bị dữ liệu cho AI...');
                const payload = data.map((r:any) => {
                  const parsed = (() => { try { return JSON.parse(r.data || '{}'); } catch { return {}; } })();
                  return { id:r.id, userName:getUserName(r.user_id) || r.userName || 'Ai đó', date:r.date, content:parsed.content || r.content || '', difficulties:parsed.difficulties || '', suggestions:parsed.suggestions || '', status:r.status };
                });
                setAnalysisProgress(45);
                setAnalysisStage('Đang gửi tới DeepSeek AI...');
                const result = await api('/reports/analyze', { method:'POST', body:JSON.stringify({ reports: payload }) });
                setAnalysisProgress(75);
                setAnalysisStage('AI đang phân tích & tổng hợp...');
                const summary = result?.summary || '_Không nhận được phân tích._';
                setAnalysisResult(summary);
                setAnalysisCount(data.length);
                // Aggregate metrics from all selected reports
                let reportSum: any = { orders:0, cost:0, b3Cost:0, messages:0, msgCost:0, adsTotal:0, adsRevenue:0, adsOrders:0, seoOrders:0, seoRevenue:0, socialPosts:0, publishedPosts:0 };
                data.forEach((rpt:any) => {
                  const d = (() => { try { return JSON.parse(rpt.data || '{}'); } catch { return {}; } })();
                  const m = d.metrics || {};
                  reportSum.orders += m.todayOrders || 0;
                  reportSum.cost += m.todayCost || 0;
                  reportSum.b3Cost += m.b3TotalCost || 0;
                  reportSum.messages += m.todayMessages || 0;
                  reportSum.msgCost += (m.avgMessCost || 0) * (m.todayMessages || 0);
                  reportSum.adsTotal += m.adsTotal || 0;
                  reportSum.adsRevenue += m.adsRevenue || 0;
                  reportSum.adsOrders += m.adsOrders || 0;
                  reportSum.seoOrders += m.seoOrders || 0;
                  reportSum.seoRevenue += m.seoRevenue || 0;
                  reportSum.socialPosts += m.socialPosts || 0;
                  reportSum.publishedPosts += m.publishedPosts || 0;
                });
                if (reportSum.messages > 0) reportSum.avgMsgCost = reportSum.msgCost / reportSum.messages;
                reportSum.roas = reportSum.adsTotal > 0 ? Math.round((reportSum.adsRevenue / reportSum.adsTotal) * 100) / 100 : 0;
                setAnalysisSummary(reportSum);
                const pc = data.filter((x:any)=>x.status==='pending').length;
                const ac = data.filter((x:any)=>x.status==='approved').length;
                const rc = data.filter((x:any)=>x.status==='rejected').length;
                setAnalysisStats({ pending: pc, approved: ac, rejected: rc });
                setAnalysisPeriod(receivedDateRangeKey==='today' ? 'Hôm nay' : receivedDateRangeKey==='custom' ? 'Tùy chọn' : receivedDateRangeKey==='week' ? '7 ngày' : '30 ngày');
                setAnalysisHtml(
                  summary
                    .replace(/### (.+)/g, '<h3 class="text-sm font-bold text-[#1F2937] mt-5 mb-2">$1</h3>')
                    .replace(/## (.+)/g, '<h2 class="text-base font-bold text-[#1F2937] mt-5 mb-2">$1</h2>')
                    .replace(/# (.+)/g, '<h1 class="text-lg font-bold text-[#1F2937] mt-5 mb-2">$1</h1>')
                    .replace(/^\s*- (.+)$/gm, '<li class="text-sm text-[#374151] leading-relaxed ml-4 mb-1">$1</li>')
                    .replace(/^\s*1\. (.+)$/gm, '<li class="text-sm text-[#374151] leading-relaxed ml-4 mb-1">$1</li>')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-[#1F2937]">$1</strong>')
                    .replace(/_([^_]+)_/g, '<em>$1</em>')
                    .replace(/\n\n/g, '<div class="h-2"></div>')
                    .split('\n').filter((l:string)=>l.trim()).map((l:string)=>l.startsWith('<') ? l : '<p class="text-sm text-[#374151] leading-relaxed mb-1">'+l+'</p>').join('')
                );
                setAnalysisProgress(100);
                setAnalysisStage('Hoàn tất');
                // Auto-save to history
                try {
                  const u = JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
                  const dt = receivedDateRangeKey==='custom' ? {from:recvDateFrom,to:recvDateTo} : calcDate(receivedDateRangeKey);
                  await api('/reports/analysis-history', { method:'POST', body:JSON.stringify({
                    reportCount: data.length,
                    periodLabel: receivedDateRangeKey==='today' ? 'Hôm nay' : receivedDateRangeKey==='custom' ? 'Tùy chọn' : receivedDateRangeKey==='week' ? '7 ngày' : '30 ngày',
                    dateFrom: dt.from, dateTo: dt.to,
                    summaryMd: summary
                  })});
                } catch {}
              } catch(e:any) {
                setAnalysisResult('_Lỗi: ' + (e?.message||'không xác định') + '_');
                setAnalysisHtml('<p class="text-sm text-[#DC2626] leading-relaxed">Lỗi: ' + (e?.message||'không xác định') + '</p>');
                setAnalysisProgress(100);
                setAnalysisStage('Lỗi');
              }
              setAnalyzing(false);
            }} disabled={analyzing} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20" style={{whiteSpace:'nowrap'}}>
              <BarChart3 size={15} /> {analyzing ? 'Đang phân tích...' : selectedReports.size > 0 ? `Phân tích AI (${selectedReports.size})` : 'Phân tích AI'}
            </button>
            <button onClick={async () => { try { const h = await api('/reports/analysis-history'); setAnalysisHistory(h || []); } catch {}; setShowHistory(true); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20" style={{whiteSpace:'nowrap'}}>
              <Clock size={15} /> Lịch sử
            </button>
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
                  <th className="px-6 py-3 bg-[#fafafa]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
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
              <button onClick={() => setReceivedDateRangeKey('custom')}
                className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' + (receivedDateRangeKey === 'custom' ? 'bg-[#171717] text-white' : 'text-muted hover:text-ink')}>Tùy chọn</button>
            </div>
            <button onClick={async () => {
              let data: any[] = [];
              if (selectedReports.size > 0) {
                data = receivedReports.filter((x:any) => selectedReports.has(x.id));
              } else {
                try {
                  const u = JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
                  const dt = receivedDateRangeKey==='custom' ? {from:recvDateFrom,to:recvDateTo} : calcDate(receivedDateRangeKey);
                  const r = await api('/reports/received?userId='+u.id+'&from='+dt.from+'&to='+dt.to);
                  data = r || [];
                } catch {}
              }
              setAnalyzing(true);
              setShowAnalysis(true);
              setAnalysisResult(null);
              setAnalysisProgress(8);
              setAnalysisStage('Thu thập dữ liệu báo cáo...');
              if (data.length === 0) {
                setAnalysisResult('_Không có báo cáo nào trong kỳ để phân tích._ Vui lòng chọn báo cáo bằng checkbox hoặc chọn kỳ khác.');
                setAnalysisHtml('<p class="text-sm text-[#374151] leading-relaxed">Không có báo cáo nào trong kỳ để phân tích. Vui lòng chọn báo cáo bằng checkbox hoặc chọn kỳ khác.</p>');
                setAnalysisProgress(100);
                setAnalysisStage('Không có dữ liệu');
                setAnalyzing(false);
                return;
              }
              try {
                setAnalysisProgress(25);
                setAnalysisStage('Xử lý & chuẩn bị dữ liệu cho AI...');
                const payload = data.map((r:any) => {
                  const parsed = (() => { try { return JSON.parse(r.data || '{}'); } catch { return {}; } })();
                  return { id:r.id, userName:getUserName(r.user_id) || r.userName || 'Ai đó', date:r.date, content:parsed.content || r.content || '', difficulties:parsed.difficulties || '', suggestions:parsed.suggestions || '', status:r.status };
                });
                setAnalysisProgress(45);
                setAnalysisStage('Đang gửi tới DeepSeek AI...');
                const pTimer = setInterval(() => { setAnalysisProgress(p => Math.min(p + Math.random() * 4, 68)); }, 2500);
                const result = await api('/reports/analyze', { method:'POST', body:JSON.stringify({ reports: payload }) });
                clearInterval(pTimer);
                setAnalysisProgress(75);
                setAnalysisStage('AI đang phân tích & tổng hợp...');
                const summary = result?.summary || '_Không nhận được phân tích._';
                setAnalysisResult(summary);
                setAnalysisCount(data.length);
                // Aggregate metrics from all selected reports
                let reportSum2: any = { orders:0, cost:0, b3Cost:0, messages:0, msgCost:0, adsTotal:0, adsRevenue:0, adsOrders:0, seoOrders:0, seoRevenue:0, socialPosts:0, publishedPosts:0 };
                data.forEach((rpt:any) => {
                  const d = (() => { try { return JSON.parse(rpt.data || '{}'); } catch { return {}; } })();
                  const m = d.metrics || {};
                  reportSum.orders += m.todayOrders || 0;
                  reportSum.cost += m.todayCost || 0;
                  reportSum.b3Cost += m.b3TotalCost || 0;
                  reportSum.messages += m.todayMessages || 0;
                  reportSum.msgCost += (m.avgMessCost || 0) * (m.todayMessages || 0);
                  reportSum.adsTotal += m.adsTotal || 0;
                  reportSum.adsRevenue += m.adsRevenue || 0;
                  reportSum.adsOrders += m.adsOrders || 0;
                  reportSum.seoOrders += m.seoOrders || 0;
                  reportSum.seoRevenue += m.seoRevenue || 0;
                  reportSum.socialPosts += m.socialPosts || 0;
                  reportSum.publishedPosts += m.publishedPosts || 0;
                });
                if (reportSum.messages > 0) reportSum.avgMsgCost = reportSum.msgCost / reportSum.messages;
                reportSum.roas = reportSum.adsTotal > 0 ? Math.round((reportSum.adsRevenue / reportSum.adsTotal) * 100) / 100 : 0;
                setAnalysisSummary(reportSum2);
                const pc = data.filter((x:any)=>x.status==='pending').length;
                const ac = data.filter((x:any)=>x.status==='approved').length;
                const rc = data.filter((x:any)=>x.status==='rejected').length;
                setAnalysisStats({ pending: pc, approved: ac, rejected: rc });
                setAnalysisPeriod(receivedDateRangeKey==='today' ? 'Hôm nay' : receivedDateRangeKey==='custom' ? 'Tùy chọn' : receivedDateRangeKey==='week' ? '7 ngày' : '30 ngày');
                setAnalysisHtml(
                  summary
                    .replace(/### (.+)/g, '<h3 class="text-sm font-bold text-[#1F2937] mt-5 mb-2">$1</h3>')
                    .replace(/## (.+)/g, '<h2 class="text-base font-bold text-[#1F2937] mt-5 mb-2">$1</h2>')
                    .replace(/# (.+)/g, '<h1 class="text-lg font-bold text-[#1F2937] mt-5 mb-2">$1</h1>')
                    .replace(/^\s*- (.+)$/gm, '<li class="text-sm text-[#374151] leading-relaxed ml-4 mb-1">$1</li>')
                    .replace(/^\s*1\. (.+)$/gm, '<li class="text-sm text-[#374151] leading-relaxed ml-4 mb-1">$1</li>')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-[#1F2937]">$1</strong>')
                    .replace(/_([^_]+)_/g, '<em>$1</em>')
                    .replace(/\n\n/g, '<div class="h-2"></div>')
                    .split('\n').filter((l:string)=>l.trim()).map((l:string)=>l.startsWith('<') ? l : '<p class="text-sm text-[#374151] leading-relaxed mb-1">'+l+'</p>').join('')
                );
                setAnalysisProgress(100);
                setAnalysisStage('Hoàn tất');
                // Auto-save to history
                try {
                  const u = JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
                  const dt = receivedDateRangeKey==='custom' ? {from:recvDateFrom,to:recvDateTo} : calcDate(receivedDateRangeKey);
                  await api('/reports/analysis-history', { method:'POST', body:JSON.stringify({
                    reportCount: data.length,
                    periodLabel: receivedDateRangeKey==='today' ? 'Hôm nay' : receivedDateRangeKey==='custom' ? 'Tùy chọn' : receivedDateRangeKey==='week' ? '7 ngày' : '30 ngày',
                    dateFrom: dt.from, dateTo: dt.to,
                    summaryMd: summary
                  })});
                } catch {}
              } catch(e:any) {
                setAnalysisResult('_Lỗi: ' + (e?.message||'không xác định') + '_');
                setAnalysisHtml('<p class="text-sm text-[#DC2626] leading-relaxed">Lỗi: ' + (e?.message||'không xác định') + '</p>');
                setAnalysisProgress(100);
                setAnalysisStage('Lỗi');
              }
              setAnalyzing(false);
            }} disabled={analyzing} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20" style={{whiteSpace:'nowrap'}}>
              <BarChart3 size={15} /> {analyzing ? 'Đang phân tích...' : selectedReports.size > 0 ? `Phân tích AI (${selectedReports.size})` : 'Phân tích AI'}
            </button>
            <button onClick={async () => { try { const h = await api('/reports/analysis-history'); setAnalysisHistory(h || []); } catch {}; setShowHistory(true); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20" style={{whiteSpace:'nowrap'}}>
              <Clock size={15} /> Lịch sử
            </button>
          </div>

          <div className="overflow-hidden rounded-xl" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px'}}>
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-3 w-10 bg-[#fafafa]"><input type="checkbox" checked={receivedReports.length>0 && selectedReports.size===receivedReports.length} onChange={e=>{if(e.target.checked){setSelectedReports(new Set(receivedReports.map((x:any)=>x.id)));}else{setSelectedReports(new Set());}}} className="w-4 h-4 rounded cursor-pointer" /></th>
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
                    <td colSpan={6} className="px-6 py-16 text-center">
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
                      className={"cursor-pointer transition-all duration-150 hover:bg-[#fafafa] " + (selectedReports.has(r.id) ? "bg-[#f5f3ff]" : "")}>
                      <td className="px-3 py-4 w-10" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedReports.has(r.id)} onChange={e => { const s = new Set(selectedReports); if (e.target.checked) { s.add(r.id); } else { s.delete(r.id); } setSelectedReports(s); }} className="w-4 h-4 rounded cursor-pointer" />
                      </td>
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
                          {dd.metrics.todayMessages > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-ink">{dd.metrics.todayMessages}</p>
                              <p className="text-xs text-muted mt-1 font-medium">Tin nhắn</p>
                            </div>
                          )}
                          {dd.metrics.avgMessCost > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-[#d97706]">{Number(dd.metrics.avgMessCost).toLocaleString('vi-VN')}đ</p>
                              <p className="text-xs text-muted mt-1 font-medium">CP/Mess</p>
                            </div>
                          )}
                          {dd.metrics.adsTotal > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-[#0068d6]">{Number(dd.metrics.adsTotal).toLocaleString('vi-VN')}đ</p>
                              <p className="text-xs text-muted mt-1 font-medium">CP QC</p>
                            </div>
                          )}
                          {dd.metrics.adsRevenue > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-[#16a34a]">{Number(dd.metrics.adsRevenue).toLocaleString('vi-VN')}đ</p>
                              <p className="text-xs text-muted mt-1 font-medium">Doanh thu QC</p>
                            </div>
                          )}
                          {dd.metrics.adsOrders > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-ink">{dd.metrics.adsOrders}</p>
                              <p className="text-xs text-muted mt-1 font-medium">Đơn QC</p>
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
                          {dd.metrics.seoRevenue > 0 && (
                            <div className="bg-[#fafafa] rounded-xl p-4 text-center" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className="text-xl font-bold text-[#16a34a]">{Number(dd.metrics.seoRevenue).toLocaleString('vi-VN')}đ</p>
                              <p className="text-xs text-muted mt-1 font-medium">Doanh thu SEO</p>
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
                                            {/* Link đính kèm */}
                      {dd.links && dd.links.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Link đính kèm</h4>
                          <div className="space-y-1.5">
                            {dd.links.map((link: string, i: number) => (
                              <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-[#fafafa] border border-border rounded-lg text-xs text-primary hover:bg-blue-50 transition-all">
                                <Link size={12} />
                                <span className="truncate">{link}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
</div>
                    )}
                    {/* Digital Marketing: Installation Table */}
                    {(dd.role === 'digital-marketing' || dd.completedCount !== undefined) && (
                      <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-[#4F46E5]/5 border-b border-[#E5E7EB]">
                          <h4 className="text-sm font-semibold text-[#101828]">Bảng xác nhận hoàn thành lắp đặt</h4>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 text-center">
                              <p className="text-xs font-medium text-[#667085]">Hoàn thành</p>
                              <p className="text-xl font-bold text-[#101828]">{dd.completedCount || 0}</p>
                            </div>
                            <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 text-center">
                              <p className="text-xs font-medium text-[#667085]">Chưa hoàn thành</p>
                              <p className="text-xl font-bold text-[#101828]">{dd.uncompletedCount || 0}</p>
                            </div>
                          </div>
                          {dd.receivedDevices > 0 && (
                            <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 text-center">
                              <p className="text-xs font-medium text-[#667085]">Đã nhận thiết bị</p>
                              <p className="text-xl font-bold text-[#101828]">{dd.receivedDevices}</p>
                            </div>
                          )}
                          {dd.commitChecked && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#EEF2FF] rounded-lg text-xs text-[#4F46E5]">
                              <span>✓</span><span>Cam kết đã điền đầy đủ lý do</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Digital Marketing: Customer Stats */}
                    {(dd.role === 'digital-marketing' || dd.khachManhSon !== undefined) && (
                      <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-[#4F46E5]/5 border-b border-[#E5E7EB]">
                          <h4 className="text-sm font-semibold text-[#101828]">Thống kê khách hàng</h4>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <p className="text-xs font-medium text-[#6366F1]">Manshon</p>
                              <p className="text-lg font-bold text-[#101828]">{dd.khachManhSon || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium text-[#0891B2]">Family</p>
                              <p className="text-lg font-bold text-[#101828]">{dd.khachFamily || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium text-[#16A34A]">Đ.ký lại</p>
                              <p className="text-lg font-bold text-[#101828]">{dd.khachDangKyLai || 0}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 bg-[#EEF2FF] rounded-lg px-4 py-3 flex items-center justify-between">
                              <span className="text-xs font-medium text-[#475467]">Cố định</span>
                              <span className="text-base font-bold text-[#4F46E5]">{(dd.khachManhSon || 0) + (dd.khachFamily || 0) + (dd.khachDangKyLai || 0)}</span>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium text-[#0891B2]">Cầm tay</p>
                              <p className="text-lg font-bold text-[#101828]">{dd.khachCamTay || 0}</p>
                            </div>
                          </div>
                          <div className="bg-[#F5F3FF] border border-[#C7D2FE] rounded-lg px-4 py-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#101828]">Tổng khách chốt</span>
                            <span className="text-xl font-bold text-[#4F46E5]">{(dd.khachManhSon || 0) + (dd.khachFamily || 0) + (dd.khachDangKyLai || 0) + (dd.khachCamTay || 0)}</span>
                          </div>
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
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setHistoryDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-[#E5E7EB]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] grid place-items-center text-white text-sm font-bold shadow-sm">{getUserName(historyDetail.user_id)?.charAt(0) || '?'}</div>
                <div>
                  <h3 className="text-sm font-semibold text-[#101828]">{getUserName(historyDetail.user_id)}</h3>
                  <p className="text-xs text-[#667085]">{formatDate(historyDetail.date)} · {formatTime(historyDetail.created_at)}</p>
                </div>
              </div>
              <button onClick={() => setHistoryDetail(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6] transition-all text-[#98A2B3]"><X size={16} /></button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              
              {/* 1. Nội dung báo cáo */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">Nội dung báo cáo</p>
                <p className="text-sm text-[#344054] leading-relaxed whitespace-pre-wrap">{(JSON.parse(historyDetail.data||'{}')).content||'\u2014'}</p>
                {(JSON.parse(historyDetail.data||'{}')).notes && <p className="text-xs text-[#667085] mt-3 pt-3 border-t border-[#E5E7EB]">{(JSON.parse(historyDetail.data||'{}')).notes}</p>}
              </div>
              
              {/* 2. File & Link đính kèm */}
              {(JSON.parse(historyDetail.data||'{}')).attachments?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">File đính kèm</p>
                  <div className="flex flex-wrap gap-2">
                    {(JSON.parse(historyDetail.data||'{}')).attachments.map((url:string, i:number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#4F46E5] hover:bg-[#F5F3FF] transition-all">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1={12} y1={15} x2={12} y2={3}/></svg>
                        {url.split('/').pop() || ('File ' + (i+1))}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {(JSON.parse(historyDetail.data||'{}')).links?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">Link đính kèm</p>
                  <div className="space-y-1.5">
                    {(JSON.parse(historyDetail.data||'{}')).links.map((link: string, i: number) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#4F46E5] hover:bg-[#F5F3FF] transition-all">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        <span className="truncate max-w-[500px]">{link}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 3. Khó khăn & Đề xuất */}
              <div className="grid grid-cols-2 gap-4">
                {(JSON.parse(historyDetail.data||'{}')).difficulties && (
                  <div className="bg-white border border-[#FECACA] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#FEF2F2] flex items-center justify-center"><span className="text-[10px] text-[#DC2626] font-bold">!</span></div>
                      <span className="text-xs font-semibold text-[#DC2626]">Khó khăn</span>
                    </div>
                    <p className="text-xs text-[#475467] leading-relaxed">{(JSON.parse(historyDetail.data||'{}')).difficulties}</p>
                  </div>
                )}
                {(JSON.parse(historyDetail.data||'{}')).suggestions && (
                  <div className="bg-white border border-[#BBF7D0] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#F0FDF4] flex items-center justify-center"><span className="text-[10px] text-[#16A34A] font-bold">+</span></div>
                      <span className="text-xs font-semibold text-[#16A34A]">Đề xuất</span>
                    </div>
                    <p className="text-xs text-[#475467] leading-relaxed">{(JSON.parse(historyDetail.data||'{}')).suggestions}</p>
                  </div>
                )}
              </div>
              
              {/* 4. Công việc khác */}
              {(JSON.parse(historyDetail.data||'{}')).extraTasks?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2.5">Công việc khác</p>
                  <div className="space-y-1.5">
                    {(JSON.parse(historyDetail.data||'{}')).extraTasks.map((t:any,i:number)=>
                      <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] shrink-0"></div>
                        <span className="text-sm text-[#344054]">{t}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Metrics Sections */}
              {(JSON.parse(historyDetail.data||'{}')).metrics?.todayOrders > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Chỉ số kinh doanh</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(JSON.parse(historyDetail.data||'{}')).metrics?.todayOrders > 0 && (
                      <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-4 text-center">
                        <p className="text-xl font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).metrics.todayOrders}</p>
                        <p className="text-xs text-[#667085] mt-0.5">Đơn</p>
                      </div>
                    )}
                    {(JSON.parse(historyDetail.data||'{}')).metrics?.todayCost > 0 && (
                      <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-4 text-center">
                        <p className="text-xl font-bold text-[#D97706]">{Number((JSON.parse(historyDetail.data||'{}')).metrics.todayCost).toLocaleString('vi-VN')}</p>
                        <p className="text-xs text-[#667085] mt-0.5">Chi phí</p>
                      </div>
                    )}
                    {(JSON.parse(historyDetail.data||'{}')).metrics?.adsTotal > 0 && (
                      <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-4 text-center">
                        <p className="text-xl font-bold text-[#DB2777]">{Number((JSON.parse(historyDetail.data||'{}')).metrics.adsTotal).toLocaleString('vi-VN')}</p>
                        <p className="text-xs text-[#667085] mt-0.5">QC</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Kết quả kinh doanh */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Kết quả kinh doanh</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).metrics.todayOrders ?? 0}</p>
                    <p className="text-xs text-[#667085] mt-0.5">Đơn (B2)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#2563EB]">{Number((JSON.parse(historyDetail.data||'{}')).metrics.b3TotalCost || 0).toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-[#667085] mt-0.5">CP QC 3M</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#2563EB]">0đ</p>
                    <p className="text-xs text-[#667085] mt-0.5">CP eSim</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).metrics.todayMessages ?? 0}</p>
                    <p className="text-xs text-[#667085] mt-0.5">Tổng Mess</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#D97706]">{Number((JSON.parse(historyDetail.data||'{}')).metrics.avgMessCost || 0).toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-[#667085] mt-0.5">Giá Mess TB</p>
                  </div>
                </div>
              </div>

              {/* Quảng cáo */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Quảng cáo</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#2563EB]">{Number((JSON.parse(historyDetail.data||'{}')).metrics.adsTotal || 0).toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-[#667085] mt-0.5">CP có thuế</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#16A34A]">{Number((JSON.parse(historyDetail.data||'{}')).metrics.adsRevenue || 0).toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-[#667085] mt-0.5">Doanh thu</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).metrics.adsOrders ?? 0}</p>
                    <p className="text-xs text-[#667085] mt-0.5">Đơn</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#7C3AED]">{(JSON.parse(historyDetail.data||'{}')).metrics.roas ?? "—"}x</p>
                    <p className="text-xs text-[#667085] mt-0.5">ROAS</p>
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Doanh thu SEO</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#16A34A]">{(JSON.parse(historyDetail.data||'{}')).metrics.seoOrders ?? 0}</p>
                    <p className="text-xs text-[#667085] mt-0.5">Đơn</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#16A34A]">{Number((JSON.parse(historyDetail.data||'{}')).metrics.seoRevenue || 0).toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-[#667085] mt-0.5">Doanh thu</p>
                  </div>
                </div>
              </div>

              {/* Content Social */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Content Social</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).metrics.socialPosts ?? 0}</p>
                    <p className="text-xs text-[#667085] mt-0.5">Bài viết</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).metrics.publishedPosts ?? 0}</p>
                    <p className="text-xs text-[#667085] mt-0.5">Đã đăng</p>
                  </div>
                </div>
              </div>

              {/* Recipients */}
              {(JSON.parse(historyDetail.data||'{}')).recipients?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2.5">Đã gửi đến</p>
                  <div className="flex flex-wrap gap-2">
                    {(JSON.parse(historyDetail.data||'{}')).recipients.map((rid:string) => (
                      <span key={rid} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F5F3FF] border border-[#C7D2FE] rounded-lg text-xs font-medium text-[#4F46E5]">{getUserName(rid)}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* DM: Installation Table */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-[#F5F3FF] border-b border-[#E5E7EB]">
                  <h4 className="text-sm font-semibold text-[#101828]">Bảng xác nhận hoàn thành lắp đặt</h4>
                </div>
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 text-center">
                      <p className="text-xs font-medium text-[#667085]">Hoàn thành</p>
                      <p className="text-xl font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).completedCount || 0}</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 text-center">
                      <p className="text-xs font-medium text-[#667085]">Chưa hoàn thành</p>
                      <p className="text-xl font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).uncompletedCount || 0}</p>
                    </div>
                  </div>
                  {(JSON.parse(historyDetail.data||'{}')).receivedDevices > 0 && (
                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 text-center">
                      <p className="text-xs font-medium text-[#667085]">Đã nhận thiết bị</p>
                      <p className="text-xl font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).receivedDevices}</p>
                    </div>
                  )}
                  {(JSON.parse(historyDetail.data||'{}')).commitChecked && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#EEF2FF] rounded-lg text-xs text-[#4F46E5]">
                      <span className="text-[#16A34A]">✓</span><span>Cam kết đã điền đầy đủ lý do</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DM: Customer Stats */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-[#F5F3FF] border-b border-[#E5E7EB]">
                  <h4 className="text-sm font-semibold text-[#101828]">Thống kê khách hàng</h4>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xs font-medium text-[#6366F1]">Manshon</p>
                      <p className="text-lg font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).khachManhSon || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-[#0891B2]">Family</p>
                      <p className="text-lg font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).khachFamily || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-[#16A34A]">Đ.ký lại</p>
                      <p className="text-lg font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).khachDangKyLai || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#475467]">Cố định</span>
                      <span className="text-sm font-bold text-[#4F46E5]">{((JSON.parse(historyDetail.data||'{}')).khachManhSon || 0) + ((JSON.parse(historyDetail.data||'{}')).khachFamily || 0) + ((JSON.parse(historyDetail.data||'{}')).khachDangKyLai || 0)}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-[#0891B2]">Cầm tay</p>
                      <p className="text-lg font-bold text-[#101828]">{(JSON.parse(historyDetail.data||'{}')).khachCamTay || 0}</p>
                    </div>
                  </div>
                  <div className="bg-[#F5F3FF] border border-[#C7D2FE] rounded-lg px-5 py-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#101828]">Tổng khách chốt</span>
                    <span className="text-xl font-bold text-[#4F46E5]">{((JSON.parse(historyDetail.data||'{}')).khachManhSon || 0) + ((JSON.parse(historyDetail.data||'{}')).khachFamily || 0) + ((JSON.parse(historyDetail.data||'{}')).khachDangKyLai || 0) + ((JSON.parse(historyDetail.data||'{}')).khachCamTay || 0)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}</div>
{/* AI Analysis Modal */}
      {showAnalysis && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAnalysis(false)}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()} style={{width:'min(92vw,1100px)',maxHeight:'90vh'}}>
            <div className="flex items-center justify-between px-7 bg-white border-b border-[#EAECF0]" style={{height:64}}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F4F3FF] flex items-center justify-center"><BarChart3 size={18} className="text-[#4F46E5]" /></div>
                <h2 className="text-lg font-semibold text-[#101828]">Phân tích báo cáo AI</h2>
              </div>
              <button onClick={() => setShowAnalysis(false)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F2F4F7] transition-all text-[#98A2B3]"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto px-7 py-6" style={{background:'#F8FAFC',maxHeight:'calc(90vh - 64px)'}}>
              {analysisResult === null ? (
                <div className="flex flex-col items-center gap-6 py-12">
                  <div className="w-full max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#101828]">{analysisStage || 'Đang xử lý...'}</span>
                      <span className="text-sm font-bold text-[#4F46E5]">{analysisProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EEF2FF] rounded-full overflow-hidden" style={{boxShadow:'inset 0 1px 2px rgba(0,0,0,0.06)'}}>
                      <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] rounded-full transition-all duration-500" style={{width: analysisProgress + '%'}}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#98A2B3] mt-1.5">
                      <span>Thu thập</span><span>Gửi AI</span><span>Phân tích</span><span>Hoàn tất</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#98A2B3]">Đang phân tích <b className="text-[#4F46E5]">{analysisCount || receivedReports.length}</b> báo cáo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* KPI Cards */}
                  <div className="grid gap-3" style={{gridTemplateColumns:'160px 160px minmax(260px,1fr)'}}>
                    <div className="bg-white rounded-xl p-4 border border-[#EAECF0]">
                      <p className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wide mb-1"><FileText size={14} className="inline mr-1 text-[#4F46E5]" />Báo cáo</p>
                      <p className="text-xl font-bold text-[#101828]">{analysisCount !== null ? analysisCount : receivedReports.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-[#EAECF0]">
                      <p className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wide mb-1"><Users size={14} className="inline mr-1 text-[#4F46E5]" />Nhân sự</p>
                      <p className="text-xl font-bold text-[#101828]">{analysisStats ? (analysisStats.pending + analysisStats.approved + analysisStats.rejected) : receivedReports.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-[#EAECF0]">
                      <p className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wide mb-1"><Calendar size={14} className="inline mr-1 text-[#4F46E5]" />Thời gian</p>
                      <p className="text-sm font-bold text-[#101828] mt-1">{analysisPeriod || (receivedDateRangeKey==='today' ? 'Hôm nay' : '7 ngày')}</p>
                    </div>
                  </div>

                  {analysisSummary && (<div>
                  <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-3">Tổng hợp dữ liệu</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#101828]">{analysisSummary.orders}</p>
                      <p className="text-xs text-[#667085] mt-0.5">Tổng đơn</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#2563EB]">{Number(analysisSummary.cost).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-[#667085] mt-0.5">Tổng chi phí</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#D97706]">{Number(analysisSummary.adsTotal).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-[#667085] mt-0.5">Chi phí QC</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#16A34A]">{Number(analysisSummary.adsRevenue).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-[#667085] mt-0.5">Doanh thu QC</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#7C3AED]">{analysisSummary.roas}x</p>
                      <p className="text-xs text-[#667085] mt-0.5">ROAS</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#101828]">{analysisSummary.messages}</p>
                      <p className="text-xs text-[#667085] mt-0.5">Tin nhắn</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#16A34A]">{analysisSummary.seoOrders}</p>
                      <p className="text-xs text-[#667085] mt-0.5">Đơn SEO</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#16A34A]">{Number(analysisSummary.seoRevenue).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-[#667085] mt-0.5">Doanh SEO</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#101828]">{analysisSummary.socialPosts} / {analysisSummary.publishedPosts}</p>
                      <p className="text-xs text-[#667085] mt-0.5">Bài viết / Đã đăng</p>
                    </div>
                  </div>
                </div>)}
                  {analysisHtml ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: analysisHtml}} /> : <p className="text-sm text-[#98A2B3]">—</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
{/* History List Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()} style={{width:'min(90vw,1000px)',maxHeight:'75vh'}}>
            <div className="flex items-center justify-between px-6" style={{height:64}}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F4F3FF] flex items-center justify-center text-[#4F46E5]"><Clock size={18} /></div>
                <h2 className="text-lg font-semibold text-[#101828]">Lịch sử phân tích AI</h2>
              </div>
              <button onClick={() => setShowHistory(false)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F2F4F7] transition-all text-[#98A2B3]"><X size={16} /></button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto" style={{borderTop:'1px solid #EAECF0'}}>
              {analysisHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-[#98A2B3]"><Clock size={24} className="opacity-40" /></div>
                  <p className="text-sm font-medium text-[#475467]">Chưa có lịch sử phân tích</p>
                  <p className="text-xs text-[#98A2B3]">Các lần phân tích AI sẽ xuất hiện tại đây</p>
                </div>
              ) : (
                <table className="w-full" style={{borderCollapse:'separate',borderSpacing:0,minWidth:820}}>
                  <colgroup>
                    <col style={{width:190}} /><col style={{width:140}} /><col style={{width:110}} /><col style={{flex:'1',minWidth:300}} /><col style={{width:80}} />
                  </colgroup>
                  <thead>
                    <tr style={{height:40,background:'#F8FAFC',borderBottom:'1px solid #EAECF0',position:'sticky',top:0,zIndex:2}}>
                      <th className="px-4 text-left font-semibold uppercase tracking-wider" style={{fontSize:11,lineHeight:'16px',color:'#667085',letterSpacing:'0.03em',whiteSpace:'nowrap'}}>Thời gian</th>
                      <th className="px-4 text-left font-semibold uppercase tracking-wider" style={{fontSize:11,lineHeight:'16px',color:'#667085',letterSpacing:'0.03em',whiteSpace:'nowrap'}}>Kỳ</th>
                      <th className="px-4 text-right font-semibold uppercase tracking-wider" style={{fontSize:11,lineHeight:'16px',color:'#667085',letterSpacing:'0.03em',whiteSpace:'nowrap'}}>Báo cáo</th>
                      <th className="px-4 text-left font-semibold uppercase tracking-wider" style={{fontSize:11,lineHeight:'16px',color:'#667085',letterSpacing:'0.03em',whiteSpace:'nowrap'}}>Tóm tắt</th>
                      <th style={{width:80}}></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F4F7]">
                    {analysisHistory.map((h: any) => (
                      <tr key={h.id} onClick={async () => { try { const d = await api('/reports/analysis-history/'+h.id); setViewingHistory(d); setShowHistoryDetail(true); } catch {}} } className="hover:bg-[#FAFBFC] cursor-pointer transition-all" style={{height:56}}>
                        <td className="px-4" style={{color:'#344054',fontSize:14,lineHeight:'18px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          <span style={{fontSize:14,fontWeight:500,color:'#101828'}}>{h.created_at ? new Date(h.created_at).toLocaleDateString('fr-CA',{timeZone:'Asia/Ho_Chi_Minh'}) : '—'}</span>
                          <span style={{fontSize:12,color:'#98A2B3',marginLeft:4}}>· {h.created_at ? new Date(h.created_at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'}) : ''}</span>
                        </td>
                        <td className="px-4"><span className="inline-flex items-center justify-center rounded-md px-2" style={{height:24,fontSize:12,fontWeight:500,background:'#F2F4F7',color:'#475467',whiteSpace:'nowrap'}}>{h.period_label || '—'}</span></td>
                        <td className="px-4 text-right" style={{color:'#475467',fontSize:13,fontWeight:500,whiteSpace:'nowrap'}}><FileText size={13} className="mr-1 text-[#98A2B3]" />{h.report_count}</td>
                        <td className="px-4" style={{color:'#475467',fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:0}} title={h.preview || ''}>{h.preview ? h.preview.replace(/[*_#]/g,'').slice(0,100) : '—'}</td>
                        <td className="px-4 text-center" style={{width:80}}><span className="text-[#98A2B3]" style={{fontSize:16}}>›</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
      {/* History Detail Modal */}
      {showHistoryDetail && viewingHistory && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowHistoryDetail(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0] bg-[#FAFBFC]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F4F3FF] flex items-center justify-center text-[#4F46E5]"><Clock size={18} /></div>
                <h2 className="text-base font-semibold text-[#101828]">Phân tích <span className="text-xs text-[#475467] font-normal">({viewingHistory.period_label || '—'} · {viewingHistory.report_count} báo cáo)</span></h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { if (typeof window !== 'undefined') window.print(); }} className="px-3 py-2 rounded-lg text-xs font-medium bg-[#F4F3FF] text-[#4F46E5] hover:bg-[#EDE9FE] transition-all"><Download size={14} /> PDF</button>
                <button onClick={() => setShowHistoryDetail(false)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F2F4F7] transition-all text-[#98A2B3]"><X size={16} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-[#F8FAFC] rounded-lg p-3" style={{border:'1px solid #EAECF0'}}>
                  <p className="text-xs text-[#98A2B3]">Báo cáo</p>
                  <p className="text-xl font-bold text-[#101828]">{viewingHistory.report_count}</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-lg p-3" style={{border:'1px solid #EAECF0'}}>
                  <p className="text-xs text-[#98A2B3]">Kỳ</p>
                  <p className="text-sm font-bold text-[#101828] mt-1.5">{viewingHistory.period_label || '—'}</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-lg p-3" style={{border:'1px solid #EAECF0'}}>
                  <p className="text-xs text-[#98A2B3]">Từ</p>
                  <p className="text-sm font-bold text-[#101828] mt-1.5">{viewingHistory.date_from || '—'}</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-lg p-3" style={{border:'1px solid #EAECF0'}}>
                  <p className="text-xs text-[#98A2B3]">Đến</p>
                  <p className="text-sm font-bold text-[#101828] mt-1.5">{viewingHistory.date_to || '—'}</p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: viewingHistory.summary_md
                .replace(/### (.+)/g, '<h3 class="text-sm font-bold text-[#101828] mt-4 mb-1.5">$1</h3>')
                .replace(/## (.+)/g, '<h2 class="text-base font-bold text-[#101828] mt-4 mb-1.5">$1</h2>')
                .replace(/# (.+)/g, '<h1 class="text-lg font-bold text-[#101828] mt-5 mb-2">$1</h1>')
                .replace(/^\s*- (.+)$/gm, '<li class="text-sm text-[#344054] leading-relaxed ml-3 ">$1</li>')
                .replace(/^\s*1\. (.+)$/gm, '<li class="text-sm text-[#344054] leading-relaxed ml-3 ">$1</li>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-[#101828]">$1</strong>')
                .replace(/_([^_]+)_/g, '<em>$1</em>')
                .replace(/\n\n/g, '<div class="h-1.5"></div>')
                .split('\n').filter((l:string)=>l.trim()).map((l:string)=>l.startsWith('<') ? l : '<p class="text-sm text-[#344054] leading-relaxed ">'+l+'</p>').join('')
              }} />
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

    </>
  );
}
