import { useState, useEffect } from 'react';
import { Plus, X, Edit3, Trash2, Globe, ExternalLink, Users, User } from 'lucide-react';
import { api } from '../lib/api';

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
  const [showAdd, setShowAdd] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({ name:'', platform:'Facebook', url:'', teamId:'', assignedTo:'', notes:'' });

  const load = () => { api('/channels').then(setChannels); api('/teams').then(setTeams); };
  useEffect(load, []);

  const save = async () => {
    if (!form.name.trim()) return;
    if (edit) {
      await api('/channels/' + edit.id, { method:'PUT', body:JSON.stringify(form) });
    } else {
      await api('/channels', { method:'POST', body:JSON.stringify(form) });
    }
    setShowAdd(false); setEdit(null);
    setForm({ name:'', platform:'Facebook', url:'', teamId:'', assignedTo:'', notes:'' });
    load();
  };

  const deleteChannel = async (id: string) => {
    if (!confirm('Xoá kênh này?')) return;
    await api('/channels/' + id, { method:'DELETE' });
    load();
  };

  const openEdit = (c: any) => {
    setEdit(c);
    setForm({ name: c.name, platform: c.platform, url: c.url || '', teamId: c.team_id || '', assignedTo: c.assigned_to || '', notes: c.notes || '' });
    setShowAdd(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#171717]">Kênh truyền thông</h1><p className="text-sm text-muted mt-1">Quản lý các kênh truyền thông, phân công team phụ trách</p></div>
        <button onClick={() => { setEdit(null); setForm({name:'',platform:'Facebook',url:'',teamId:'',assignedTo:'',notes:''}); setShowAdd(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
          <Plus size={18} />Thêm kênh
        </button>
      </div>

      {(showAdd || edit) && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">{edit ? 'Sửa kênh' : 'Thêm kênh mới'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Tên kênh *" className="px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] transition-all cursor-pointer" />
            <select value={form.platform} onChange={e => setForm({...form,platform:e.target.value})} className="px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] transition-all cursor-pointer">
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="md:col-span-2">
              <input value={form.url} onChange={e => setForm({...form,url:e.target.value})} placeholder="Đường dẫn (URL)" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] transition-all cursor-pointer" />
            </div>
            <select value={form.teamId} onChange={e => setForm({...form,teamId:e.target.value})} className="px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] transition-all cursor-pointer">
              <option value="">Chọn team phụ trách</option>
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input value={form.assignedTo} onChange={e => setForm({...form,assignedTo:e.target.value})} placeholder="Người phụ trách (email)" className="px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] transition-all cursor-pointer" />
            <div className="md:col-span-2">
              <input value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Ghi chú" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] transition-all cursor-pointer" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:shadow-md">{edit ? 'Lưu thay đổi' : 'Thêm kênh'}</button>
            <button onClick={() => { setShowAdd(false); setEdit(null); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium">Huỷ</button>
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
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit3 size={14} /></button>
                <button onClick={() => deleteChannel(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>

            {c.url && (
              <a href={c.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#4f46e5] hover:underline mb-2">
                <ExternalLink size={12} />{c.url.replace('https://', '').slice(0, 40)}
              </a>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted mt-2 pt-3 border-t border-border">
              {c.teamName && <span className="flex items-center gap-1"><Users size={12} />{c.teamName}</span>}
              {c.assignedToName && <span className="flex items-center gap-1"><User size={12} />{c.assignedToName}</span>}
            </div>
            {c.notes && <p className="text-xs text-muted mt-2 italic">{c.notes}</p>}
          </div>
        ))}
        {channels.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted">
            <Globe size={48} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có kênh truyền thông nào. Thêm kênh mới để bắt đầu.</p>
          </div>
        )}
      </div>
    </div>
  );
}