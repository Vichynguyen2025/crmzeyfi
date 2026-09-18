import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const STATUSES = [
  { key: 'todo', label: 'Cần làm', color: '#6b7280' },
  { key: 'in_progress', label: 'Đang làm', color: '#f59e0b' },
  { key: 'review', label: 'Kiểm tra', color: '#4f46e5' },
  { key: 'done', label: 'Hoàn thành', color: '#22c55e' },
];

export default function Kanban() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState(''); const [show, setShow] = useState(false);
  const [drag, setDrag] = useState<any>(null);

  useEffect(() => { api('/tasks').then(setTasks); const sock = getSocket(); sock.on('task:new', () => api('/tasks').then(setTasks)); sock.on('task:updated', () => api('/tasks').then(setTasks)); sock.on('task:deleted', () => api('/tasks').then(setTasks)); return () => { sock.off('task:new'); sock.off('task:updated'); sock.off('task:deleted'); }; }, []);

  const move = async (id: string, status: string) => {
    const idx = tasks.filter(t => t.status === status).length;
    await api('/tasks/'+id+'/status', {method:'PUT',body:JSON.stringify({status,position:idx})});
    setTasks((prev: any[]) => prev.map(t => t.id === id ? {...t, status, position: idx} : t));
  };

  return (<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">Kanban</h1>
      <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-medium"><Plus size={18} />Thêm task</button></div>
    {show && <div className="bg-white rounded-2xl border border-border p-4 mb-6 flex gap-3">
      <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key==='Enter' && (async () => { await api('/tasks',{method:'POST',body:JSON.stringify({title,teamId:'',status:'todo'})}); setTitle(''); setShow(false); })()} placeholder="Tên task" autoFocus className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/25" />
      <button onClick={async () => { await api('/tasks',{method:'POST',body:JSON.stringify({title,teamId:'',status:'todo'})}); setTitle(''); setShow(false); }} className="px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium">Thêm</button>
      <button onClick={() => setShow(false)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
    </div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{STATUSES.map(s => (
      <div key={s.key} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if(drag) move(drag.id, s.key); setDrag(null); }}
        className="bg-gray-50 rounded-2xl p-4 min-h-[200px] border border-border">
        <div className="flex items-center gap-2 mb-4"><div className="w-3 h-3 rounded-full" style={{backgroundColor:s.color}} /><h3 className="font-semibold text-sm">{s.label}</h3><span className="text-xs text-muted ml-auto">{tasks.filter(t => t.status === s.key).length}</span></div>
        <div className="space-y-3">{tasks.filter(t => t.status === s.key).map(task => (
          <div key={task.id} draggable onDragStart={() => setDrag(task)} className="bg-white rounded-xl p-4 border border-border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all">
            <p className="font-medium text-sm">{task.title}</p>
            {task.assigneeName && <p className="text-xs text-muted mt-1">{task.assigneeName}</p>}
          </div>
        ))}</div>
      </div>
    ))}</div>
  </div>);
}