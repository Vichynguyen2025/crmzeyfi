import { useState, useEffect } from 'react';
import { Plus, X, Edit3, Trash2, Globe, ExternalLink, Users, User, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const PLATFORMS = ['Facebook', 'TikTok', 'Zalo', 'YouTube', 'Instagram', 'Website', 'Shopee', 'Lazada'];
const PLATFORM_COLORS: Record<string, string> = {
  Facebook: 'bg-blue-50 text-blue-600', TikTok: 'bg-gray-900 text-white',
  Zalo: 'bg-sky-50 text-sky-600', YouTube: 'bg-red-50 text-red-600',
  Instagram: 'bg-pink-50 text-pink-600', Website: 'bg-green-50 text-green-600',
  Shopee: 'bg-orange-50 text-orange-600', Lazada: 'bg-violet-50 text-violet-600',
};

export default function Channels() {
  const [channels, setChannels] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({ name:'', platform:'Facebook', url:'', teamId:'', assignedTo:'', notes:'' });
  const [toast, setToast] = useState<{type:'success'|'error', message:string} | null>(null);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({type, message});
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    const u = JSON.parse(localStorage.getItem('zeyfi_user')||'{}');
    if (u?.id) setCurrentUser(u);
    api('/channels').then(setChannels);
    api('/teams').then(setTeams);
    api('/users').then(setUsers).catch(() => {});
  };
  useEffect(load, []);

  // Realtime
  useEffect(() => {
    const sock = getSocket();
    const handler = () => {
      api('/channels').then(setChannels);
      api('/teams').then(setTeams);
    };
    sock.on('channel:update', handler);
    return () => { sock.off('channel:update', handler); };
  }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      if (edit) {
        await api('/channels/' + edit.id, { method:'PUT', body:JSON.stringify(form) });
        showToast('success', 'Đã cập nhật "' + form.name + '"');
      } else {
        await api('/channels', { method:'POST', body:JSON.stringify(form) });
        showToast('success', 'Đã thêm kênh "' + form.name + '"');
      }
      setShowAdd(false); setEdit(null);
      setForm({ name:'', platform:'Facebook', url:'', teamId:'', assignedTo:'', notes:'' });
      load();
    } catch { showToast('error', 'Lỗi lưu dữ liệu'); }
  };

  const deleteChannel = async (c: any) => {
    if (!confirm('Xoá kênh "' + c.name + '"?')) return;
    try {
      await api('/channels/' + c.id, { method:'DELETE' });
      showToast('success', 'Đã xoá "' + c.name + '"');
      load();
    } catch { showToast('error', 'Lỗi xoá'); }
  };

  const openEdit = (c: any) => {
    setEdit(c);
    setForm({ name: c.name, platform: c.platform, url: c.url || '', teamId: c.team_id || '', assignedTo: c.assigned_to || '', notes: c.notes || '' });
    setShowAdd(true);
  };

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
        <div><h1 className="text-2xl font-bold text-ink">Kênh Marketing</h1><p className="text-sm text-muted mt-1">Quản lý kênh truyền thông, phân công team & người phụ trách</p></div>
        <button onClick={() => { setEdit(null); setForm({name:'',platform:'Facebook',url:'',teamId:'',assignedTo:'',notes:''}); setShowAdd(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
          <Plus size={18} />Thêm kênh
        </button>
      </div>

      {(showAdd || edit) && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">{edit ? 'Sửa kênh' : 'Thêm kênh mới'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Tên kênh *</label>
              <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="VD: Fanpage Zeyfi" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Nền tảng</label>
              <select value={form.platform} onChange={e => setForm({...form,platform:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted mb-1.5 block">Đường dẫn (URL)</label>
              <input value={form.url} onChange={e => setForm({...form,url:e.target.value})} placeholder="https://facebook.com/zeyfi" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Team phụ trách</label>
              <div>
                <select value={form.teamId} onChange={e => setForm({...form,teamId:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25">
                  <option value="">Chọn team</option>
                  <option value="__none__">— Không thuộc team nào —</option>
                  {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button onClick={() => setShowNewTeam(true)} className="mt-1.5 text-xs text-primary font-medium hover:underline flex items-center gap-1"><Plus size={12} /> Tạo team mới</button>
                {showNewTeam && (
                  <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewTeam(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 border border-border" onClick={e => e.stopPropagation()}>
                      <h3 className="text-sm font-bold text-ink mb-3">Tạo team mới</h3>
                      <input value={newTeamName} onChange={e=>setNewTeamName(e.target.value)} placeholder="Nhập tên team..." className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 mb-3" onKeyDown={async e => { if (e.key === 'Enter' && newTeamName.trim()) { try { const r = await api('/teams', { method:'POST', body:JSON.stringify({name:newTeamName.trim(), channelOnly: true}) }); if (r?.id) { setNewTeamName(''); setShowNewTeam(false); load(); setForm(p=>({...p, teamId: r.id})); showToast('success', 'Đã tạo team'); } } catch { showToast('error', 'Lỗi tạo team'); } }}} />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowNewTeam(false)} className="px-4 py-2 text-sm font-medium text-muted hover:text-ink transition-all">Huỷ</button>
                        <button onClick={async () => { if (!newTeamName.trim()) return; try { const r = await api('/teams', { method:'POST', body:JSON.stringify({name:newTeamName.trim(), channelOnly: true}) }); if (r?.id) { setNewTeamName(''); setShowNewTeam(false); load(); setForm(p=>({...p, teamId: r.id})); showToast('success', 'Đã tạo team'); } } catch { showToast('error', 'Lỗi tạo team'); } }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-[#4338ca] transition-all">Tạo</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Người phụ trách</label>
              <select value={form.assignedTo} onChange={e => setForm({...form,assignedTo:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25">
                <option value="">Chọn người phụ trách</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted mb-1.5 block">Ghi chú</label>
              <textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Thông tin thêm..." rows={2} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:shadow-md transition-all">{edit ? 'Lưu thay đổi' : 'Thêm kênh'}</button>
            <button onClick={() => { setShowAdd(false); setEdit(null); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium transition-all">Huỷ</button>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-border bg-white" style={{boxShadow:'rgba(0,0,0,0.04) 0px 1px 2px'}}>
        <div className="px-4 py-3 border-b border-border bg-[#fafafa] flex items-center gap-3 flex-wrap">
          <input value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="Tìm tên kênh..." className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-ink outline-none w-48 transition-all focus:border-[#4f46e5]/40" />
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-ink outline-none cursor-pointer">
            <option value="">Tất cả nền tảng</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-ink outline-none cursor-pointer">
            <option value="">Tất cả nhân sự</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <span className="text-xs text-muted ml-auto">{(channels.filter(c => (!filterName || c.name.toLowerCase().includes(filterName.toLowerCase())) && (!filterPlatform || c.platform === filterPlatform) && (!filterUser || c.assigned_to === filterUser))).length} kênh</span>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-left">Kênh</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-left">Nền tảng</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-left">Team</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-left">Người phụ trách</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {(channels.filter(c => (!filterName || c.name.toLowerCase().includes(filterName.toLowerCase())) && (!filterPlatform || c.platform === filterPlatform) && (!filterUser || c.assigned_to === filterUser))).map(c => (
              <tr key={c.id} className="hover:bg-[#f8f9fc] transition-all">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={'w-8 h-8 rounded-lg grid place-items-center text-xs font-bold shrink-0 ' + (PLATFORM_COLORS[c.platform] || 'bg-gray-100')}>
                      {c.platform?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{c.name}</p>
                      {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-primary flex items-center gap-1 mt-0.5"><ExternalLink size={10} />{c.url}</a>}
                      {c.notes && <p className="text-xs text-muted mt-0.5 max-w-[200px] truncate">{c.notes}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={'inline-flex px-2.5 py-1 rounded-full text-xs font-medium ' + (PLATFORM_COLORS[c.platform] || 'bg-gray-100 text-gray-600')}>{c.platform}</span>
                </td>
                <td className="px-4 py-3.5 text-sm text-muted">{c.teamName || '—'}</td>
                <td className="px-4 py-3.5">
                  {c.assignedToName ? <span className="text-sm text-ink">{c.assignedToName}</span> : <span className="text-sm text-[#d4d4d4]">—</span>}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-muted hover:text-blue-500 transition-all" title="Sửa"><Edit3 size={14} /></button>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && <button onClick={() => deleteChannel(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xoá"><Trash2 size={14} /></button>}
                </td>
              </tr>
            ))}
            {(channels.filter(c => (!filterName || c.name.toLowerCase().includes(filterName.toLowerCase())) && (!filterPlatform || c.platform === filterPlatform) && (!filterUser || c.assigned_to === filterUser))).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-16 text-center">
                <Globe size={40} className="mx-auto mb-2 text-[#d4d4d4]" />
                <p className="text-sm text-muted">Không tìm thấy kênh nào</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}