import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Trash2, LayoutGrid, List, Search, Check, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const STATUSES = [
  { key: 'todo', label: 'Cần làm', color: '#6b7280' },
  { key: 'in_progress', label: 'Đang làm', color: '#f59e0b' },
  { key: 'review', label: 'Kiểm tra', color: '#4f46e5' },
  { key: 'done', label: 'Hoàn thành', color: '#22c55e' },
];

const PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;

const COLUMNS = [
  { key: 'title', label: 'Tên công việc', type: 'text', w: 'min-w-[200px]', editable: true },
  { key: 'content', label: 'Nội dung', type: 'content', w: 'min-w-[180px]', editable: false },
  { key: 'productLink', label: 'Link sản phẩm', type: 'link', w: 'min-w-[180px]', editable: true },
  { key: 'status', label: 'Trạng thái', type: 'select', w: 'w-32', editable: true, options: STATUSES.map(s => ({ value: s.key, label: s.label })) },
  { key: 'priority', label: 'Độ ưu tiên', type: 'select', w: 'w-28', editable: true, options: PRIORITIES.map(p => ({ value: p, label: p === 'urgent' ? 'Khẩn cấp' : p === 'high' ? 'Cao' : p === 'medium' ? 'Trung bình' : 'Thấp' })) },
  { key: 'dueDate', label: 'Hạn hoàn thành', type: 'date', w: 'w-28', editable: true },
  { key: 'createdAt', label: 'Ngày tạo', type: 'date', w: 'w-28', editable: false },
  { key: 'createdByName', label: 'Người tạo', type: 'text', w: 'w-36', editable: false },
  { key: 'assigneeName', label: 'Người thực hiện', type: 'text', w: 'w-36', editable: false },
];

const PRIORITY_MAP: Record<string, string> = { urgent: 'Khẩn cấp', high: 'Cao', medium: 'Trung bình', low: 'Thấp' };

export default function Kanban() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [drag, setDrag] = useState<any>(null);
  const [view, setView] = useState<'kanban' | 'sheet'>('sheet');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{id: string, col: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [contentEditor, setContentEditor] = useState<{id: string, text: string} | null>(null);
  const [drivePicker, setDrivePicker] = useState<{taskId: string, open: boolean}>({taskId: '', open: false});
  const [driveFiles, setDriveFiles] = useState<any[]>([]);

  const showToast = (type: 'success' | 'error', msg: string) => { setToast({type, msg}); setTimeout(() => setToast(null), 2000); };

  const load = useCallback(() => api('/tasks').then(t => setTasks(t || [])).catch(() => showToast('error', 'Lỗi tải')), []);
  useEffect(() => { load();
    const sock = getSocket();
    sock.on('task:new', load); sock.on('task:updated', load); sock.on('task:deleted', load);
    return () => { sock.off('task:new'); sock.off('task:updated'); sock.off('task:deleted'); };
  }, [load]);

  // Load drive files when picker opens
  useEffect(() => {
    if (drivePicker.open) { api('/drive').then(setDriveFiles).catch(() => {}); }
  }, [drivePicker.open]);

  const filtered = tasks.filter(t => {
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && t.assigneeName !== filterAssignee && (t.assigneeName || '') !== filterAssignee) return false;
    return true;
  });
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const saveField = async (id: string, field: string, value: string) => {
    const prev = tasks.find(t => t.id === id);
    if (!prev || prev[field] === value) return;
    setSaving(s => new Set(s).add(id));
    setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, [field]: value} : t));
    setEditing(null);
    try { await api('/tasks/' + id, { method:'PUT', body:JSON.stringify({[field]: value}) }); showToast('success', '✓ Đã lưu'); }
    catch { setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, [field]: prev[field]} : t)); showToast('error', '⚠ Lỗi lưu'); }
    setSaving(s => { const n = new Set(s); n.delete(id); return n; });
  };

  const addTask = async () => {
    if (!title.trim()) return;
    try { await api('/tasks', { method:'POST', body:JSON.stringify({title: title.trim(), teamId:'', status:'todo'}) }); setTitle(''); setShowAdd(false); load(); }
    catch { showToast('error', 'Lỗi tạo'); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Xoá công việc này?')) return;
    try { await api('/tasks/' + id, { method:'DELETE' }); setSelectedIds(s => { const n = new Set(s); n.delete(id); return n; }); load(); }
    catch { showToast('error', 'Không thể xoá'); }
  };

  const deleteSelected = async () => {
    if (!confirm('Xoá ' + selectedIds.size + ' công việc?')) return;
    for (const id of selectedIds) { try { await api('/tasks/' + id, { method:'DELETE' }); } catch {} }
    setSelectedIds(new Set()); load(); showToast('success', 'Đã xoá ' + selectedIds.size + ' công việc');
  };

  const move = async (id: string, status: string) => {
    const idx = tasks.filter(t => t.status === status).length;
    await api('/tasks/'+id+'/status', {method:'PUT',body:JSON.stringify({status,position:idx})});
    setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, status, position: idx} : t));
  };

  const startEdit = (id: string, col: string, val: string) => {
    const c = COLUMNS.find(c => c.key === col);
    if (!c?.editable) return;
    setEditing({id, col}); setEditValue(val || '');
  };

  const confirmEdit = () => { if (editing) saveField(editing.id, editing.col, editValue); };
  const cancelEdit = () => setEditing(null);

  const contentSummary = (text: string) => {
    if (!text) return '';
    const first = text.split('\n')[0] || '';
    return first.length > 60 ? first.slice(0, 60) + '...' : first;
  };

  const PRIORITY_MAP2: Record<string, string> = { urgent: 'Khẩn cấp', high: 'Cao', medium: 'Trung bình', low: 'Thấp' };
  const STATUS_COLORS: Record<string, string> = {
    todo: 'bg-red-100 text-red-700', in_progress: 'bg-amber-100 text-amber-700',
    review: 'bg-indigo-100 text-indigo-700', done: 'bg-green-100 text-green-700',
  };
  const PRIORITY_COLORS: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700', high: 'bg-amber-100 text-amber-700',
    medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="text-sm leading-[1.5] text-[#171717]">
      {toast && (
        <div className={'fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <Check size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Content Editor Modal */}
      {contentEditor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setContentEditor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold">&#9998;</div>
                <div>
                  <h3 className="font-bold text-sm text-[#171717]">Soạn nội dung công việc</h3>
                  <p className="text-xs text-muted mt-0.5">{tasks.find(t => t.id === contentEditor.id)?.title || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  await saveField(contentEditor.id, 'description', contentEditor.text);
                  setContentEditor(null);
                }} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all shadow-sm">
                  <Check size={16} /> Lưu & Đóng
                </button>
                <button onClick={() => setContentEditor(null)} className="p-2.5 rounded-xl hover:bg-gray-100 transition-all"><X size={18} /></button>
              </div>
            </div>
            {/* Word-like editor */}
            <div className="flex-1 overflow-auto p-8 bg-[#fafafa]">
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-border p-8 min-h-[500px]">
                <textarea value={contentEditor.text} onChange={e => setContentEditor({...contentEditor, text: e.target.value})}
                  placeholder="Viết nội dung chi tiết tại đây...&#10;&#10;Bạn có thể viết nhiều dòng,&#10;dòng đầu tiên sẽ hiển thị tóm tắt trên bảng."
                  className="w-full min-h-[450px] resize-none bg-transparent border-0 text-sm text-[#171717] leading-7 outline-none placeholder-muted/40"
                  style={{fontFamily: "'Inter', sans-serif", fontSize: '14px', lineHeight: '1.8'}}
                />
              </div>
            </div>
            {/* Status bar */}
            <div className="px-6 py-2.5 bg-gray-50/80 border-t border-border flex items-center gap-4 text-xs text-muted">
              <span><span className="font-medium">Dòng đầu</span> sẽ hiển thị tóm tắt trên bảng</span>
              <span className="w-px h-3 bg-border/60" />
              <span>{contentEditor.text?.length || 0} ký tự</span>
              <span className="ml-auto">Ctrl+S để lưu</span>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={'fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <Check size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#171717]">Marketing eSim</h1>
          <div className="flex items-center gap-1 bg-white rounded-xl border border-border shadow-sm p-0.5">
            {(['kanban', 'sheet'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ' +
                  (view === v ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-muted hover:bg-gray-50')}>
                {v === 'kanban' ? <LayoutGrid size={16} /> : <List size={16} />}
                {v === 'kanban' ? 'Kanban' : 'Sheet'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-40 pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25 transition-all" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-border rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-[#4f46e5]/25 cursor-pointer">
            <option value="">Trạng thái</option>
            {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-white border border-border rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-[#4f46e5]/25 cursor-pointer">
            <option value="">Độ ưu tiên</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
            className="px-3 py-2 bg-white border border-border rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-[#4f46e5]/25 cursor-pointer">
            <option value="">Người thực hiện</option>
            {[...new Set(tasks.filter(t => t.assigneeName).map(t => t.assigneeName))].map(name =>
              <option key={name} value={name}>{name}</option>
            )}
          </select>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all shadow-sm">
            <Plus size={16} /> Thêm
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-border p-4 mb-6 flex gap-3 shadow-sm">
          <input value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setShowAdd(false); }}
            placeholder="Tên công việc..." autoFocus
            className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 transition-all" />
          <button onClick={addTask} className="px-4 py-2.5 bg-[#4f46e5] text-white font-medium rounded-xl text-sm hover:shadow-md transition-all">Thêm</button>
          <button onClick={() => setShowAdd(false)} className="p-2.5 rounded-xl hover:bg-gray-100 transition-all"><X size={18} /></button>
        </div>
      )}

      {/* Selection toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-3 mb-5 flex items-center gap-3 text-sm shadow-sm">
          <span className="font-semibold text-indigo-700">{selectedIds.size} công việc</span>
          <div className="w-px h-4 bg-indigo-200" />
          <button onClick={deleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all shadow-sm">
            <Trash2 size={13} /> Xoá
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-muted hover:text-ink transition-all">Bỏ chọn</button>
        </div>
      )}

      {/* Kanban Board */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATUSES.map(s => (
            <div key={s.key}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (drag) { move(drag.id, s.key); setDrag(null); } }}
              className="bg-gray-50/80 rounded-2xl p-5 min-h-[200px] border border-border">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: s.color}} />
                <h3 className="font-semibold text-sm text-[#171717]">{s.label}</h3>
                <span className="ml-auto text-xs text-muted bg-white px-2.5 py-0.5 rounded-full border border-border font-medium">
                  {tasks.filter(t => t.status === s.key).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === s.key).length === 0 && (
                  <div className="text-xs text-muted py-8 text-center">Kéo thả task vào đây</div>
                )}
                {tasks.filter(t => t.status === s.key).map(task => (
                  <div key={task.id} draggable onDragStart={() => setDrag(task)}
                    className="bg-white rounded-xl p-4 border border-border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm flex-1 text-[#171717]">{task.title}</p>
                      <button onClick={() => deleteTask(task.id)}
                        className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {task.assigneeName && (
                      <p className="text-xs text-muted mt-2 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#4f46e5]/10 text-[9px] grid place-items-center text-[#4f46e5] font-medium">
                          {task.assigneeName.charAt(0).toUpperCase()}
                        </span>
                        {task.assigneeName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet / Data Grid */}
      {view === 'sheet' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50/90 border-b-2 border-border">
                  <th className="w-10 p-0 text-center py-3">
                    <input type="checkbox" checked={allSelected}
                      onChange={() => setSelectedIds(allSelected ? new Set() : new Set(filtered.map(t => t.id)))}
                      className="accent-[#4f46e5]" />
                  </th>
                  <th className="py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-10">STT</th>
                  {COLUMNS.map(c => (
                    <th key={c.key} className={'py-3 px-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left ' + c.w}>
                      {c.label}
                    </th>
                  ))}
                  <th className="w-10 py-3 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((task, i) => {
                  const isSel = selectedIds.has(task.id);
                  const isEdit = editing?.id === task.id;
                  return (
                    <tr key={task.id}
                      className={'transition-all ' + (isSel ? 'bg-indigo-50/50' : 'hover:bg-gray-50/60')}>
                      <td className="p-0 text-center py-3">
                        <input type="checkbox" checked={isSel} onChange={() => {
                          const n = new Set(selectedIds);
                          isSel ? n.delete(task.id) : n.add(task.id);
                          setSelectedIds(n);
                        }} className="accent-[#4f46e5]" />
                      </td>
                      <td className="py-3 px-3 text-xs text-muted text-center">{i + 1}</td>
                      {COLUMNS.map((col, ci) => {
                        const val = task[col.key] || '';
                        const cellEdit = isEdit && editing?.col === col.key;
                        return (
                          <td key={col.key} className={'py-2 px-3 ' + col.w}>
                            {cellEdit ? (
                              col.type === 'select' ? (
                                <select value={editValue} onChange={e => setEditValue(e.target.value)}
                                  onBlur={confirmEdit} autoFocus
                                  className="w-full px-2.5 py-2 bg-white border-2 border-[#4f46e5] rounded-lg text-xs text-ink outline-none">
                                  {col.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              ) : col.type === 'date' ? (
                                <input type="date" value={editValue || ''} onChange={e => setEditValue(e.target.value)}
                                  onBlur={confirmEdit} autoFocus
                                  onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                  className="w-full px-2.5 py-2 bg-white border-2 border-[#4f46e5] rounded-lg text-xs text-ink outline-none" />
                              ) : (
                                <input value={editValue} onChange={e => setEditValue(e.target.value)}
                                  onBlur={confirmEdit} autoFocus
                                  onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); if (e.key === 'Tab') { e.preventDefault(); confirmEdit(); const next = e.shiftKey ? ci - 1 : ci + 1; if (next >= 0 && next < COLUMNS.length && COLUMNS[next].editable) startEdit(task.id, COLUMNS[next].key, task[COLUMNS[next].key] || ''); } }}
                                  className="w-full px-2.5 py-2 bg-white border-2 border-[#4f46e5] rounded-lg text-xs text-ink outline-none" />
                              )
                            ) : (
                              <div
                                onClick={() => col.editable && startEdit(task.id, col.key, val)}
                                className={'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ' +
                                  (col.editable ? 'cursor-pointer hover:bg-gray-100/80' : '') +
                                  (saving.has(task.id) ? 'opacity-50' : '')}>
                                {col.key === 'status' ? (
                                  <span className={'px-2.5 py-1 rounded-md text-[11px] font-medium ' + ({
                                    todo: 'bg-red-100 text-red-700', in_progress: 'bg-amber-100 text-amber-700',
                                    review: 'bg-indigo-100 text-indigo-700', done: 'bg-green-100 text-green-700',
                                  }[val] || 'bg-gray-100 text-muted')}>{STATUSES.find(s => s.key === val)?.label || val}</span>
                                ) : col.key === 'priority' ? (
                                  <span className={'px-2.5 py-1 rounded-md text-[11px] font-medium ' + ({
                                    urgent: 'bg-red-100 text-red-700', high: 'bg-amber-100 text-amber-700',
                                    medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600',
                                  }[val] || 'bg-gray-100 text-gray-600')}>{PRIORITY_MAP[val] || val || 'Trung bình'}</span>
                                ) : col.key === 'content' ? (
                                  <div onClick={e => { e.stopPropagation(); if (task) setContentEditor({id: task.id, text: task.description || ''}); }}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-100/80 transition-all">
                                    <span className={'truncate max-w-[160px] ' + (task.description ? 'text-[#171717]' : 'text-muted italic')}>
                                      {task.description ? contentSummary(task.description) : 'Viết nội dung...'}
                                    </span>
                                  </div>
                                ) : col.key === 'productLink' ? (
                                  <div className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs">
                                    {val ? (
                                      <a href={val} target="_blank" rel="noopener noreferrer"
                                        className="text-[#4f46e5] hover:underline truncate max-w-[130px]">{val}</a>
                                    ) : (
                                      <span className="text-muted italic">—</span>
                                    )}
                                    <button onClick={e => { e.stopPropagation(); setDrivePicker({taskId: task.id, open: true}); setEditing(null); }}
                                      className="ml-1 p-1 rounded hover:bg-indigo-50 text-muted hover:text-[#4f46e5] transition-all" title="Chọn từ Kho dữ liệu">
                                      <span className="text-[10px]">📎</span>
                                    </button>
                                  </div>
                                ) : col.key === 'createdAt' ? (
                                  <span className="text-muted">{val ? new Date(val).toLocaleDateString('vi-VN') : '—'}</span>
                                ) : col.key === 'dueDate' ? (
                                  <div onClick={() => col.editable && startEdit(task.id, col.key, val)}
                                    className={'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ' +
                                      (col.editable ? 'cursor-pointer hover:bg-gray-100/80' : '')}>
                                    <span className={val ? 'text-[#171717]' : 'text-muted italic'}>{val ? new Date(val).toLocaleDateString('vi-VN') : '—'}</span>
                                  </div>
                                ) : col.key === 'createdByName' ? (
                                  <span className="text-muted">{val || <span className="italic">—</span>}</span>
                                ) : (
                                  <span className={val ? 'text-[#171717]' : 'text-muted italic'}>{val || '—'}</span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-center">
                        <button onClick={() => deleteTask(task.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-all opacity-0 hover:opacity-100">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={COLUMNS.length + 3} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <List size={36} className="text-muted opacity-30" />
                      <p className="text-sm text-muted">{search ? 'Không tìm thấy công việc phù hợp' : 'Chưa có công việc nào'}</p>
                      {!search && <button onClick={() => setShowAdd(true)} className="text-sm text-[#4f46e5] font-medium hover:underline">+ Thêm công việc</button>}
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50/80 border-t border-border">
            <span className="text-xs text-muted">{filtered.length} công việc</span>
            <span className="text-xs text-muted/60">Click để sửa · Tab chuyển cột · Enter lưu · Ctrl+C copy dòng</span>
          </div>
        </div>
      )}
      {/* Drive Picker Modal */}
      {drivePicker.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDrivePicker({taskId: '', open: false})}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[60vh] flex flex-col border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-sm text-[#171717]">Chọn tài liệu từ Kho dữ liệu</h3>
              <button onClick={() => setDrivePicker({taskId: '', open: false})} className="p-2 rounded-xl hover:bg-gray-100 transition-all"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {driveFiles.filter((f: any) => f.type === 'file').map((f: any) => (
                <div key={f.id} onClick={async () => {
                  const url = f.url || f.name;
                  await saveField(drivePicker.taskId, 'productLink', url);
                  setDrivePicker({taskId: '', open: false});
                }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-border">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 grid place-items-center text-[#4f46e5] text-xs font-bold">
                    {f.name.split('.').pop()?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#171717] truncate">{f.name}</p>
                    <p className="text-[10px] text-muted">{f.url || 'Chưa tải lên'}</p>
                  </div>
                </div>
              ))}
              {driveFiles.filter((f: any) => f.type === 'file').length === 0 && (
                <div className="text-center py-8 text-xs text-muted">Chưa có tài liệu trong Kho dữ liệu</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}