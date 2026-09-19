import { useState, useEffect } from 'react';
import { Plus, X, Trash2, LayoutGrid, List } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const STATUSES = [
  { key: 'todo', label: 'Cần làm', color: '#6b7280' },
  { key: 'in_progress', label: 'Đang làm', color: '#f59e0b' },
  { key: 'review', label: 'Kiểm tra', color: '#4f46e5' },
  { key: 'done', label: 'Hoàn thành', color: '#22c55e' },
];

const STATUS_ICONS: Record<string, string> = {
  todo: '🔴', in_progress: '🟡', review: '🟣', done: '🟢',
};

export default function Kanban() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState(''); const [show, setShow] = useState(false);
  const [drag, setDrag] = useState<any>(null);
  const [view, setView] = useState<'kanban' | 'sheet'>('kanban');
  const [editTask, setEditTask] = useState<any>(null);
  const [editField, setEditField] = useState('');
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zeyfi_user') || '{}') : {};
  const isAdmin = user.role === 'admin' || user.role === 'manager';

  const load = () => api('/tasks').then(setTasks);
  useEffect(() => { load();
    const sock = getSocket();
    sock.on('task:new', load); sock.on('task:updated', load); sock.on('task:deleted', load);
    return () => { sock.off('task:new'); sock.off('task:updated'); sock.off('task:deleted'); };
  }, []);

  const deleteTask = async (id: string) => {
    if (!confirm('Xoá task này?')) return;
    try { await api('/tasks/' + id, { method: 'DELETE' }); setTasks(tasks.filter(t => t.id !== id)); } catch {}
  };

  const move = async (id: string, status: string) => {
    const idx = tasks.filter(t => t.status === status).length;
    await api('/tasks/'+id+'/status', {method:'PUT',body:JSON.stringify({status,position:idx})});
    setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, status, position: idx} : t));
  };

  const updateField = async (id: string, field: string, value: string) => {
    await api('/tasks/' + id, { method:'PUT', body:JSON.stringify({[field]: value}) });
    setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, [field]: value} : t));
    setEditTask(null); setEditField('');
  };

  const updateCell = (id: string, field: string, value: string) => {
    setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, [field]: value} : t));
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-red-100 text-red-700', in_progress: 'bg-amber-100 text-amber-700',
    review: 'bg-indigo-100 text-indigo-700', done: 'bg-green-100 text-green-700',
  };

  return (<div>
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
      <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"><Plus size={18} />Thêm task</button>
    </div>

    {/* Add task form */}
    {show && <div className="bg-white rounded-2xl border border-border p-4 mb-6 flex gap-3 shadow-sm">
      <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key==='Enter' && (async () => { await api('/tasks',{method:'POST',body:JSON.stringify({title,teamId:'',status:'todo'})}); setTitle(''); setShow(false); load(); })()} placeholder="Tên task..." autoFocus className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
      <button onClick={async () => { await api('/tasks',{method:'POST',body:JSON.stringify({title,teamId:'',status:'todo'})}); setTitle(''); setShow(false); load(); }} className="px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:shadow-md">Thêm</button>
      <button onClick={() => setShow(false)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
    </div>}

    {/* Kanban Board View */}
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
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 size={12} /></button>
                    )}
                  </div>
                  {task.assigneeName && <p className="text-xs text-muted mt-1.5 flex items-center gap-1">👤 {task.assigneeName}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Sheet / Table View */}
    {view === 'sheet' && (
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-gray-50/80">
                <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-8">#</th>
                <th className="p-3 text-xs font-semibold text-muted uppercase text-left min-w-[200px]">Tên công việc</th>
                <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-28">Trạng thái</th>
                <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-32">Người thực hiện</th>
                <th className="p-3 text-xs font-semibold text-muted uppercase text-left w-28">Độ ưu tiên</th>
                <th className="p-3 text-xs font-semibold text-muted uppercase text-center w-12"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr key={task.id} className="border-b border-border hover:bg-gray-50 transition-all">
                  <td className="p-3 text-xs text-muted text-center">{i + 1}</td>
                  <td className="p-3">
                    {editTask === task.id && editField === 'title' ? (
                      <input autoFocus value={task.title} onChange={e => updateCell(task.id, 'title', e.target.value)}
                        onBlur={() => updateField(task.id, 'title', task.title)}
                        onKeyDown={e => e.key === 'Enter' && updateField(task.id, 'title', task.title)}
                        className="w-full px-2 py-1 border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
                    ) : (
                      <span className="text-xs font-medium text-[#171717] cursor-pointer hover:text-[#4f46e5]"
                        onClick={() => { setEditTask(task.id); setEditField('title'); }}>{task.title}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <select value={task.status} onChange={e => updateField(task.id, 'status', e.target.value)}
                      className={'text-xs px-2 py-1 rounded-lg border-0 font-medium outline-none cursor-pointer ' + (statusColors[task.status] || 'bg-gray-100')}>
                      {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-muted">{task.assigneeName || <span className="italic">—</span>}</td>
                  <td className="p-3">
                    <span className={'text-xs px-2 py-1 rounded-lg font-medium ' + (
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                      task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    )}>{task.priority || 'medium'}</span>
                  </td>
                  <td className="p-3 text-center">
                    {isAdmin && (
                      <button onClick={() => deleteTask(task.id)} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xoá">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-sm text-muted">Chưa có công việc nào. Thêm task mới.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>);
}