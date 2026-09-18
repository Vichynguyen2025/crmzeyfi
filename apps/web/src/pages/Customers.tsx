import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [add, setAdd] = useState(false); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  useEffect(() => { api('/customers').then(setCustomers); }, []);

  return (<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">Khách hàng</h1>
      <button onClick={() => setAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-medium"><Plus size={18} />Thêm KH</button></div>
    {add && <div className="bg-white rounded-2xl border border-border p-4 mb-6 flex gap-3">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên" className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="SĐT" className="w-48 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
      <button onClick={async () => { await api('/customers',{method:'POST',body:JSON.stringify({name,phone,teamId:''})}); setName(''); setPhone(''); setAdd(false); }} className="px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium">Thêm</button>
      <button onClick={() => setAdd(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm">Huỷ</button>
    </div>}
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border bg-gray-50">
          <th className="text-left p-4 font-semibold text-muted">Tên</th><th className="text-left p-4 font-semibold text-muted">SĐT</th>
          <th className="text-left p-4 font-semibold text-muted">Đã liên hệ</th><th className="text-left p-4 font-semibold text-muted">Trạng thái</th>
          <th className="p-4"></th>
        </tr></thead>
        <tbody>{customers.map(c => <tr key={c.id} className="border-b border-border hover:bg-gray-50">
          <td className="p-4 font-medium">{c.name}</td><td className="p-4 text-muted">{c.phone||'—'}</td>
          <td className="p-4"><span className="px-3 py-1 bg-indigo-50 text-primary rounded-full text-xs font-medium">{c.contactCount} lần</span></td>
          <td className="p-4">{c.status==='new'?'Mới':'Đã liên hệ'}</td>
          <td className="p-4"><button onClick={async () => { await api('/customers/'+c.id+'/contact',{method:'PUT',body:JSON.stringify({note:''})}); }} className="px-3 py-1.5 bg-[#4f46e5] text-white rounded-lg text-xs font-medium">+ CSKH</button></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>);
}