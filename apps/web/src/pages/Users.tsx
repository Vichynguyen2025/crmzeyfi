import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Shield, Trash2, X, Mail, UserCog } from 'lucide-react';
import { api } from '../lib/api';

const ROLE_LABELS: Record<string,string> = {admin:'Quản trị',manager:'Quản lý',member:'Thành viên'};
const ROLE_COLORS: Record<string,string> = {admin:'bg-purple-50 text-purple-600',manager:'bg-blue-50 text-blue-600',member:'bg-gray-100 text-muted'};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [add, setAdd] = useState(false);
  const [form, setForm] = useState({name:'', email:'', password:'', role:'member'});
  const [msg, setMsg] = useState('');

  const load = () => { api('/users').then(setUsers).catch(() => {}); };
  useEffect(load, []);

  const addUser = async () => {
    if (!form.name || !form.email || !form.password) { setMsg('Vui lòng nhập đầy đủ'); return; }
    try {
      await api('/auth/register', { method:'POST', body:JSON.stringify(form) });
      setAdd(false); setForm({name:'',email:'',password:'',role:'member'}); setMsg(''); load();
    } catch (e: any) { setMsg(e.message); }
  };

  const changeRole = async (id: string, role: string) => {
    await api('/users/' + id + '/role', { method:'PUT', body:JSON.stringify({role}) });
    load();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Xoá người dùng này?')) return;
    await api('/users/' + id, { method:'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#171717]">Quản lý tài khoản</h1><p className="text-sm text-muted mt-1">Thêm và phân quyền người dùng</p></div>
        <button onClick={() => setAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
          <Plus size={18} />Thêm tài khoản
        </button>
      </div>

      {msg && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">{msg}</div>}

      {add && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Tạo tài khoản mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Họ tên" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="Email" type="email" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="Mật khẩu" type="password" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <select value={form.role} onChange={e => setForm({...form,role:e.target.value})} className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25">
              <option value="member">Thành viên</option>
              <option value="manager">Quản lý</option>
              <option value="admin">Quản trị</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={addUser} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:shadow-md">Tạo tài khoản</button>
            <button onClick={() => { setAdd(false); setMsg(''); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium">Huỷ</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Người dùng</th>
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Vai trò</th>
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Ngày tạo</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border hover:bg-gray-50 transition-all">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-[#171717]">{u.name}</p>
                      <p className="text-xs text-muted flex items-center gap-1"><Mail size={11} />{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    className={'px-3 py-1.5 rounded-xl text-xs font-medium border-0 outline-none cursor-pointer ' + (ROLE_COLORS[u.role] || 'bg-gray-100 text-muted')}>
                    <option value="admin">Quản trị</option>
                    <option value="manager">Quản lý</option>
                    <option value="member">Thành viên</option>
                  </select>
                </td>
                <td className="p-4 text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                <td className="p-4">
                  <button onClick={() => deleteUser(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-all" title="Xoá">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}