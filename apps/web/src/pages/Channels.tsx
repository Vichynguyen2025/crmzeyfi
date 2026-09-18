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

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({type, message});
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
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
        <div><h1 className="text-2xl font-bold text-[#171717]">Kênh Marketing</h1><p className="text-sm text-muted mt-1">Quản lý kênh truyền thông, phân công team & người phụ trách</p></div>
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
              <select value={form.teamId} onChange={e => setForm({...form,teamId:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25">
                <option value="">Chọn team</option>
                {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {channels.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-border shadow-sm p-5 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={'w-10 h-10 rounded-xl grid place-items-center text-xs font-bold ' + (PLATFORM_COLORS[c.platform] || 'bg-gray-100')}>
                  {c.platform?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-semibold text-[#171717]">{c.name}</h3>
                  <span className={'px-2.5 py-0.5 rounded-full text-xs font-medium ' + (PLATFORM_COLORS[c.platform] || 'bg-gray-100')}>
                    {c.platform}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-all" title="Sửa"><Edit3 size={14} /></button>
                <button onClick={() => deleteChannel(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-all" title="Xoá"><Trash2 size={14} /></button>
              </div>
            </div>

            {c.url && (
              <a href={c.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#4f46e5] hover:underline mb-3">
                <ExternalLink size={12} />{c.url.replace('https://', '').replace('http://', '').slice(0, 45)}
              </a>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted pt-3 border-t border-border">
              {c.teamName ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-[#4f46e5] rounded-lg"><Users size={12} />{c.teamName}</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-muted rounded-lg"><Users size={12} />Chưa phân team</span>
              )}
              {c.assignedToName ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-lg"><User size={12} />{c.assignedToName}</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-muted rounded-lg"><User size={12} />Chưa phân người</span>
              )}
            </div>
            {c.notes && <p className="text-xs text-muted mt-2 italic">{c.notes}</p>}
          </div>
        ))}
        {channels.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted">
            <Globe size={56} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Chưa có kênh Marketing</p>
            <p className="text-sm mt-1">Thêm kênh Facebook, TikTok, Zalo,... để quản lý</p>
          </div>
        )}
      </div>
    </div>
  );
}