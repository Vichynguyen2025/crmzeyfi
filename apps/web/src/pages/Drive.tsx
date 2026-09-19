import { useState, useEffect, useCallback } from 'react';
import { Folder, FileText, Image, Video, Plus, X, Edit3, Trash2, ChevronRight, Upload, Download, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const MIME_ICONS: Record<string, string> = {
  'image': 'Image', 'video': 'Video', 'application/pdf': 'FileText',
  'word': 'FileText', 'spreadsheet': 'FileText', 'text': 'FileText',
};

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function getFileIcon(mimeType: string) {
  if (!mimeType) return FileText;
  const type = mimeType.split('/')[0];
  if (type === 'image') return Image;
  if (type === 'video') return Video;
  return FileText;
}

function formatDate(d: string) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000) return 'Hôm nay ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Hôm qua ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('vi-VN');
}

export default function Drive() {
  const [files, setFiles] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{id: string | null, name: string}[]>([{id: null, name: 'Kho dữ liệu'}]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [preview, setPreview] = useState<any>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({type, message});
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => {
    const url = currentFolder ? '/drive?parentId=' + currentFolder : '/drive';
    api(url).then(setFiles).catch(() => showToast('error', 'Lỗi tải dữ liệu'));
  }, [currentFolder]);

  useEffect(load, [load]);

  // Realtime
  useEffect(() => {
    const sock = getSocket();
    const handler = () => load();
    sock.on('drive:update', handler);
    return () => { sock.off('drive:update', handler); };
  }, [load]);

  const createFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await api('/drive/folder', { method:'POST', body:JSON.stringify({name: folderName, parentId: currentFolder}) });
      setFolderName(''); setShowNewFolder(false);
      showToast('success', 'Đã tạo thư mục "' + folderName + '"');
      load();
    } catch { showToast('error', 'Lỗi tạo thư mục'); }
  };

  const openFolder = (id: string, name: string) => {
    setCurrentFolder(id);
    setFolderPath([...folderPath, {id, name}]);
  };

  const goToPath = (idx: number) => {
    const p = folderPath.slice(0, idx + 1);
    setFolderPath(p);
    setCurrentFolder(p[p.length - 1].id);
  };

  const rename = async (id: string, oldName: string) => {
    const name = prompt('Đổi tên:', oldName);
    if (!name || name === oldName) return;
    try {
      await api('/drive/' + id, { method:'PUT', body:JSON.stringify({name}) });
      showToast('success', 'Đã đổi tên thành "' + name + '"');
      load();
    } catch { showToast('error', 'Lỗi đổi tên'); }
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm('Xoá "' + name + '"?')) return;
    try {
      await api('/drive/' + id, { method:'DELETE' });
      showToast('success', 'Đã xoá "' + name + '"');
      load();
    } catch { showToast('error', 'Lỗi xoá'); }
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#171717]">Kho dữ liệu</h1><p className="text-sm text-muted mt-1">Lưu trữ file, tài liệu, hình ảnh</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
            <Folder size={16} />Thư mục mới
          </button>
          <label className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer">
            <Upload size={16} />Tải lên
            <input type="file" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async (ev) => {
                try {
                  const base64 = (ev.target?.result as string)?.split(',')[1] || '';
                  await api('/drive/upload', { method:'POST', body:JSON.stringify({
                    name: file.name, mimeType: file.type, size: file.size, data: base64, parentId: currentFolder
                  })});
                  showToast('success', 'Đã tải lên "' + file.name + '"');
                  load();
                } catch(e: any) { showToast('error', 'Lỗi tải lên: ' + (e.message||'')); }
              };
              reader.readAsDataURL(file);
            }} />
          </label>
        </div>
      </div>

      {showNewFolder && (
        <div className="bg-white rounded-2xl border border-border p-4 flex gap-3 shadow-sm">
          <input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Tên thư mục" autoFocus
            onKeyDown={e => e.key === 'Enter' && createFolder()}
            className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
          <button onClick={createFolder} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:shadow-md transition-all">Tạo</button>
          <button onClick={() => setShowNewFolder(false)} className="p-2.5 rounded-xl hover:bg-gray-100 transition-all"><X size={18} /></button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm bg-white rounded-2xl border border-border px-5 py-3 shadow-sm">
        {folderPath.map((p, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={14} className="text-muted" />}
            <button onClick={() => goToPath(i)} className={'hover:text-primary transition-all ' + (i === folderPath.length - 1 ? 'font-semibold text-[#171717]' : 'text-muted')}>
              {p.name}
            </button>
          </span>
        ))}
        <span className="text-xs text-muted ml-auto">{files.length} mục</span>
      </div>

      {/* File grid */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {files.length > 0 ? (
          <div className="divide-y divide-border">
            {files.map((item: any) => {
              const Icon = getFileIcon(item.mime_type);
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-all group">
                  <div className={'w-10 h-10 rounded-xl grid place-items-center shrink-0 ' + (item.type === 'folder' ? 'bg-amber-50' : 'bg-indigo-50')}
                    onClick={() => item.type === 'folder' && openFolder(item.id, item.name)}>
                    {item.type === 'folder' ? <Folder size={22} className="text-amber-500" /> : <Icon size={22} className="text-[#4f46e5]" />}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { if (item.type === 'folder') openFolder(item.id, item.name); else setPreview(item); }}>
                    <p className="font-medium text-sm text-[#171717] truncate">{item.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                      <span>{item.type === 'folder' ? 'Thư mục' : formatSize(item.size) || 'File'}</span>
                      {item.uploadedByName && <span className="flex items-center gap-1"><User size={11} />{item.uploadedByName}</span>}
                      {item.created_at && <span className="flex items-center gap-1"><Clock size={11} />{formatDate(item.created_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => rename(item.id, item.name)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-all" title="Đổi tên">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteItem(item.id, item.name)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all" title="Xoá">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted">
            <Folder size={56} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Thư mục trống</p>
            <p className="text-sm mt-1">Tạo thư mục mới hoặc tải file lên</p>
          </div>
        )}
      </div>
    {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 grid place-items-center shrink-0">
                  {(() => { const Icon = getFileIcon(preview.mime_type); return <Icon size={20} className="text-[#4f46e5]" />; })()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-[#171717] truncate max-w-[300px]">{preview.name}</h3>
                  <p className="text-xs text-muted">{preview.mime_type || 'File'} — {formatSize(preview.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {preview.url && (
                  <a href={preview.url.startsWith('http') ? preview.url : preview.url} download={preview.name}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl text-xs font-medium hover:bg-gray-50 transition-all">
                    <Download size={14} /> Tải xuống
                  </a>
                )}
                <button onClick={() => setPreview(null)} className="p-2.5 rounded-xl hover:bg-gray-100 transition-all"><X size={20} /></button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto bg-gray-50/50">
              {/* Image */}
              {preview.mime_type?.startsWith('image/') ? (
                <div className="p-6 flex items-center justify-center min-h-[400px]">
                  {preview.url ? (
                    <img src={preview.url} alt={preview.name}
                      className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-sm"
                      onError={(e: any) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="text-center text-muted py-12"><p class="font-medium">Không thể tải ảnh</p><p class="text-sm mt-1">Vui lòng thử tải xuống</p></div>';
                      }} />
                  ) : (
                    <div className="text-center text-muted py-12">
                      <FileText size={48} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">File chưa có dữ liệu</p>
                    </div>
                  )}
                </div>
              /* PDF */
              ) : preview.mime_type === 'application/pdf' ? (
                <div className="p-2 min-h-[400px]">
                  {preview.url ? (
                    <embed src={preview.url} type="application/pdf" className="w-full h-[75vh] rounded-lg" />
                  ) : (
                    <div className="text-center text-muted py-12">
                      <FileText size={48} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">File chưa có dữ liệu</p>
                    </div>
                  )}
                </div>
              /* Video */
              ) : preview.mime_type?.startsWith('video/') ? (
                <div className="p-6 flex items-center justify-center min-h-[400px]">
                  {preview.url ? (
                    <video src={preview.url} controls className="max-w-full max-h-[70vh] rounded-xl shadow-sm" />
                  ) : (
                    <div className="text-center text-muted py-12">
                      <FileText size={48} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">File chưa có dữ liệu</p>
                    </div>
                  )}
                </div>
              /* Office / Unsupported */
              ) : (
                <div className="p-12 flex flex-col items-center justify-center min-h-[300px] text-center">
                  <FileText size={64} className="mx-auto mb-5 opacity-20 text-muted" />
                  <p className="font-medium text-[#171717]">Không hỗ trợ xem trước loại file này</p>
                  <p className="text-sm text-muted mt-1 mb-6">
                    {preview.mime_type?.includes('word') || preview.mime_type?.includes('spreadsheet') || preview.mime_type?.includes('presentation') 
                      ? 'File văn phòng cần tải xuống để xem'
                      : 'Định dạng ' + (preview.mime_type || 'không xác định') + ' chưa được hỗ trợ'}
                  </p>
                  {preview.url && (
                    <a href={preview.url} download={preview.name}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:shadow-md hover:bg-[#5e6ad2] transition-all">
                      <Download size={16} /> Tải xuống
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}