import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, X, Image, Film, Link2, FileText, Loader2 } from 'lucide-react';

const FORMATS = ['Photo', 'Video', 'Bài web'];
const PILLARS = ['Trust', 'Branding', 'Product', 'Social Proof', 'Education', 'Sales'];
const STATUS = [
  { key: 'pending', label: 'Dự kiến', color: 'bg-amber-50 text-amber-700' },
  { key: 'approved', label: 'Đã duyệt', color: 'bg-blue-50 text-blue-700' },
  { key: 'posted', label: 'Đã đăng', color: 'bg-green-50 text-green-700' },
  { key: 'hold', label: 'Hoãn', color: 'bg-gray-100 text-gray-600' },
  { key: 'cancelled', label: 'Huỷ', color: 'bg-red-50 text-red-600' },
];

const formatIcon = (fmt: string) => {
  if (fmt === 'Video') return <Film size={14} />;
  if (fmt === 'Bài web') return <FileText size={14} />;
  return <Image size={14} />;
};

export default function Marketing3MFanpage() {
  const [rows, setRows] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<any>(null); // null | {id?: string}
  const [form, setForm] = useState<any>({});
  const [toast, setToast] = useState<{type:'success'|'error', msg:string}|null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zeyfi_user')||'{}') : {};

  const showMsg = (type: 'success'|'error', msg: string) => {
    setToast({type, msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    try {
      const d = await api('/marketing-3m/fanpage');
      setRows(d || []);
      const ch = await api('/channels');
      setChannels(ch || []);
      const dv = await api('/drive');
      setDriveFiles(dv || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ day: new Date().toLocaleDateString('fr-CA',{timeZone:'Asia/Ho_Chi_Minh'}), time: '', format: 'Photo', channel_id: '', pillar: '', key_message: '', content_text: '', media_url: '', media_name: '', status: 'pending', completion_link: '' });
    setShowModal({});
  };

  const openEdit = (r: any) => {
    setForm({
      day: r.day ? r.day.slice(0,10) : '',
      time: r.time || '',
      format: r.format || 'Photo',
      channel_id: r.channel_id || '',
      pillar: r.pillar || '',
      key_message: r.key_message || '',
      content_text: r.content_text || '',
      media_url: r.media_url || '',
      media_name: r.media_name || '',
      status: r.status || 'pending',
      completion_link: r.completion_link || '',
    });
    setShowModal({ id: r.id });
  };

  const save = async () => {
    if (!form.day) { showMsg('error', 'Vui lòng nhập ngày'); return; }
    setLoading(true);
    try {
      if (showModal?.id) {
        await api('/marketing-3m/fanpage/' + showModal.id, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/marketing-3m/fanpage', { method: 'POST', body: JSON.stringify(form) });
      }
      showMsg('success', showModal?.id ? 'Đã cập nhật' : 'Đã thêm nội dung');
      setShowModal(null);
      load();
    } catch (e: any) { showMsg('error', e?.message || 'Lỗi lưu'); }
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm('Xoá nội dung này?')) return;
    try { await api('/marketing-3m/fanpage/' + id, { method: 'DELETE' }); showMsg('success', 'Đã xoá'); load(); } catch {}
  };

  const pickMedia = (f: any) => {
    setForm((p: any) => ({ ...p, media_url: f.url || f.path || '', media_name: f.name || f.original_name || '' }));
    setShowMediaPicker(false);
  };

  const inputCls = 'w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-sm text-[#1F2937] bg-white outline-none transition-all focus:border-[#4f46e5]/50';
  const labelCls = 'text-xs font-medium text-[#667085] mb-1 block';

  const statusLabel = (k: string) => STATUS.find(s => s.key === k)?.label || k;
  const statusColor = (k: string) => STATUS.find(s => s.key === k)?.color || 'bg-gray-100 text-gray-600';

  // Grid: STT | NGÀY | GIỜ | Format | Kênh | Pillar | Key message | Content text | Link media | Tình trạng | Link bài hoàn thiện
  const GRID = '48px 100px 70px 90px 120px 110px minmax(180px,1.2fr) minmax(200px,1.5fr) 130px 110px 150px 56px';

  return (
    <div className="mt-4">
      {toast && (
        <div className={'fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium ' + (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>{toast.msg}</div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[#667085]">Kế hoạch nội dung Fanpage — click vào bất kỳ dòng nào để xem/sửa chi tiết</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 h-9 bg-[#4f46e5] text-white rounded-lg text-sm font-semibold hover:bg-[#4338ca] transition-all">
          <Plus size={15} />Thêm nội dung
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[12px] border border-[#E5E7EB] shadow-sm bg-white">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <colgroup>{[48,100,70,90,120,110,null,null,130,110,150,56].map((w,i) => <col key={i} style={{width: w ? w+'px' : 'auto'}} />)}</colgroup>
          <thead>
            <tr className="bg-[#F8FAFC]" style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-center whitespace-nowrap">STT</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">NGÀY</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">GIỜ</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">Format</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">Kênh</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">Pillar</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">Key message</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">Content text</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">Link media</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">Tình trạng</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-left whitespace-nowrap">Link bài hoàn thiện</th>
              <th className="px-3 py-3 text-[13px] font-semibold text-[#667085] text-center whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={12} className="px-6 py-12 text-center text-sm text-[#667085]">Chưa có nội dung fanpage — bấm "Thêm nội dung"</td></tr>
            )}
            {rows.map((r: any, idx: number) => (
              <tr key={r.id} onClick={() => openEdit(r)} className="hover:bg-[#F8FAFC] transition-all cursor-pointer"
                style={{ display: 'grid', gridTemplateColumns: GRID, borderBottom: '1px solid #E5E7EB', alignItems: 'center' }}>
                <td className="px-3 py-[11px] text-center text-sm text-[#667085]">{idx + 1}</td>
                <td className="px-3 py-[11px] text-sm text-[#1F2937] whitespace-nowrap">{r.day ? r.day.slice(0,10).split("-").reverse().join("/") : '—'}</td>
                <td className="px-3 py-[11px] text-sm text-[#1F2937]">{r.time || '—'}</td>
                <td className="px-3 py-[11px]">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#EEF2FF] text-[#4f46e5] rounded-md text-xs font-medium">{formatIcon(r.format)}{r.format || '—'}</span>
                </td>
                <td className="px-3 py-[11px] text-sm text-[#1F2937]">{r.channelName || r.channel_id || '—'}</td>
                <td className="px-3 py-[11px]">
                  <span className="inline-flex px-2 py-1 bg-[#F0FDF4] text-[#16A34A] rounded-md text-xs font-medium">{r.pillar || '—'}</span>
                </td>
                <td className="px-3 py-[11px] text-sm text-[#1F2937] truncate max-w-[180px]" title={r.key_message}>{r.key_message || '—'}</td>
                <td className="px-3 py-[11px] text-sm text-[#667085] truncate max-w-[200px]" title={r.content_text}>{r.content_text || '—'}</td>
                <td className="px-3 py-[11px]">
                  {r.media_name ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[#4f46e5]"><Link2 size={12} />{String(r.media_name).slice(0,20)}{String(r.media_name).length > 20 ? '…' : ''}</span>
                  ) : <span className="text-[#98A2B3] text-sm">—</span>}
                </td>
                <td className="px-3 py-[11px]">
                  <span className={'inline-flex px-2.5 py-1 rounded-full text-xs font-medium ' + statusColor(r.status)}>{statusLabel(r.status)}</span>
                </td>
                <td className="px-3 py-[11px]">
                  {r.completion_link ? <a href={r.completion_link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-[#4f46e5] hover:underline truncate block max-w-[140px]">Link bài</a> : <span className="text-[#98A2B3] text-sm">—</span>}
                </td>
                <td className="px-3 py-[11px] text-center">
                  <button onClick={e => { e.stopPropagation(); del(r.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-[#98A2B3] hover:text-red-500 transition-all" title="Xoá"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#1F2937]">{showModal.id ? 'Chi tiết nội dung' : 'Thêm nội dung mới'}</h3>
              <button onClick={() => setShowModal(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-all"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>NGÀY *</label>
                  <input type="date" value={form.day || ''} onChange={e => setForm({...form, day: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>GIỜ</label>
                  <input type="time" value={form.time || ''} onChange={e => setForm({...form, time: e.target.value})} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Format</label>
                  <select value={form.format || 'Photo'} onChange={e => setForm({...form, format: e.target.value})} className={inputCls}>
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Kênh</label>
                  <select value={form.channel_id || ''} onChange={e => setForm({...form, channel_id: e.target.value})} className={inputCls}>
                    <option value="">Chọn kênh...</option>
                    {channels.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Pillar</label>
                <select value={form.pillar || ''} onChange={e => setForm({...form, pillar: e.target.value})} className={inputCls}>
                  <option value="">Chọn pillar...</option>
                  {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Key message</label>
                <input value={form.key_message || ''} onChange={e => setForm({...form, key_message: e.target.value})} placeholder="Thông điệp chính" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Content text</label>
                <textarea value={form.content_text || ''} onChange={e => setForm({...form, content_text: e.target.value})} rows={4} placeholder="Nội dung bài viết..." className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] bg-white outline-none transition-all focus:border-[#4f46e5]/50 resize-none" />
              </div>
              <div>
                <label className={labelCls}>Link media</label>
                <div className="flex gap-2">
                  <input readOnly value={form.media_name || ''} placeholder="Chọn media từ Kho dữ liệu" className={inputCls + ' cursor-pointer'} onClick={() => setShowMediaPicker(true)} />
                  {form.media_name && <button onClick={() => setForm({...form, media_url: '', media_name: ''})} className="px-3 h-10 border border-[#E5E7EB] rounded-lg text-xs text-[#667085] hover:bg-gray-50 transition-all">Xoá</button>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tình trạng</label>
                  <select value={form.status || 'pending'} onChange={e => setForm({...form, status: e.target.value})} className={inputCls}>
                    {STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Link bài hoàn thiện</label>
                  <input value={form.completion_link || ''} onChange={e => setForm({...form, completion_link: e.target.value})} placeholder="https://..." className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white rounded-lg text-sm font-semibold hover:bg-[#4338ca] transition-all disabled:opacity-50">
                  {loading && <Loader2 size={14} className="animate-spin" />}{showModal.id ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
                <button onClick={() => setShowModal(null)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#667085] rounded-lg text-sm font-medium transition-all">Huỷ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media picker */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={() => setShowMediaPicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#1F2937]">Chọn media từ Kho dữ liệu</h3>
              <button onClick={() => setShowMediaPicker(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-all"><X size={18} /></button>
            </div>
            <div className="p-4">
              <input value={mediaSearch} onChange={e => setMediaSearch(e.target.value)} placeholder="Tìm media..." className={inputCls + ' mb-3'} />
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {driveFiles.filter((f: any) => !mediaSearch || (f.name || f.original_name || '').toLowerCase().includes(mediaSearch.toLowerCase())).map((f: any) => (
                  <button key={f.id} onClick={() => pickMedia(f)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F8FAFC] rounded-lg transition-all text-left">
                    <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] grid place-items-center text-[#4f46e5] shrink-0">
                      {(f.type || '').includes('image') ? <Image size={16} /> : <FileText size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1F2937] truncate">{f.name || f.original_name || 'Không tên'}</p>
                      <p className="text-xs text-[#98A2B3] truncate">{f.url || f.path}</p>
                    </div>
                  </button>
                ))}
                {driveFiles.length === 0 && <p className="text-center text-sm text-[#98A2B3] py-8">Kho dữ liệu trống</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}