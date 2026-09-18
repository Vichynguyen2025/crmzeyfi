import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, KanbanSquare, PhoneCall, DollarSign, Calendar, UserCog, HardDrive, Globe, LogOut, ChevronLeft, ChevronRight, Package } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Tài khoản', icon: UserCog, path: '/users' },
  { label: 'Kinh doanh 3M', icon: Users, path: '/teams' },
  { label: 'Kho dữ liệu', icon: HardDrive, path: '/drive' },
  { label: 'Kênh Marketing', icon: Globe, path: '/channels' },
  { label: 'Sản phẩm', icon: Package, path: '/products' },
  { label: 'Báo cáo', icon: ClipboardList, path: '/reports' },
  { label: 'Kanban', icon: KanbanSquare, path: '/kanban' },
  { label: 'Khách hàng', icon: PhoneCall, path: '/customers' },
  { label: 'Chi phí QC', icon: DollarSign, path: '/ad-costs' },
  { label: 'Lịch', icon: Calendar, path: '/calendar' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const user = JSON.parse(localStorage.getItem('zeyfi_user') || '{}');

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
          return (
            <button key={item.path} onClick={() => nav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}>
              <Icon size={20} className={active ? 'text-primary' : ''} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
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