import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const nav = useNavigate();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Vui lòng nhập đầy đủ'); return; }
    setLoading(true); setError('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('zeyfi_token', data.accessToken);
      localStorage.setItem('zeyfi_user', JSON.stringify(data.user));
      nav('/dashboard');
    } catch (e: any) { setError(e.message || 'Lỗi đăng nhập'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-indigo-100/60 border border-[#e6e9f2]/60 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white font-bold text-xl mx-auto mb-4">Z</div>
          <h1 className="text-2xl font-bold text-[#171717]">Chào bạn trở lại</h1>
          <p className="text-sm text-[#6b7280] mt-1">CRM Zeyfi - Quản trị team marketing</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>}
        <form onSubmit={handle} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e6e9f2] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
          <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e6e9f2] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-center text-sm text-[#6b7280] mt-6">
          Chưa có tài khoản? <a href="/register" className="text-[#4f46e5] font-semibold hover:underline">Đăng ký</a>
        </p>
      </div>
    </div>
  );
}