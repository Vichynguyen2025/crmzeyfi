import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function CalendarPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  useEffect(() => { api('/tasks').then(setTasks); }, []);

  const days = Array.from({length: new Date(year, month+1, 0).getDate()}, (_,i) => i+1);
  const first = new Date(year, month, 1).getDay();
  const all = Array(first).fill(null).concat(days);

  const today = (d: number) => d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

  return (<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">Lịch công việc</h1>
      <div className="flex items-center gap-3">
        <button onClick={() => month===0 ? (setMonth(11), setYear(y=>y-1)) : setMonth(m=>m-1)} className="px-3 py-1.5 bg-white border border-border rounded-xl text-sm">&larr;</button>
        <span className="font-semibold">Tháng {month+1} {year}</span>
        <button onClick={() => month===11 ? (setMonth(0), setYear(y=>y+1)) : setMonth(m=>m+1)} className="px-3 py-1.5 bg-white border border-border rounded-xl text-sm">&rarr;</button>
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-border">{['CN','T2','T3','T4','T5','T6','T7'].map(d => <div key={d} className="p-3 text-center text-xs font-semibold text-muted">{d}</div>)}</div>
      <div className="grid grid-cols-7">{all.map((d,i) => (
        <div key={i} className={'min-h-[90px] p-2 border-b border-r border-border '+(today(d as number)?'bg-indigo-50':'')}>
          {d && <span className="text-xs font-medium text-muted">{d as number}</span>}
          {d && tasks.filter((t:any) => t.due_date && new Date(t.due_date).getDate() === d && new Date(t.due_date).getMonth() === month).map((t:any) => <div key={t.id} className="mt-1 px-2 py-1 bg-[#eef2ff] text-primary rounded-lg text-xs truncate">{t.title}</div>)}
        </div>
      ))}</div>
    </div>
  </div>);
}