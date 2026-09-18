import { useState, useEffect } from 'react';
import { Folder, File, FileText, Image, Video, Plus, X, Edit3, Trash2, ChevronRight, Upload, Download } from 'lucide-react';
import { api } from '../lib/api';

const FILE_ICONS: Record<string, any> = {
  'image/*': Image, 'video/*': Video, 'application/pdf': FileText,
  'application/msword': FileText, 'application/vnd.openxmlformats-officedocument.wordprocessingml': FileText,
  'application/vnd.ms-excel': FileText, 'application/vnd.openxmlformats-officedocument.spreadsheetml': FileText,
};

export default function Drive() {
  const [files, setFiles] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{id: string | null, name: string}[]>([{id: null, name: 'Kho dữ liệu'}]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');

  const load = () => {
    const url = currentFolder ? '/drive?parentId=' + currentFolder : '/drive';
    api(url).then(setFiles);
  };
  useEffect(load, [currentFolder]);

  const createFolder = async () => {
    if (!folderName.trim()) return;
    await api('/drive/folder', { method:'POST', body:JSON.stringify({name: folderName, parentId: currentFolder}) });
    setFolderName(''); setShowNewFolder(false); load();
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

  const rename = async (id: string) => {
    const name = prompt('Đổi tên:');
    if (!name) return;
    await api('/drive/' + id, { method:'PUT', body:JSON.stringify({name}) });
    load();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Xoá mục này?')) return;
    await api('/drive/' + id, { method:'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
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
              await api('/drive/upload', { method:'POST', body:JSON.stringify({
                name: file.name, mimeType: file.type, size: file.size,
                url: '', parentId: currentFolder
              })});
              load();
            }} />
          </label>
        </div>
      </div>

      {showNewFolder && (
        <div className="bg-white rounded-2xl border border-border p-4 flex gap-3">
          <input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Tên thư mục" autoFocus
            onKeyDown={e => e.key === 'Enter' && createFolder()}
            className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
          <button onClick={createFolder} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium">Tạo</button>
          <button onClick={() => setShowNewFolder(false)} className="p-2.5 rounded-xl hover:bg-gray-100"><X size={18} /></button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {folderPath.map((p, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={14} className="text-muted" />}
            <button onClick={() => goToPath(i)} className={'hover:text-primary ' + (i === folderPath.length - 1 ? 'font-semibold text-[#171717]' : 'text-muted')}>
              {p.name}
            </button>
          </span>
        ))}
      </div>

      {/* File grid */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
          {files.map((item: any) => (
            <div key={item.id} className="group relative bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-[#4f46e5]/30 transition-all cursor-pointer"
              onClick={() => item.type === 'folder' ? openFolder(item.id, item.name) : null}>
              <div className="flex items-center gap-3 mb-2">
                <div className={'w-10 h-10 rounded-xl grid place-items-center ' + (item.type === 'folder' ? 'bg-amber-50' : 'bg-indigo-50')}>
                  {item.type === 'folder' ? <Folder size={22} className="text-amber-500" /> : <FileText size={22} className="text-[#4f46e5]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#171717] truncate">{item.name}</p>
                  <p className="text-xs text-muted">{item.type === 'folder' ? 'Thư mục' : (item.size ? Math.round(item.size / 1024) + ' KB' : 'File')}</p>
                </div>
              </div>
              {item.uploadedByName && <p className="text-xs text-muted mt-1">{item.uploadedByName}</p>}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => rename(item.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit3 size={13} /></button>
                <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {files.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted">
              <Folder size={48} className="mx-auto mb-3 opacity-30" />
              <p>Thư mục trống. Tạo thư mục mới hoặc tải file lên.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}