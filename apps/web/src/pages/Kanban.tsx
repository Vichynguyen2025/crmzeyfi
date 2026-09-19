import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Trash2, LayoutGrid, List, Search, ChevronDown, Check, AlertCircle } from 'lucide-react';
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
  { key: 'title', label: 'Tên công việc', type: 'text', w: 'min-w-[220px]', editable: true },
  { key: 'status', label: 'Trạng thái', type: 'select', w: 'w-36', editable: true, options: STATUSES.map(s => ({ value: s.key, label: s.label })) },
  { key: 'priority', label: 'Độ ưu tiên', type: 'select', w: 'w-28', editable: true, options: PRIORITIES.map(p => ({ value: p, label: p === 'urgent' ? 'Khẩn cấp' : p === 'high' ? 'Cao' : p === 'medium' ? 'Trung bình' : 'Thấp' })) },
  { key: 'assigneeName', label: 'Người thực hiện', type: 'text', w: 'w-36', editable: false },
  { key: 'created_at', label: 'Ngày tạo', type: 'date', w: 'w-28', editable: false },
];

const statusColors: Record<string, string> = {
  todo: 'bg-red-100 text-red-700', in_progress: 'bg-amber-100 text-amber-700',
  review: 'bg-indigo-100 text-indigo-700', done: 'bg-green-100 text-green-700',
};
const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700', high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600',
};

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function Kanban() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState(''); const [show, setShow] = useState(false);
  const [drag, setDrag] = useState<any>(null);
  const [view, setView] = useState<'kanban' | 'sheet'>('sheet');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{id: string, col: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zeyfi_user') || '{}') : {};
  const isAdmin = user.role === 'admin' || user.role === 'manager';

  const showToast = (type: 'success' | 'error', msg: string) => { setToast({type, msg}); setTimeout(() => setToast(null), 2000); };

  const load = useCallback(() => api('/tasks').then(setTasks).catch(() => showToast('error', 'Lỗi tải dữ liệu')), []);
  useEffect(() => { load();
    const sock = getSocket();
    sock.on('task:new', load); sock.on('task:updated', load); sock.on('task:deleted', load);
    return () => { sock.off('task:new'); sock.off('task:updated'); sock.off('task:deleted'); };
  }, [load]);

  const deleteTask = async (id: string) => {
    if (!confirm('Xoá task này?')) return;
    try { await api('/tasks/' + id, { method: 'DELETE' }); setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); load(); } catch {}
  };

  const move = async (id: string, status: string) => {
    const idx = tasks.filter(t => t.status === status).length;
    await api('/tasks/'+id+'/status', {method:'PUT',body:JSON.stringify({status,position:idx})});
    setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, status, position: idx} : t));
  };

  const filtered = tasks.filter(t => !search || t.title?.toLowerCase().includes(search.toLowerCase()));
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const saveField = async (id: string, field: string, value: string) => {
    const oldVal = tasks.find(t => t.id === id)?.[field];
    if (oldVal === value) return;
    setSaving(prev => new Set(prev).add(id));
    setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, [field]: value} : t));
    setEditing(null);
    try {
      await api('/tasks/' + id, { method:'PUT', body:JSON.stringify({[field]: value}) });
      showToast('success', '✓ Đã lưu');
    } catch (e: any) {
      setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, [field]: oldVal} : t));
      showToast('error', '⚠ Lỗi: ' + (e.message || 'Không thể lưu'));
    }
    setSaving(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const deleteSelected = async () => {
    if (!confirm('Xoá ' + selectedIds.size + ' công việc?')) return;
    for (const id of selectedIds) {
      try { await api('/tasks/' + id, { method:'DELETE' }); } catch {}
    }
    setSelectedIds(new Set());
    load();
    showToast('success', 'Đã xoá ' + selectedIds.size + ' công việc');
  };

  const addTask = async () => {
    if (!title.trim()) return;
    try {
      const r = await api('/tasks', { method:'POST', body:JSON.stringify({title: title.trim(), teamId: '', status: 'todo'}) });
      setTitle(''); setShow(false);
      load();
    } catch { showToast('error', 'Lỗi tạo task'); }
  };

  const startEdit = (id: string, col: string, value: string) => {
    if (col === 'assigneeName' || col === 'created_at') return;
    setEditing({id, col}); setEditValue(value || '');
  };

  const confirmEdit = () => {
    if (!editing) return;
    saveField(editing.id, editing.col, editValue);
  };

  const cancelEdit = () => setEditing(null);

  const handleCellKeyDown = (e: React.KeyboardEvent, id: string, colIdx: number) => {
    if (editing && (e.key === 'Enter' || e.key === 'Tab')) {
      confirmEdit();
      if (e.key === 'Tab') {
        const next = e.shiftKey ? colIdx - 1 : colIdx + 1;
        if (next >= 0 && next < COLUMNS.length) {
          const nextCol = COLUMNS[next];
          const row = tasks.find(t => t.id === id);
          if (row && nextCol.editable) startEdit(id, nextCol.key, row[nextCol.key] || '');
        }
      }
      e.preventDefault();
    } else if (!editing && e.key === 'Enter') {
      const row = tasks.find(t => t.id === id);
      if (row) { startEdit(id, COLUMNS[colIdx].key, row[COLUMNS[colIdx].key] || ''); }
    } else if (e.key === 'Escape') { cancelEdit(); }
  };

  // Clipboard support
  const handleCopy = () => {
    if (!editing && selectedIds.size > 0) {
      const selected = tasks.filter(t => selectedIds.has(t.id));
      const text = selected.map(t => COLUMNS.map(c => t[c.key] || '').join('\t')).join('\n');
      navigator.clipboard.writeText(text);
      showToast('success', 'Đã copy ' + selected.length + ' dòng');
    }
  };
  const handlePaste = async (e: React.ClipboardEvent) => {
    if (!editing) return;
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    // Single cell paste
    if (!text.includes('\n') && !text.includes('\t')) {
      setEditValue(text);
      return;
    }
    // Multi-cell paste (TSV/CSV)
    const rows = text.split('\n').filter(Boolean);
    if (rows.length === 0) return;
    const editRow = tasks.find(t => t.id === editing?.id);
    if (!editRow) return;
    const colIdx = COLUMNS.findIndex(c => c.key === editing?.col);
    if (colIdx === -1) return;
    // Paste starting from current cell
    for (let ri = 0; ri < rows.length; ri++) {
      const cells = rows[ri].split('\t');
      const rowIdx = tasks.indexOf(editRow) + ri;
      if (rowIdx >= tasks.length) break;
      const row = tasks[rowIdx];
      for (let ci = 0; ci < cells.length && colIdx + ci < COLUMNS.length; ci++) {
        const col = COLUMNS[colIdx + ci];
        if (!col.editable) continue;
        if (cells[ci].trim()) {
          await saveField(row.id, col.key, cells[ci].trim());
        }
      }
    }
    setEditing(null);
    showToast('success', 'Đã paste ' + rows.length + ' dòng');
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { handleCopy(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [editing, selectedIds, tasks]);

  return (<div>
    {toast && (
      <div className={'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
        (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
        {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />} {toast.msg}
      </div>
    )}

    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-[#171717]">Công việc</h1>
        <div className="flex items-center gap-1 bg-white rounded-xl border border-border shadow-sm p-0.5">
          <button onClick={() => setView('kanban')}
            className={'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ' + (view === 'kanban' ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-muted hover:bg-gray-50')}>
            <LayoutGrid size={16} /> Kanban
          </button>
          <button onClick={() => setView('sheet')}
            className={'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ' + (view === 'sheet' ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-muted hover:bg-gray-50')}>
            <List size={16} /> Sheet
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..." 
            className="w-48 pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
        </div>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
          <Plus size={16} /> Thêm
        </button>
      </div>
    </div>

    {/* Add form */}
    {show && <div className="bg-white rounded-2xl border border-border p-4 mb-6 flex gap-3 shadow-sm">
      <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key==='Enter' && addTask()}
        placeholder="Tên công việc..." autoFocus className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
      <button onClick={addTask} className="px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium">Thêm</button>
      <button onClick={() => setShow(false)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
    </div>}

    {/* Selection toolbar */}
    {selectedIds.size > 0 && (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-sm">
        <span className="font-medium text-indigo-700">{selectedIds.size} công việc được chọn</span>
        <button onClick={deleteSelected} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all"><Trash2 size={13} /> Xoá</button>
        <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted hover:text-ink transition-all">Bỏ chọn</button>
      </div>
    )}

    {/* Sheet / Data Grid */}
    {view === 'kanban' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map(s => (
          <div key={s.key} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if(drag) move(drag.id, s.key); setDrag(null); }}
            className="bg-gray-50/80 rounded-2xl p-4 min-h-[300px] border border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor:s.color}} />
              <h3 className="font-semibold text-sm text-[#171717]">{s.label}</h3>
              <span className="text-xs text-muted ml-auto bg-white px-2 py-0.5 rounded-full border border-border">{tasks.filter(t => t.status === s.key).length}</span>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.status === s.key).map(task => (
                <div key={task.id} draggable onDragStart={() => setDrag(task)}
                  className="bg-white rounded-xl p-4 border border-border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm flex-1 text-[#171717]">{task.title}</p>
                    {isAdmin && <button onClick={() => deleteTask(task.id)} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 size={12} /></button>}
                  </div>
                  {task.assigneeName && <p className="text-xs text-muted mt-1.5">👤 {task.assigneeName}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}

    {view === 'sheet' && (
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div ref={tableRef} className="overflow-auto max-h-[65vh]" onPaste={handlePaste}>
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100/90 backdrop-blur-sm border-b-2 border-border">
                <th className="w-10 p-0 text-center">
                  <input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? new Set() : new Set(filtered.map(t => t.id)))}
                    className="accent-[#4f46e5]" />
                </th>
                <th className="p-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left w-10">#</th>
                {COLUMNS.map(c => (
                  <th key={c.key} className={'p-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left ' + c.w}>
                    {c.label}
                  </th>
                ))}
                <th className="w-10 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => {
                const isSelected = selectedIds.has(task.id);
                const isEditing = editing?.id === task.id;
                return (
                  <tr key={task.id} className={'border-b border-border transition-all ' + (isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50/60')}>
                    <td className="p-0 text-center">
                      <input type="checkbox" checked={isSelected} onChange={() => {
                        const next = new Set(selectedIds);
                        isSelected ? next.delete(task.id) : next.add(task.id);
                        setSelectedIds(next);
                      }} className="accent-[#4f46e5]" />
                    </td>
                    <td className="p-3 text-[11px] text-muted text-center">{i + 1}</td>
                    {COLUMNS.map((col, ci) => {
                      const val = task[col.key] || '';
                      const cellEdit = isEditing && editing?.col === col.key;
                      return (
                        <td key={col.key} className={'p-1.5 ' + col.w}
                          onClick={() => !cellEdit && col.editable && startEdit(task.id, col.key, val)}
                          onKeyDown={e => handleCellKeyDown(e, task.id, ci)}>
                          {cellEdit ? (
                            col.type === 'select' ? (
                              <select value={editValue} onChange={e => setEditValue(e.target.value)} 
                                onBlur={confirmEdit} autoFocus
                                className="w-full px-2 py-1.5 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none">
                                {col.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            ) : (
                              <input value={editValue} onChange={e => setEditValue(e.target.value)}
                                onBlur={confirmEdit} autoFocus
                                className="w-full px-2 py-1.5 bg-white border-2 border-[#4f46e5] rounded-lg text-xs outline-none" />
                            )
                          ) : (
                            <div className={'px-2 py-1.5 rounded-lg text-xs ' + (saving.has(task.id) ? 'opacity-50' : '') + (col.editable ? ' cursor-pointer hover:bg-gray-100/80' : '')}>
                              {col.key === 'status' ? (
                                <span className={'px-2 py-1 rounded-md text-xs font-medium ' + (statusColors[val] || 'bg-gray-100')}>{STATUSES.find(s => s.key === val)?.label || val}</span>
                              ) : col.key === 'priority' ? (
                                <span className={'px-2 py-1 rounded-md text-xs font-medium ' + (priorityColors[val] || 'bg-gray-100')}>{val ? (val === 'urgent' ? 'Khẩn cấp' : val === 'high' ? 'Cao' : val === 'medium' ? 'Trung bình' : 'Thấp') : 'Trung bình'}</span>
                              ) : col.key === 'created_at' ? (
                                formatDate(val)
                              ) : (
                                <span className={val ? 'text-[#171717]' : 'text-muted italic'}>{val || '—'}</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-1.5 text-center">
                      <button onClick={async () => { if (!confirm('Xoá?')) return; try { await api('/tasks/'+task.id,{method:'DELETE'}); setSelectedIds(prev=>{const n=new Set(prev); n.delete(task.id); return n;}); load(); } catch {} }}
                        className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={COLUMNS.length + 3} className="p-12 text-center text-sm text-muted">
                  {search ? 'Không tìm thấy công việc phù hợp' : 'Chưa có công việc nào'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-t border-border">
          <span className="text-xs text-muted">{filtered.length} công việc (hiển thị)</span>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Click ô → sửa | Tab → chuyển cột | Ctrl+C copy dòng</span>
          </div>
        </div>
      </div>
    )}
  </div>);
}