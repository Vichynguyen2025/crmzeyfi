import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { LayoutDashboard, UserCog, Users, HardDrive, Globe, LogOut, ChevronLeft, ChevronRight, Package, BarChart3, ClipboardList, PhoneCall, Shield, Lock, User } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/crm/dashboard', module: 'dashboard' },
  { label: 'Tài khoản', icon: UserCog, path: '/crm/users', module: 'users' },
  { label: 'Kinh doanh 3M', icon: Users, path: '/crm/teams', module: 'teams' },
  { label: 'Kho dữ liệu', icon: HardDrive, path: '/crm/drive', module: 'drive' },
  { label: 'Kênh Marketing', icon: Globe, path: '/crm/channels', module: 'channels' },
  { label: 'Sản phẩm', icon: Package, path: '/crm/products', module: 'products' },
  { label: 'Marketing eSim', icon: BarChart3, path: '/crm/marketing', module: 'marketing' },
  { label: 'Báo cáo', icon: ClipboardList, path: '/crm/reports', module: 'reports' },
  { label: 'Hồ sơ', icon: User, path: '/crm/profile', module: 'profile' },
  { label: 'Khách hàng', icon: PhoneCall, path: '/crm/customers', module: 'customers' },
  { label: 'SEO', icon: BarChart3, path: '/crm/seo', module: 'seo' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [userModules, setUserModules] = useState<string[]>([]);
  const [lockedPath, setLockedPath] = useState<string | null>(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('zeyfi_user') || '{}');
    if (u.role === 'admin') { setUserModules(['*']); return; }
    api('/my-modules').then((mods: string[]) => setUserModules(mods || [])).catch(() => setUserModules([]));
  }, []);

  const nav = useNavigate();
  const loc = useLocation();
  const user = JSON.parse(localStorage.getItem('zeyfi_user') || '{}');
  const isAdmin = user.role === 'admin' || userModules.includes('*');

  const canAccess = (module: string) => isAdmin || userModules.includes(module);

  const handleNav = (item: any) => {
    if (item.module === 'profile' || canAccess(item.module)) {
      nav(item.path);
    } else {
      setLockedPath(item.path);
      setTimeout(() => setLockedPath(null), 2500);
    }
  };

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} transition-all relative duration-300 bg-[#1e1b4b] text-white flex flex-col shrink-0`}>
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white font-bold text-sm">Z</div>
        {!collapsed && <span className="font-bold text-lg tracking-tight">Zeyfi CRM</span>}
      </div>
      <nav className="flex-1 py-4 space-y-1 px-3">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = loc.pathname.startsWith(item.path);
          const locked = item.module !== 'profile' && !canAccess(item.module);
          return (
            <button key={item.path} onClick={() => handleNav(item)}
              title={locked ? 'Bạn không có quyền truy cập' : item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active ? 'bg-white/10 text-white shadow-sm' : locked ? 'text-white/30 hover:bg-white/5 hover:text-white/50' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}>
              <Icon size={20} className={active ? 'text-primary' : ''} />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {locked && <Lock size={12} className="text-white/20 shrink-0" />}
            </button>
          );
        })}
        {isAdmin && (
          <button onClick={() => nav('/crm/admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${loc.pathname.startsWith('/crm/admin') ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}>
            <Shield size={20} className={loc.pathname.startsWith('/crm/admin') ? 'text-primary' : ''} />
            {!collapsed && <span className="flex-1 text-left">Phân quyền</span>}
          </button>
        )}
      </nav>

      {lockedPath && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium shadow-xl animate-slide-in flex items-center gap-2">
          <Lock size={16} /> Bạn không có quyền truy cập
        </div>
      )}

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold">
            {(user.name || '?').charAt(0).toUpperCase()}
          </div>
          {!collapsed && <div className="text-sm"><p className="font-medium truncate">{user.name || 'User'}</p><p className="text-xs text-white/50">{user.role}</p></div>}
        </div>
        <button onClick={() => { localStorage.removeItem('zeyfi_token'); localStorage.removeItem('zeyfi_user'); nav('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5">
          <LogOut size={18} /><span>Đăng xuất</span>
        </button>
      </div>
      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-20 -right-3 w-6 h-6 rounded-full bg-[#1e1b4b] border border-white/10 grid place-items-center text-white/50 hover:text-white">
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}