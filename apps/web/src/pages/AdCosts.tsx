import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';

export default function AdCosts() {
  const [costs, setCosts] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({platform:'Facebook',amount:0,description:''});
  useEffect(() => { api('/ad-costs').then(setCosts); }, []);

  return (<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">Chi phí quảng cáo</h1>
      <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-medium"><Plus size={18} />Thêm</button></div>
    {show && <div className="bg-white rounded-2xl border border-border p-4 mb-6 grid grid-cols-4 gap-3">
      <select value={form.platform} onChange={e => setForm({...form,platform:e.target.value})} className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none"><option>Facebook</option><option>Google</option><option>TikTok</option><option>Zalo</option></select>
      <input type="number" placeholder="Số tiền" value={form.amount} onChange={e => setForm({...form,amount:Number(e.target.value)})} className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
      <input value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Mô tả" className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
      <div className="flex gap-2"><button onClick={async () => { await api('/ad-costs',{method:'POST',body:JSON.stringify({...form,teamId:'',date:new Date().toISOString().slice(0,10)})}); setShow(false); }} className="px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium">Lưu</button><button onClick={() => setShow(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm">Huỷ</button></div>
    </div>}
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-sm"><thead><tr className="border-b border-border bg-gray-50"><th className="text-left p-4 font-semibold text-muted">Ngày</th><th className="text-left p-4 font-semibold text-muted">Platform</th><th className="text-left p-4 font-semibold text-muted">Số tiền</th><th className="text-left p-4 font-semibold text-muted">Mô tả</th></tr></thead>
      <tbody>{costs.map(c => <tr key={c.id} className="border-b border-border hover:bg-gray-50"><td className="p-4">{c.date}</td><td className="p-4"><span className="px-3 py-1 bg-indigo-50 text-primary rounded-full text-xs font-medium">{c.platform}</span></td><td className="p-4 font-semibold">{Number(c.amount).toLocaleString('vi-VN')}đ</td><td className="p-4 text-muted">{c.description||'—'}</td></tr>)}</tbody></table>
    </div>
  </div>);
}