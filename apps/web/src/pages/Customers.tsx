import { useState, useEffect } from 'react';
import { Plus, Phone, Mail, MapPin, Globe, FileText, MessageCircle, PhoneCall, Tag, Search, Filter, X, ChevronDown, ChevronUp, Clock, User, Users, Edit3, Trash2, CheckCircle, AlertCircle, Calendar, Facebook, MessageSquare, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const STATUSES = [
  { key: 'new', label: 'Mới', color: 'bg-blue-50 text-blue-600' },
  { key: 'contacted', label: 'Đang chăm sóc', color: 'bg-amber-50 text-amber-600' },
  { key: 'qualified', label: 'Tiềm năng', color: 'bg-green-50 text-green-600' },
  { key: 'converted', label: 'Chốt', color: 'bg-purple-50 text-purple-600' },
  { key: 'lost', label: 'Hẹn lại', color: 'bg-gray-100 text-gray-500' },
];

const SOURCES = ['Facebook', 'Zalo', 'Website', 'Giới thiệu', 'Quảng cáo', 'TikTok', 'Tự đến'];
const TAG_COLORS: Record<string, string> = {
  'VIP': 'bg-purple-50 text-purple-600 ring-1 ring-purple-200',
  'Nóng': 'bg-red-50 text-red-600 ring-1 ring-red-200',
  'Tiềm năng': 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
  'Cũ': 'bg-gray-50 text-gray-500 ring-1 ring-gray-200',
  'Mới': 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  'Hẹn lại': 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
};

const TAGS = ['VIP', 'Nóng', 'Tiềm năng', 'Cũ', 'Mới', 'Hẹn lại'];

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [toast, setToast] = useState<{type:'success'|'error', message:string} | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [fullDetail, setFullDetail] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [editForm, setEditForm] = useState<any>({});
  const [newInteraction, setNewInteraction] = useState('');

  const showToast = (type: 'success'|'error', msg: string) => {
    setToast({type, message: msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setCurrentUser(JSON.parse(localStorage.getItem('zeyfi_user')||'{}'));
    let url = '/customers?';
    if (search) url += '&search=' + encodeURIComponent(search);
    if (filterStatus) url += '&status=' + filterStatus;
    if (filterSource) url += '&source=' + filterSource;
    if (filterAssignee) url += '&assigneeId=' + filterAssignee;
    api(url).then(setCustomers).catch(() => {});
    api('/users').then(setUsers).catch(() => {});
  };

  useEffect(() => { load(); }, [search, filterStatus, filterSource, filterAssignee]);

  useEffect(() => {
    const sock = getSocket();
    sock.on('customer:new', load);
    sock.on('customer:updated', load);
    sock.on('customer:deleted', load);
    sock.on('customer:interaction', (d: any) => { if (detail?.id === d.customerId) loadDetail(detail.id); });
    return () => { sock.off('customer:new', load); sock.off('customer:updated', load); sock.off('customer:deleted', load); };
  }, [detail]);

  const loadDetail = async (id: string) => {
    try {
      const d = await api('/customers/' + id);
      setFullDetail(d);
      setInteractions(d.interactions || []);
      setEditForm({ name: d.name, phone: d.phone || '', email: d.email || '', birthday: d.birthday || '', address: d.address || '', source: d.source || '', social: d.social || '', facebook: d.facebook || '', zalo: d.zalo || '', tiktok: d.tiktok || '', notes: d.notes || '', tags: d.tags || '', status: d.status || 'new', teamId: d.team_id || '', assigneeId: d.assignee_id || '', contactCount: d.contact_count || 0, lastContact: d.last_contact || '', lastContactNote: d.last_contact_note || '' });
    } catch { showToast('error', 'Lỗi tải chi tiết'); }
  };

  const createCustomer = async () => {
    if (!editForm.name?.trim()) { showToast('error', 'Nhập tên khách hàng'); return; }
    try {
      await api('/customers', { method:'POST', body:JSON.stringify(editForm) });
      setShowAdd(false);
      setEditForm({});
      showToast('success', 'Đã thêm khách hàng');
      load();
    } catch { showToast('error', 'Lỗi thêm'); }
  };

  const updateCustomer = async () => {
    try {
      await api('/customers/' + detail.id, { method:'PUT', body:JSON.stringify(editForm) });
      showToast('success', 'Đã cập nhật');
      setDetail(null);
      load();
    } catch { showToast('error', 'Lỗi cập nhật'); }
  };

  const deleteCustomer = async (id: string, name: string) => {
    if (!confirm('Xoá khách hàng "' + name + '"?')) return;
    try {
      await api('/customers/' + id, { method:'DELETE' });
      showToast('success', 'Đã xoá');
      load();
    } catch { showToast('error', 'Lỗi xoá'); }
  };

  const addInteraction = async () => {
    if (!newInteraction.trim()) return;
    try {
      await api('/customers/' + detail.id + '/interactions', { method:'POST', body:JSON.stringify({ type: 'note', content: newInteraction }) });
      setNewInteraction('');
      await loadDetail(detail.id);
      showToast('success', 'Đã thêm tương tác');
    } catch { showToast('error', 'Lỗi thêm tương tác'); }
  };

  const openDetail = async (c: any) => {
    setDetail(c);
    await loadDetail(c.id);
  };

  const statusBadge = (status: string) => {
    const s = STATUSES.find((s: any) => s.key === status);
    return <span className={'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ' + (s?.color || 'bg-gray-100')}>{s?.label || status}</span>;
  };

  const changeStatus = async (cid: string, status: string) => {
    try {
      await api('/customers/' + cid, { method:'PUT', body:JSON.stringify({ status }) });
      showToast('success', '\u0110\u00e3 c\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i');
      load();
    } catch { showToast('error', 'L\u1ed7i c\u1eadp nh\u1eadt'); }
  };

  const fmt = (d: any) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

  return (
    <div className="space-y-6">
      {toast && (
        <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}{toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink">Khách hàng</h1><p className="text-sm text-muted mt-1">Quản lý danh sách khách hàng và chăm sóc</p></div>
        <button onClick={() => { setEditForm({}); setShowAdd(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all"><Plus size={18} />Thêm khách hàng</button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, SĐT, email..." className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer"><option value="">Tất cả trạng thái</option>{STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer"><option value="">Tất cả nguồn</option>{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="px-3 py-2 bg-white border border-border rounded-xl text-xs outline-none cursor-pointer"><option value="">Tất cả nhân sự</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <span className="text-xs text-muted">{customers.length} khách hàng</span>
      </div>

      {/* Customer table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{boxShadow:'rgba(0,0,0,0.04) 0px 1px 2px'}}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-[#fafafa]">
              <th className="px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider text-left">Khách hàng</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider text-left">SĐT</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider text-left">Tags</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider text-left">Nguồn</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider text-left">Người PT</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider text-left">Trạng thái</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider text-right">Lần cuối</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider text-right">Tương tác</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {customers.length === 0 && <tr><td colSpan={9} className="px-5 py-16 text-center text-sm text-muted">Chưa có khách hàng</td></tr>}
            {customers.map((c: any) => (
              <tr key={c.id} onClick={() => openDetail(c)} className="hover:bg-[#f8f9fc] transition-all cursor-pointer">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">{c.name?.charAt(0) || '?'}</div>
                    <div>
                      <p className="text-sm font-medium text-ink">{c.name}</p>
                      {c.email && <p className="text-xs text-muted">{c.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-muted">{c.phone || '—'}</td>
                <td className="px-5 py-3.5">{c.tags ? <div className="flex flex-wrap gap-1">{c.tags.split(',').map((t:string)=><span key={t} className={'px-2 py-0.5 text-xs font-medium rounded-md '+(TAG_COLORS[t]||'bg-gray-100 text-muted')}>{t}</span>)}</div> : <span className="text-xs text-muted">—</span>}</td>
                <td className="px-5 py-3.5"><span className="text-xs text-muted">{c.source || '—'}</span></td>
                <td className="px-5 py-3.5 text-xs text-muted">{c.assigneeName || '—'}</td>
                <td className="px-5 py-3.5"><select value={c.status||'new'} onChange={e=>{e.stopPropagation();changeStatus(c.id,e.target.value)}} className={'text-xs font-medium rounded-full px-2 py-1 border-0 outline-none cursor-pointer '+(STATUSES.find((s:any)=>s.key===(c.status||'new'))?.color||'bg-gray-100')} onClick={e=>e.stopPropagation()}>{STATUSES.map((s:any)=><option key={s.key} value={s.key}>{s.label}</option>)}</select></td>
                <td className="px-5 py-3.5 text-right text-xs text-muted">{c.last_contact ? new Date(c.last_contact).toLocaleDateString('vi-VN') : '—'}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-xs font-medium text-muted">{c.interactionCount || c.contact_count || 0}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={e => { e.stopPropagation(); openDetail(c); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-muted hover:text-blue-500 transition-all" title="Chi tiết"><Edit3 size={14} /></button>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.id === c.assignee_id) && <button onClick={e => { e.stopPropagation(); deleteCustomer(c.id, c.name); }} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xoá"><Trash2 size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border overflow-hidden max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-border bg-gray-50/60 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-sm text-ink">Thêm khách hàng</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-gray-200 text-muted"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-xs font-medium text-muted mb-1 block">Tên *</label><input value={editForm.name||''} onChange={e=>setEditForm({...editForm,name:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="Nhập tên" /></div>
                <div><label className="text-xs font-medium text-muted mb-1 block">SĐT</label><input value={editForm.phone||''} onChange={e=>setEditForm({...editForm,phone:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="090..." /></div>
                <div><label className="text-xs font-medium text-muted mb-1 block">Email</label><input value={editForm.email||''} onChange={e=>setEditForm({...editForm,email:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" placeholder="email@example.com" /></div>
                <div><label className="text-xs font-medium text-muted mb-1 block">Ngày sinh</label><input type="date" value={editForm.birthday||''} onChange={e=>setEditForm({...editForm,birthday:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div><label className="text-xs font-medium text-muted mb-1 block">Nguồn</label><select value={editForm.source||''} onChange={e=>setEditForm({...editForm,source:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none cursor-pointer"><option value="">—</option>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted mb-1 block">Địa chỉ</label><input value={editForm.address||''} onChange={e=>setEditForm({...editForm,address:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div><label className="text-xs font-medium text-muted mb-1 block">Facebook</label><input value={editForm.facebook||''} onChange={e=>setEditForm({...editForm,facebook:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div><label className="text-xs font-medium text-muted mb-1 block">Zalo</label><input value={editForm.zalo||''} onChange={e=>setEditForm({...editForm,zalo:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div><label className="text-xs font-medium text-muted mb-1 block">TikTok</label><input value={editForm.tiktok||''} onChange={e=>setEditForm({...editForm,tiktok:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" /></div>
                <div><label className="text-xs font-medium text-muted mb-1 block">Trạng thái</label><select value={editForm.status||'new'} onChange={e=>setEditForm({...editForm,status:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none cursor-pointer">{STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted mb-1 block">Tags</label><div className="flex flex-wrap gap-1.5">{TAGS.map(t=>{const active=(editForm.tags||'').includes(t);return <button key={t} onClick={()=>{const ts=(editForm.tags||'').split(',').filter(Boolean);const has=ts.includes(t);setEditForm({...editForm,tags:has?ts.filter(x=>x!==t).join(','):[...ts,t].join(',')})}} className={'px-3 py-1 rounded-lg text-xs font-medium transition-all '+(active?'bg-primary text-white':(TAG_COLORS[t]||'bg-gray-100 text-muted hover:bg-gray-200'))}>{t}</button>})}</div></div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted mb-1 block">Ghi chú</label><textarea value={editForm.notes||''} onChange={e=>setEditForm({...editForm,notes:e.target.value})} rows={3} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 resize-none" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium transition-all">Huỷ</button>
                <button onClick={createCustomer} className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all">Thêm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal — Pancake-style */}
      {detail && fullDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-border overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-sm font-bold">{fullDetail.name?.charAt(0) || '?'}</div>
                <div>
                  <h3 className="font-bold text-ink">{fullDetail.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted">{statusBadge(fullDetail.status)}{fullDetail.source && <span>· {fullDetail.source}</span>}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={updateCustomer} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-[#4338ca] transition-all">Lưu</button>
                <button onClick={() => setDetail(null)} className="p-2 rounded-lg hover:bg-gray-200 text-muted transition-all"><X size={16} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thông tin cơ bản */}
                <div className="bg-[#fafafa] rounded-xl border border-border p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Thông tin liên hệ</p>
                  <div className="space-y-2.5">
                    <div><p className="text-xs text-muted">Số điện thoại</p><p className="text-sm">{fullDetail.phone || '—'}</p></div>
                    <div><p className="text-xs text-muted">Email</p><p className="text-sm">{fullDetail.email || '—'}</p></div>
                    <div><p className="text-xs text-muted">Ngày sinh</p><p className="text-sm">{fmt(fullDetail.birthday) || '—'}</p></div>
                    <div><p className="text-xs text-muted">Địa chỉ</p><p className="text-sm">{fullDetail.address || '—'}</p></div>
                  </div>
                </div>

                {/* Mạng xã hội */}
                <div className="bg-[#fafafa] rounded-xl border border-border p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Mạng xã hội</p>
                  <div className="space-y-2.5">
                    <div><p className="text-xs text-muted">Facebook</p><p className="text-sm">{fullDetail.facebook || '—'}</p></div>
                    <div><p className="text-xs text-muted">Zalo</p><p className="text-sm">{fullDetail.zalo || '—'}</p></div>
                    <div><p className="text-xs text-muted">TikTok</p><p className="text-sm">{fullDetail.tiktok || '—'}</p></div>
                    <div><p className="text-xs text-muted">Social khác</p><p className="text-sm">{fullDetail.social || '—'}</p></div>
                  </div>
                </div>
              </div>

              {/* Tags & Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TAGS.map(t => {
                      const active = (editForm.tags||'').includes(t);
                      return <button key={t} onClick={()=>{const ts=(editForm.tags||'').split(',').filter(Boolean);const has=ts.includes(t);setEditForm({...editForm,tags:has?ts.filter(x=>x!==t).join(','):[...ts,t].join(',')})}} className={'px-3 py-1 rounded-lg text-xs font-medium transition-all '+(active?'bg-primary text-white':(TAG_COLORS[t]||'bg-gray-100 text-muted hover:bg-gray-200'))}>{t}</button>;
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Người phụ trách</p>
                  <select value={editForm.assigneeId||''} onChange={e=>setEditForm({...editForm,assigneeId:e.target.value})} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none cursor-pointer"><option value="">—</option>{users.map((u:any)=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Ghi chú</p>
                <textarea value={editForm.notes||''} onChange={e=>setEditForm({...editForm,notes:e.target.value})} rows={2} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 resize-none" />
              </div>

              {/* Lịch sử tương tác */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Lịch sử tương tác ({interactions.length})</p>
                </div>
                <div className="space-y-2.5 max-h-48 overflow-y-auto mb-3">
                  {interactions.length === 0 && <p className="text-sm text-muted py-2">Chưa có tương tác nào</p>}
                  {interactions.map((i: any) => (
                    <div key={i.id} className="flex items-start gap-3 p-3 bg-[#fafafa] border border-border rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">{i.userName?.charAt(0) || '?'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-ink">{i.userName}</span>
                          <span className="text-xs text-muted">{new Date(i.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                        <p className="text-sm text-[#4d4d4d]">{i.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newInteraction} onChange={e=>setNewInteraction(e.target.value)} placeholder="Nhập nội dung tương tác..." className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25"
                    onKeyDown={e => { if (e.key === 'Enter') addInteraction(); }} />
                  <button onClick={addInteraction} disabled={!newInteraction.trim()} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-[#4338ca] transition-all disabled:opacity-50">Gửi</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}