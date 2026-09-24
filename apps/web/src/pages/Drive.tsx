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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{name:string,progress:number,status:string}[]>([]);
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [moveTarget, setMoveTarget] = useState<string|null>(null);
  const [moveFileId, setMoveFileId] = useState<string|null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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
    const u = JSON.parse(localStorage.getItem('zeyfi_user') || '{}');
    if (u.id) setCurrentUser(u);
  }, []);

  useEffect(() => { load(); }, []);

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

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const progress: {name:string,progress:number,status:string}[] = [];
    for (let i = 0; i < files.length; i++) progress.push({name:files[i].name,progress:0,status:'pending'});
    setUploadProgress([...progress]);
    let ok=0, fail=0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 500*1024*1024) { progress[i].status='too big'; setUploadProgress([...progress]); fail++; continue; }
      try {
        progress[i].status='uploading'; progress[i].progress=10; setUploadProgress([...progress]);
        const base64 = await new Promise<string>(r=>{const fr=new FileReader();fr.onload=()=>r((fr.result as string).split(',')[1]);fr.readAsDataURL(file);});
        progress[i].progress=60; setUploadProgress([...progress]);
        await api('/drive/upload',{method:'POST',body:JSON.stringify({name:file.name,mimeType:file.type,size:file.size,data:base64,parentId:currentFolder||null})});
        progress[i].progress=100; progress[i].status='done'; setUploadProgress([...progress]); ok++;
      } catch { progress[i].status='error'; setUploadProgress([...progress]); fail++; }
    }
    if(ok>0)showToast('success','Đã tải '+ok+' file'+(fail>0?', '+fail+' lỗi':''));
    setTimeout(()=>{setUploading(false);setUploadProgress([]);},2000);
    load();
  };

  
  const moveItem = async (id: string) => {
    if (!moveTarget) return;
    try {
      await api('/drive/' + id, { method:'PUT', body:JSON.stringify({ parentId: moveTarget }) });
      showToast('success', 'Đã di chuyển');
      setMoveFileId(null);
      setMoveTarget(null);
      load();
    } catch { showToast('error', 'Lỗi di chuyển'); }
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
        <div><h1 className="text-2xl font-bold text-ink">Kho dữ liệu</h1><p className="text-sm text-muted mt-1">Lưu trữ file, tài liệu, hình ảnh</p></div>
        <div className="flex items-center gap-2 text-xs text-muted bg-gray-50 border border-border rounded-lg px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>~18 GB trống</span>
          <span className="w-px h-3 bg-border/60" />
          <span>Tối đa 500 MB/file</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewMode('list')}
            className={'p-2 rounded-lg transition-all ' + (viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-ink hover:bg-[#f5f5f5]')}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1={8} y1={6} x2={21} y2={6}/><line x1={8} y1={12} x2={21} y2={12}/><line x1={8} y1={18} x2={21} y2={18}/><line x1={3} y1={6} x2={3.01} y2={6}/><line x1={3} y1={12} x2={3.01} y2={12}/><line x1={3} y1={18} x2={3.01} y2={18}/></svg>
          </button>
          <button onClick={() => setViewMode('grid')}
            className={'p-2 rounded-lg transition-all ' + (viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-ink hover:bg-[#f5f5f5]')}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={3} y={14} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/></svg>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
            <Folder size={16} />Thư mục mới
          </button>
          <label className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer">
            <Upload size={16} />Tải lên
            <input type="file" multiple className="hidden" onChange={handleMultiUpload} />
          </label>
        </div>
      </div>

      
      {/* Upload progress */}
      {uploading && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-2 mb-4">
          <p className="text-xs font-medium text-muted">Đang tải lên ({uploadProgress.filter(p=>p.status==='done'||p.status==='uploading').length}/{uploadProgress.length})</p>
          {uploadProgress.map((p,i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-ink truncate max-w-[200px]">{p.name}</span>
                  <span className="text-xs text-muted">{p.status==='done' ? '✓' : p.status==='error' ? '!' : p.progress+'%'}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-full transition-all duration-300" style={{width:p.progress+'%'}}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
            <button onClick={() => goToPath(i)} className={'hover:text-primary transition-all ' + (i === folderPath.length - 1 ? 'font-semibold text-ink' : 'text-muted')}>
              {p.name}
            </button>
          </span>
        ))}
        <span className="text-xs text-muted ml-auto">{files.length} mục</span>
      </div>

      {/* File grid */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {viewMode === 'list' && files.length > 0 && (
          <div className="divide-y divide-border">
            {files.map((item: any) => {
              const Icon = getFileIcon(item.mime_type);
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-all group">
                  <div className={'w-10 h-10 rounded-xl grid place-items-center shrink-0 ' + (item.type === 'folder' ? 'bg-amber-50' : 'bg-indigo-50')}
                    onClick={() => item.type === 'folder' && openFolder(item.id, item.name)}>
                    {item.type === 'folder' ? <Folder size={22} className="text-amber-500" /> : <Icon size={22} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={async () => {
                if (item.type === 'folder') { openFolder(item.id, item.name); return; }
                setPreview(item);
                if (['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(item.mime_type)) {
                  try { const res = await api('/drive/preview/'+item.id, {method:'POST'}); if (res?.previewUrl) setPreviewUrl(res.previewUrl); else setPreviewUrl(item.url); } catch { setPreviewUrl(item.url); }
                } else { setPreviewUrl(item.url); }
              }}>
                    <p className="font-medium text-sm text-ink truncate">{item.name}</p>
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
                    {(currentUser?.role === 'admin' || currentUser?.id === item.uploaded_by) && <><button onClick={() => deleteItem(item.id, item.name)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all" title="Xoá">
                      <Trash2 size={14} /></button>
                      <button onClick={() => { setMoveFileId(item.id); setMoveTarget(item.parent_id||null); }} className="p-2 rounded-lg hover:bg-blue-50 text-muted hover:text-primary transition-all" title="Di chuyển"><Folder size={14} /></button></>}

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'grid' && files.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((item: any) => {
              const isFolder = item.type === 'folder';
              const isImage = item.mime_type?.startsWith('image/');
              const Icon = getFileIcon(item.mime_type);
              return (
                <div key={item.id} className="bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group border border-[#ebebeb] p-3"
                  onClick={async () => {
                    if (isFolder) { openFolder(item.id, item.name); return; }
                    setPreview(item);
                    if (['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(item.mime_type)) {
                      try { const res = await api('/drive/preview/'+item.id, {method:'POST'}); if (res?.previewUrl) setPreviewUrl(res.previewUrl); else setPreviewUrl(item.url); } catch { setPreviewUrl(item.url); }
                    } else { setPreviewUrl(item.url); }
                  }}>
                  <div className="aspect-[4/3] bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] relative flex items-center justify-center rounded-lg overflow-hidden overflow-hidden">
                    {isFolder ? (
                      <div className="w-16 h-12 relative">
                        <div className="absolute top-0 left-0 w-full h-3 bg-amber-300 rounded-t-md" />
                        <div className="absolute bottom-0 left-0 w-full h-10 bg-amber-400 rounded-md rounded-t-none shadow-sm flex items-center justify-center">
                          <Folder size={20} className="text-white" />
                        </div>
                      </div>
                    ) : isImage ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" onError={(e:any)=>{e.target.style.display='none';}} />
                    ) : (
                      <Icon size={40} className="text-primary/30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={e=>{e.stopPropagation();rename(item.id, item.name)}} className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all" title="Đổi tên">
                        <Edit3 size={12} className="text-ink" />
                      </button>
                      {!isFolder && <button onClick={e=>{e.stopPropagation();deleteItem(item.id, item.name)}} className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all" title="Xóa">
                        <Trash2 size={12} className="text-red-500" />
                      </button>}
                    </div>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-xs font-medium text-ink truncate leading-tight">{item.name}</p>
                    <p className="text-xs text-[#999] mt-1">{isFolder ? 'Thư mục' : formatSize(item.size)}</p>
                    {item.uploadedByName && <p className="text-xs text-[#999] mt-0.5 truncate">{item.uploadedByName}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {files.length === 0 && (
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
                  {(() => { const Icon = getFileIcon(preview.mime_type); return <Icon size={20} className="text-primary" />; })()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-ink truncate max-w-[300px]">{preview.name}</h3>
                  <p className="text-xs text-muted">{preview.mime_type || 'File'} — {formatSize(preview.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {preview.url && (
                  <a href={(previewUrl||preview.url).startsWith('http') ? preview.url : preview.url} download={preview.name}
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
                    <img src={previewUrl} alt={preview.name}
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
                    <embed src={previewUrl} type="application/pdf" className="w-full h-[75vh] rounded-lg" />
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
              /* Office documents */
              ) : (['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(preview.mime_type)) ? (
                <div className="p-2 min-h-[400px]">
                  {previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-[75vh] border-0 rounded-lg" />
                  ) : (
                    <div className="flex items-center justify-center min-h-[400px] text-center">
                      <div><FileText size={48} className="mx-auto mb-3 opacity-20 text-muted" /><p className="font-medium text-muted">Đang chuyển đổi sang PDF...</p></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center min-h-[300px] text-center">
                  <FileText size={64} className="mx-auto mb-5 opacity-20 text-muted" />
                  <p className="font-medium text-ink">Không hỗ trợ xem trước loại file này</p>
                  <p className="text-sm text-muted mt-1 mb-6">
                    {preview.mime_type?.includes('word') || preview.mime_type?.includes('spreadsheet') || preview.mime_type?.includes('presentation') 
                      ? 'File văn phòng cần tải xuống để xem'
                      : 'Định dạng ' + (preview.mime_type || 'không xác định') + ' chưa được hỗ trợ'}
                  </p>
                  {preview.url && (
                    <a href={preview.url} download={preview.name}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:shadow-md hover:bg-[#5e6ad2] transition-all">
                      <Download size={16} /> Tải xuống
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}      {/* Move modal */}
      {moveFileId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMoveFileId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{boxShadow:'rgba(0,0,0,0.12) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 12px'}} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-ink">Di chuyen den thu muc</h3>
              <button onClick={() => setMoveFileId(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} className="text-muted" /></button>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto space-y-1">
              <button onClick={async () => { try { await api('/drive/' + moveFileId, { method:'PUT', body:JSON.stringify({ parentId: null }) }); showToast('success', 'Da di chuyen'); setMoveFileId(null); location.reload(); } catch { showToast('error', 'Loi'); } }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all text-left">
                <Folder size={18} className="text-amber-500" />
                <span className="text-sm font-medium text-ink">Thu muc goc</span>
              </button>
              {(files||[]).filter((f) => f.type === 'folder' && f.id !== currentFolder).map((f) => (
                <button key={f.id} onClick={async () => { try { await api('/drive/' + moveFileId, { method:'PUT', body:JSON.stringify({ parentId: f.id }) }); showToast('success', 'Da di chuyen'); setMoveFileId(null); location.reload(); } catch { showToast('error', 'Loi'); } }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all text-left">
                  <Folder size={18} className="text-amber-500" />
                  <span className="text-sm font-medium text-ink">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}