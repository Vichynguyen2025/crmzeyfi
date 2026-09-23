import { useState, useEffect } from 'react';
import { Plus, X, Edit3, Trash2, Package, CheckCircle, AlertCircle, DollarSign, Tag, Users } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const CATEGORIES = ['Dịch vụ', 'Sản phẩm', 'Khóa học', 'Sự kiện', 'Tài liệu', 'Khác'];
const STATUS_COLORS: Record<string,string> = {active: 'bg-green-50 text-green-600', inactive: 'bg-gray-100 text-muted', draft: 'bg-amber-50 text-amber-600'};
const STATUS_LABELS: Record<string,string> = {active: 'Đang bán', inactive: 'Ngừng bán', draft: 'Bản nháp'};

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({ name:'', description:'', price:'', category:'', teamId:'', status:'active' });
  const [toast, setToast] = useState<{type:'success'|'error',message:string}|null>(null);

  const showToast = (t: 'success'|'error', msg: string) => {
    setToast({type:t, message:msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => { api('/products').then(setProducts); api('/teams').then(setTeams); };
  useEffect(load, []);

  useEffect(() => {
    const sock = getSocket();
    const h = () => load();
    sock.on('product:update', h);
    return () => sock.off('product:update', h);
  }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      if (edit) {
        await api('/products/' + edit.id, { method:'PUT', body:JSON.stringify(form) });
        showToast('success', 'Đã cập nhật "' + form.name + '"');
      } else {
        await api('/products', { method:'POST', body:JSON.stringify(form) });
        showToast('success', 'Đã thêm "' + form.name + '"');
      }
      setShowAdd(false); setEdit(null);
      setForm({ name:'', description:'', price:'', category:'', teamId:'', status:'active' });
      load();
    } catch { showToast('error', 'Lỗi lưu dữ liệu'); }
  };

  const deleteProduct = async (p: any) => {
    if (!confirm('Xoá "' + p.name + '"?')) return;
    try { await api('/products/' + p.id, { method:'DELETE' }); showToast('success', 'Đã xoá "' + p.name + '"'); load(); }
    catch { showToast('error', 'Lỗi xoá'); }
  };

  const openEdit = (p: any) => {
    setEdit(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price || '0'), category: p.category || '', teamId: p.team_id || '', status: p.status || 'active' });
    setShowAdd(true);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink">Quản lý sản phẩm</h1><p className="text-sm text-muted mt-1">Sản phẩm, dịch vụ, dữ liệu chung cho các team</p></div>
        <button onClick={() => { setEdit(null); setForm({name:'',description:'',price:'',category:'',teamId:'',status:'active'}); setShowAdd(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all">
          <Plus size={18} />Thêm sản phẩm
        </button>
      </div>

      {(showAdd || edit) && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">{edit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Tên sản phẩm *</label>
              <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="VD: Gói Marketing Pro"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Danh mục</label>
              <select value={form.category} onChange={e => setForm({...form,category:e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25">
                <option value="">Chọn danh mục</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Giá (VNĐ)</label>
              <input value={form.price} onChange={e => setForm({...form,price:e.target.value})} placeholder="0" type="number"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 focus:border-[#4f46e5]" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Team phụ trách</label>
              <select value={form.teamId} onChange={e => setForm({...form,teamId:e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25">
                <option value="">Tất cả team</option>
                {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Trạng thái</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#4f46e5]/25">
                <option value="active">Đang bán</option>
                <option value="draft">Bản nháp</option>
                <option value="inactive">Ngừng bán</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted mb-1.5 block">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Mô tả sản phẩm..." rows={2}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:ring-2 focus:ring-[#4f46e5]/25 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:shadow-md transition-all">{edit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button>
            <button onClick={() => { setShowAdd(false); setEdit(null); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-muted rounded-xl text-sm font-medium transition-all">Huỷ</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-border shadow-sm p-5 hover:shadow-md transition-all group relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 grid place-items-center">
                  <Package size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink truncate">{p.name}</h3>
                  <span className={'px-2.5 py-0.5 rounded-full text-xs font-medium ' + (STATUS_COLORS[p.status] || 'bg-gray-100')}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit3 size={14} /></button>
                  <button onClick={() => deleteProduct(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>

              {p.description && <p className="text-xs text-muted mb-3 line-clamp-2">{p.description}</p>}

              <div className="flex flex-wrap gap-3 text-xs pt-3 border-t border-border">
                <span className="flex items-center gap-1 font-semibold"><DollarSign size={12} className="text-green-500" />{Number(p.price || 0).toLocaleString('vi-VN')}đ</span>
                {p.category && <span className="flex items-center gap-1 text-muted"><Tag size={12} />{p.category}</span>}
                {p.teamName && <span className="flex items-center gap-1 text-muted"><Users size={12} />{p.teamName}</span>}
              </div>
              {p.createdByName && <p className="text-xs text-muted mt-2">Tạo bởi: {p.createdByName}</p>}
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted">
              <Package size={56} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">Chưa có sản phẩm</p>
              <p className="text-sm mt-1">Thêm sản phẩm/dịch vụ để các team sử dụng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}