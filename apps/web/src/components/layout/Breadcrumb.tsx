import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'teams': 'Kinh doanh 3M',
  'reports': 'Báo cáo',
  'kanban': 'Công việc',
  'customers': 'Khách hàng',
  'ad-costs': 'Chi phí QC',
  'calendar': 'Lịch',
  'users': 'Tài khoản',
  'user': 'Nhân sự',
  'drive': 'Kho dữ liệu',
  'channels': 'Kênh Marketing',
  'products': 'Sản phẩm',
  'new': 'Thêm mới',
  'edit': 'Chỉnh sửa',
};

export default function Breadcrumb() {
  const loc = useLocation();
  const nav = useNavigate();
  const parts = loc.pathname.replace('/crm/', '').split('/').filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-sm mb-4">
      <button onClick={() => nav('/crm/dashboard')} className="text-muted hover:text-primary transition-all">CRM</button>
      {parts.map((part, i) => {
        const label = ROUTE_LABELS[part] || decodeURIComponent(part);
        const path = '/crm/' + parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            <ChevronRight size={13} className="text-muted/60" />
            {isLast ? (
              <span className="font-medium text-[#171717]">{label}</span>
            ) : (
              <button onClick={() => nav(path)} className="text-muted hover:text-primary transition-all">{label}</button>
            )}
          </span>
        );
      })}
    </div>
  );
}