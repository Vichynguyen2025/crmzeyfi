import { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Lock, Save, CheckCircle, AlertCircle, Eye, EyeOff, Briefcase, FileText } from 'lucide-react';
import { api } from '../lib/api';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', position: '', bio: '' });
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [toast, setToast] = useState<{type:'success'|'error', message:string} | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({type, message});
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('zeyfi_user') || '{}');
    setUser(u);
    setForm({ name: u.name || '', phone: u.phone || '', position: u.position || '', bio: u.bio || '' });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api('/auth/me', { method:'PUT', body:JSON.stringify(form) });
      const u = JSON.parse(localStorage.getItem('zeyfi_user') || '{}');
      u.name = form.name; u.phone = form.phone;
      localStorage.setItem('zeyfi_user', JSON.stringify(u));
      showToast('success', 'Đã cập nhật thông tin');
    } catch { showToast('error', 'Lỗi cập nhật'); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (pwd.newPwd !== pwd.confirm) { showToast('error', 'Mật khẩu mới không khớp'); return; }
    if (pwd.newPwd.length < 6) { showToast('error', 'Mật khẩu phải >= 6 ký tự'); return; }
    setChangingPwd(true);
    try {
      await api('/auth/password', { method:'PUT', body:JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.newPwd }) });
      showToast('success', 'Đã đổi mật khẩu');
      setPwd({ current: '', newPwd: '', confirm: '' });
    } catch (e: any) { showToast('error', e.message || 'Sai mật khẩu hiện tại'); }
    setChangingPwd(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && (
        <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#171717]">Thông tin tài khoản</h1>
        <p className="text-sm text-[#808080] mt-1">Quản lý thông tin cá nhân và bảo mật</p>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{boxShadow:'rgba(0,0,0,0.04) 0px 1px 2px'}}>
        <div className="px-6 py-5 border-b border-border bg-[#fafafa] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-[#171717]">{user?.name || 'Chưa có tên'}</p>
            <p className="text-xs text-[#808080]">{user?.email}</p>
          </div>
          <div className="ml-auto">
            <span className={'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ' + (user?.role === 'admin' ? 'bg-purple-50 text-purple-600' : user?.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600')}>
              <Shield size={12} />
              {user?.role === 'admin' ? 'Quản trị' : user?.role === 'manager' ? 'Quản lý' : 'Nhân sự'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#808080] mb-1.5"><User size={13} />Họ tên</label>
              <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Nhập họ tên..." className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-[#171717] outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#808080] mb-1.5"><Phone size={13} />Số điện thoại</label>
              <input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="Nhập số điện thoại..." className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-[#171717] outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#808080] mb-1.5"><Briefcase size={13} />Chức vụ</label>
              <input value={form.position} onChange={e => setForm({...form, position:e.target.value})} placeholder="Nhập chức vụ..." className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-[#171717] outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#808080] mb-1.5"><Mail size={13} />Email</label>
              <input value={user?.email || ''} disabled className="w-full px-4 py-2.5 bg-[#fafafa] border border-border rounded-xl text-sm text-[#808080] outline-none cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#808080] mb-1.5"><FileText size={13} />Giới thiệu</label>
            <textarea value={form.bio} onChange={e => setForm({...form, bio:e.target.value})} placeholder="Đôi nét về bạn..." rows={3} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-[#171717] outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] resize-none" />
          </div>
          <div className="flex justify-end">
            <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50">
              <Save size={16} />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{boxShadow:'rgba(0,0,0,0.04) 0px 1px 2px'}}>
        <div className="px-6 py-5 border-b border-border bg-[#fafafa] flex items-center gap-3">
          <Lock size={18} className="text-[#808080]" />
          <p className="font-semibold text-[#171717]">Đổi mật khẩu</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#808080] mb-1.5">Mật khẩu hiện tại</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={pwd.current} onChange={e => setPwd({...pwd, current:e.target.value})} placeholder="••••••••" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-[#171717] outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] pr-10" />
              <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-[#171717]">{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#808080] mb-1.5">Mật khẩu mới</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={pwd.newPwd} onChange={e => setPwd({...pwd, newPwd:e.target.value})} placeholder="••••••••" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-[#171717] outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5] pr-10" />
                <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-[#171717]">{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#808080] mb-1.5">Xác nhận mật khẩu mới</label>
              <input type={showNew ? 'text' : 'password'} value={pwd.confirm} onChange={e => setPwd({...pwd, confirm:e.target.value})} placeholder="••••••••" className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-[#171717] outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={changePassword} disabled={changingPwd || !pwd.current || !pwd.newPwd} className="flex items-center gap-2 px-5 py-2.5 bg-[#171717] text-white font-semibold rounded-xl text-sm hover:bg-[#333] transition-all disabled:opacity-50">
              <Lock size={16} />{changingPwd ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}