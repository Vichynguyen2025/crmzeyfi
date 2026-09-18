import { useState, useEffect } from 'react';
import { Plus, Phone, Mail, MapPin, Globe, FileText, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [add, setAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [form, setForm] = useState({name:'', phone:'', email:'', address:'', source:'', social:'', notes:'', teamId:''});

  useEffect(() => { api('/customers').then(setCustomers); }, []);

  const addCustomer = async () => {
    if (!form.name.trim()) return;
    await api('/customers', { method:'POST', body:JSON.stringify(form) });
    setForm({name:'', phone:'', email:'', address:'', source:'', social:'', notes:'', teamId:''});
    setAdd(false);
    api('/customers').then(setCustomers);
  };

  const contact = async (id: string) => {
    const note = prompt('Ghi chú chăm sóc:');
    if (note === null) return;
    await api('/customers/' + id + '/contact', { method:'PUT', body:JSON.stringify({ note: note || '' }) });
    api('/customers').then(setCustomers);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#171717]">Khách hàng</h1><p className="text-sm text-muted mt-1">Quản lý danh sách khách hàng và chăm sóc</p></div>
        <button onClick={() => setAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
          <Plus size={18} />Thêm KH
        </button>
      </div>

      {add && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Thông tin khách hàng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Họ tên *" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="Số điện thoại" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="Email" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="Địa chỉ" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.source} onChange={e => setForm({...form,source:e.target.value})} placeholder="Nguồn (Facebook, Zalo, Giới thiệu...)" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.social} onChange={e => setForm({...form,social:e.target.value})} placeholder="Social (Facebook, Zalo...)" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
          </div>
          <textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Ghi chú" rows={3}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 resize-none" />
          <div className="flex gap-3 pt-2">
            <button onClick={addCustomer} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:shadow-md transition-all">Thêm khách hàng</button>
            <button onClick={() => setAdd(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium transition-all">Huỷ</button>
          </div>
        </div>
      )}

      {/* Customer list */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Khách hàng</th>
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Liên hệ</th>
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Nguồn</th>
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">CSKH</th>
              <th className="text-center p-4 font-semibold text-muted text-xs uppercase tracking-wider">Trạng thái</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-b border-border hover:bg-gray-50 transition-all">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">
                      {c.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-[#171717]">{c.name}</p>
                      <p className="text-xs text-muted">{c.email || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    {c.phone && <p className="flex items-center gap-1.5 text-muted"><Phone size={12} />{c.phone}</p>}
                    {c.address && <p className="flex items-center gap-1.5 text-muted"><MapPin size={12} className="shrink-0" />{c.address}</p>}
                  </div>
                </td>
                <td className="p-4">
                  {c.source ? <span className="px-3 py-1 bg-indigo-50 text-[#4f46e5] rounded-full text-xs font-medium">{c.source}</span> : <span className="text-muted">—</span>}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                    <MessageCircle size={12} />{c.contactCount} lần
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={'px-3 py-1 rounded-full text-xs font-medium ' + (
                    c.status === 'new' ? 'bg-blue-50 text-blue-600' :
                    c.status === 'contacted' ? 'bg-amber-50 text-amber-600' :
                    c.status === 'qualified' ? 'bg-green-50 text-green-600' :
                    'bg-gray-100 text-muted'
                  )}>
                    {c.status === 'new' ? 'Mới' : c.status === 'contacted' ? 'Đã liên hệ' : c.status === 'qualified' ? 'Tiềm năng' : c.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => contact(c.id)} className="px-3 py-1.5 bg-[#4f46e5] text-white rounded-lg text-xs font-medium hover:bg-[#4338ca] transition-all">
                      + CSKH
                    </button>
                    <button onClick={() => setShowDetail(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted" title="Xem chi tiết">
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer detail modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white font-bold">
                  {showDetail.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div><h3 className="font-bold text-[#171717] text-lg">{showDetail.name}</h3><p className="text-sm text-muted">{showDetail.email || '—'}</p></div>
              </div>
              <button onClick={() => setShowDetail(null)} className="p-2 rounded-lg hover:bg-gray-100"><ChevronUp size={18} /></button>
            </div>
            <div className="border-t border-border pt-4 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted mb-1">Số điện thoại</p><p className="font-medium">{showDetail.phone || '—'}</p></div>
              <div><p className="text-muted mb-1">Nguồn</p><p className="font-medium">{showDetail.source || '—'}</p></div>
              <div className="col-span-2"><p className="text-muted mb-1">Địa chỉ</p><p className="font-medium">{showDetail.address || '—'}</p></div>
              <div className="col-span-2"><p className="text-muted mb-1">Social</p><p className="font-medium">{showDetail.social || '—'}</p></div>
              <div className="col-span-2"><p className="text-muted mb-1">Ghi chú</p><p className="font-medium">{showDetail.notes || '—'}</p></div>
              <div><p className="text-muted mb-1">Đã CSKH</p><p className="font-medium">{showDetail.contactCount} lần</p></div>
              <div><p className="text-muted mb-1">Lần cuối</p><p className="font-medium">{showDetail.lastContact || '—'}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}