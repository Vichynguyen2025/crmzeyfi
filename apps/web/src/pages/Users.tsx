import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Shield, Trash2, X, Mail, Phone, Edit3, Ban, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

const ROLE_LABELS: Record<string,string> = {admin:'Quản trị',manager:'Quản lý',member:'Nhân sự'};
const ROLE_COLORS: Record<string,string> = {admin:'bg-purple-50 text-purple-600',manager:'bg-blue-50 text-blue-600',member:'bg-green-50 text-green-600'};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [add, setAdd] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({name:'', email:'', phone:'', password:'', role:'member'});
  const [msg, setMsg] = useState('');

  const load = () => { api('/users').then(setUsers).catch(() => {}); };
  useEffect(load, []);

  const addUser = async () => {
    if (!form.name || (!form.email && !form.phone) || !form.password) { setMsg('Vui lòng nhập họ tên, email/số điện thoại và mật khẩu'); return; }
    try {
      await api('/auth/register', { method:'POST', body:JSON.stringify(form) });
      setAdd(false); setForm({name:'',email:'',phone:'',password:'',role:'member'}); setMsg(''); load();
    } catch (e: any) { setMsg(e.message); }
  };

  const changeRole = async (id: string, role: string) => {
    await api('/users/' + id + '/role', { method:'PUT', body:JSON.stringify({role}) });
    load();
  };

  const toggleBlock = async (id: string, blocked: boolean) => {
    await api('/users/' + id + '/block', { method:'PUT', body:JSON.stringify({blocked: !blocked}) });
    load();
  };

  const saveEdit = async () => {
    if (!edit) return;
    await api('/users/' + edit.id, { method:'PUT', body:JSON.stringify({name: edit.name, email: edit.email, phone: edit.phone, position: edit.position}) });
    setEdit(null); load();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Xoá người dùng này?')) return;
    await api('/users/' + id, { method:'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#171717]">Quản lý nhân sự</h1><p className="text-sm text-muted mt-1">Thêm, sửa, khoá, phân quyền tài khoản</p></div>
        <button onClick={() => setAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
          <Plus size={18} />Thêm nhân sự
        </button>
      </div>

      {msg && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">{msg}</div>}

      {add && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Thêm nhân sự mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Họ tên *" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="Email" type="email" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="Số điện thoại" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="Mật khẩu *" type="password" className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <select value={form.role} onChange={e => setForm({...form,role:e.target.value})} className="px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25">
              <option value="member">Nhân sự</option>
              <option value="manager">Quản lý</option>
              <option value="admin">Quản trị</option>
            </select>
            <p className="text-xs text-muted flex items-center">Nhập email hoặc số điện thoại để đăng nhập</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={addUser} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:shadow-md">Tạo tài khoản</button>
            <button onClick={() => { setAdd(false); setMsg(''); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium">Huỷ</button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEdit(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Sửa thông tin</h3>
              <button onClick={() => setEdit(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <input value={edit.name} onChange={e => setEdit({...edit,name:e.target.value})} placeholder="Họ tên" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={edit.email} onChange={e => setEdit({...edit,email:e.target.value})} placeholder="Email" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={edit.phone || ''} onChange={e => setEdit({...edit,phone:e.target.value})} placeholder="Số điện thoại" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <input value={edit.position || ''} onChange={e => setEdit({...edit,position:e.target.value})} placeholder="Chức vụ" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
            <div className="flex gap-3">
              <button onClick={saveEdit} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:shadow-md">Lưu</button>
              <button onClick={() => setEdit(null)} className="px-5 py-2.5 bg-gray-100 text-muted rounded-xl text-sm font-medium">Huỷ</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Nhân sự</th>
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Liên hệ</th>
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Vai trò</th>
              <th className="text-left p-4 font-semibold text-muted text-xs uppercase tracking-wider">Trạng thái</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={'border-b border-border hover:bg-gray-50 transition-all ' + (u.is_blocked ? 'opacity-60' : '')}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-[#171717]">{u.name}</p>
                      {u.position && <p className="text-xs text-muted">{u.position}</p>}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-0.5">
                    {u.email && <p className="flex items-center gap-1.5 text-xs text-muted"><Mail size={11} />{u.email}</p>}
                    {u.phone && <p className="flex items-center gap-1.5 text-xs text-muted"><Phone size={11} />{u.phone}</p>}
                  </div>
                </td>
                <td className="p-4">
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    className={'px-3 py-1.5 rounded-xl text-xs font-medium border-0 outline-none cursor-pointer ' + (ROLE_COLORS[u.role] || 'bg-gray-100 text-muted')}>
                    <option value="admin">Quản trị</option>
                    <option value="manager">Quản lý</option>
                    <option value="member">Nhân sự</option>
                  </select>
                </td>
                <td className="p-4">
                  {u.is_blocked ? (
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">Bị khoá</span>
                  ) : (
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">Hoạt động</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEdit(u)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-all" title="Sửa">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => toggleBlock(u.id, u.is_blocked)} className={'p-2 rounded-lg transition-all ' + (u.is_blocked ? 'hover:bg-green-50 text-green-500' : 'hover:bg-red-50 text-red-500')} title={u.is_blocked ? 'Mở khoá' : 'Khoá'}>
                      {u.is_blocked ? <CheckCircle size={15} /> : <Ban size={15} />}
                    </button>
                    <button onClick={() => deleteUser(u.id)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all" title="Xoá">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}