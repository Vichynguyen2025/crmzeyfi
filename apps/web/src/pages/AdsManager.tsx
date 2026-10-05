import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, RefreshCw, Settings, ExternalLink, Wallet, DollarSign, Target, Activity, Shield, CheckCircle, AlertCircle, Ban } from 'lucide-react';
import { api } from '../lib/api';

export default function AdsManager() {
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', adAccountId: '', bmName: '' });
  const [toast, setToast] = useState<{type:'success'|'error',message:string}|null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const showMsg = (type: 'success'|'error', msg: string) => {
    setToast({type, message: msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    try {
      const cfg = await api('/ads-manager/config');
      if (cfg?.app_id) { setAppId(cfg.app_id); setAppSecret(cfg.app_secret || ''); setConfigSaved(true); }
      const accs = await api('/ads-manager/accounts');
      setAccounts(accs || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const saveConfig = async () => {
    if (!appId || !appSecret) { showMsg('error', 'Vui lòng nhập App ID và App Secret'); return; }
    try {
      await api('/ads-manager/config', { method:'POST', body:JSON.stringify({ app_id: appId, app_secret: appSecret }) });
      setConfigSaved(true);
      showMsg('success', 'Đã lưu cấu hình Facebook App');
    } catch { showMsg('error', 'Lỗi lưu cấu hình'); }
  };

  const addAccount = async () => {
    if (!newAccount.name || !newAccount.adAccountId) { showMsg('error', 'Vui lòng nhập tên và Ad Account ID'); return; }
    try {
      await api('/ads-manager/accounts', { method:'POST', body:JSON.stringify(newAccount) });
      setShowAdd(false);
      setNewAccount({ name: '', adAccountId: '', bmName: '' });
      showMsg('success', 'Đã thêm tài khoản quảng cáo');
      load();
    } catch { showMsg('error', 'Lỗi thêm tài khoản'); }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Xoá tài khoản quảng cáo này?')) return;
    try {
      await api('/ads-manager/accounts/' + id, { method:'DELETE' });
      showMsg('success', 'Đã xoá tài khoản');
      load();
    } catch { showMsg('error', 'Lỗi xoá'); }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const r = await api('/ads-manager/sync', { method:'POST', body:JSON.stringify({}) });
      if (r?.error) { showMsg('error', r.error); }
      else { showMsg('success', 'Đã đồng bộ: ' + (r?.synced || 0) + ' tài khoản' + (r?.errors ? ', lỗi: ' + r.errors : '')); }
      load();
    } catch { showMsg('error', 'Lỗi đồng bộ'); }
    setSyncing(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    setToggling(id);
    try {
      await api('/ads-manager/accounts/' + id + '/toggle', { method:'PUT', body:JSON.stringify({ active: !active }) });
      load();
    } catch { showMsg('error', 'Lỗi cập nhật'); }
    setToggling(null);
  };

  const formatCurrency = (val: number) => {
    if (!val) return '—';
    return (val / 100).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center">
            <DollarSign size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1F2937]">Quản lý Quảng cáo</h1>
            <p className="text-sm text-muted">Quản lý tài khoản Facebook Ads · Số dư · Chi phí · Ngưỡng thanh toán</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowConfig(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
            <Settings size={14} />Cấu hình App
          </button>
          <button onClick={syncAll} disabled={syncing || !configSaved}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-all disabled:opacity-40">
            <RefreshCw size={14} />{syncing ? 'Đang đồng bộ...' : 'Đồng bộ từ Facebook'}
          </button>
        </div>
      </div>

      {/* Config modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowConfig(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base flex items-center gap-2"><Settings size={18} />Cấu hình Facebook App</h3>
              <button onClick={() => setShowConfig(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">App ID</label>
                <input value={appId} onChange={e => setAppId(e.target.value)} placeholder="Nhập Facebook App ID"
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:border-[#4f46e5]" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">App Secret (khoá ứng dụng)</label>
                <input value={appSecret} onChange={e => setAppSecret(e.target.value)} placeholder="Nhập App Secret" type="password"
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:border-[#4f46e5]" />
              </div>
              <p className="text-xs text-muted flex items-center gap-2"><Shield size={12} />App Secret sẽ được mã hoá và lưu an toàn trong database</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveConfig} className="px-5 py-2.5 bg-[#4f46e5] text-white font-semibold rounded-xl text-sm hover:shadow-md transition-all">
                {configSaved ? 'Cập nhật' : 'Lưu cấu hình'}
              </button>
              <button onClick={() => setShowConfig(false)} className="px-5 py-2.5 bg-gray-100 text-muted rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">Huỷ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add account modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base">Thêm tài khoản quảng cáo</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                placeholder="Tên hiển thị (VD: BM Tech - Tài khoản chính)"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:border-[#4f46e5]" />
              <input value={newAccount.adAccountId} onChange={e => setNewAccount({...newAccount, adAccountId: e.target.value})}
                placeholder="Ad Account ID (VD: act_123456789)"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:border-[#4f46e5]" />
              <input value={newAccount.bmName} onChange={e => setNewAccount({...newAccount, bmName: e.target.value})}
                placeholder="Business Manager (VD: BM Tech)"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:border-[#4f46e5]" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={addAccount} className="px-5 py-2.5 bg-[#4f46e5] text-white font-semibold rounded-xl text-sm hover:shadow-md transition-all"><Plus size={14} />Thêm</button>
              <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 bg-gray-100 text-muted rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">Huỷ</button>
            </div>
          </div>
        </div>
      )}

      {/* Config status bar */}
      {!configSaved && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-sm text-amber-700">
          <Settings size={18} />
          <span>Chưa cấu hình Facebook App. Nhấn <strong>"Cấu hình App"</strong> để nhập App ID và App Secret trước.</span>
        </div>
      )}

      {/* Accounts table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gray-50/50">
          <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
            <Wallet size={16} />Tài khoản quảng cáo
            <span className="px-2 py-0.5 bg-[#4f46e5]/10 text-[#4f46e5] rounded-full text-xs font-medium">{accounts.length}</span>
          </h2>
          <button onClick={() => setShowAdd(true)} disabled={!configSaved}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-40">
            <Plus size={14} />Thêm tài khoản
          </button>
        </div>
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-48" />
            <col className="w-36" />
            <col className="w-32" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-24" />
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-24" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-muted text-xs uppercase tracking-wider">Tên / Mô tả</th>
              <th className="px-4 py-3 text-left font-semibold text-muted text-xs uppercase tracking-wider">Ad Account ID</th>
              <th className="px-4 py-3 text-left font-semibold text-muted text-xs uppercase tracking-wider">Business Manager</th>
              <th className="px-4 py-3 text-right font-semibold text-muted text-xs uppercase tracking-wider">Số dư</th>
              <th className="px-4 py-3 text-right font-semibold text-muted text-xs uppercase tracking-wider">Đã chi</th>
              <th className="px-4 py-3 text-right font-semibold text-muted text-xs uppercase tracking-wider">Ngưỡng TT</th>
              <th className="px-4 py-3 text-right font-semibold text-muted text-xs uppercase tracking-wider">Hạn mức</th>
              <th className="px-4 py-3 text-center font-semibold text-muted text-xs uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-center font-semibold text-muted text-xs uppercase tracking-wider">Theo dõi</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-16 text-center">
                  <Wallet size={48} className="mx-auto mb-4 opacity-20 text-muted" />
                  <p className="font-medium text-muted">Chưa có tài khoản quảng cáo</p>
                  <p className="text-xs text-muted mt-1">Nhấn "Thêm tài khoản" để bắt đầu</p>
                </td>
              </tr>
            )}
            {accounts.map((acc: any) => {
              const isActive = acc.active !== false;
              const hasError = acc.sync_error ? true : false;
              return (
                <tr key={acc.id} className={'border-b border-border hover:bg-gray-50 transition-all' + (isActive ? '' : ' opacity-50')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">
                        <DollarSign size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-ink truncate">{acc.name}</p>
                        {acc.last_sync_at && <p className="text-xs text-muted">Đồng bộ: {new Date(acc.last_sync_at).toLocaleString('vi-VN')}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-muted font-mono">{acc.ad_account_id}</code>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{acc.bm_name || '—'}</td>
                  <td className="px-4 py-3 text-right text-xs font-medium">
                    {acc.balance !== null ? (
                      <span className={acc.balance > 0 ? 'text-green-600' : 'text-muted'}>{formatCurrency(acc.balance)}</span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">{acc.amount_spent ? formatCurrency(acc.amount_spent) : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3 text-right text-xs">{acc.billing_threshold ? formatCurrency(acc.billing_threshold) : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3 text-right text-xs">{acc.spend_cap ? formatCurrency(acc.spend_cap) : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3 text-center">
                    {hasError ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium" title={acc.sync_error}><Ban size={10} />Lỗi</span>
                    ) : acc.account_status === 1 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs font-medium"><Activity size={10} />Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-muted rounded-full text-xs font-medium">{acc.account_status || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(acc.id, isActive)} disabled={toggling === acc.id}
                      className={'inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ' + (isActive ? 'bg-green-50/60 text-green-700' : 'bg-gray-100 text-muted')}>
                      {isActive ? 'Đang theo dõi' : 'Tạm dừng'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => deleteAccount(acc.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all text-muted" title="Xoá">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info card */}
      <div className="bg-gradient-to-r from-indigo-50/50 to-transparent border border-indigo-100 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <ExternalLink size={20} className="text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1F2937]">Hướng dẫn</p>
            <p className="text-xs text-muted mt-0.5">
              Tạo Facebook App tại <strong>developers.facebook.com</strong> → Thêm sản phẩm "Marketing API" → 
              Cấp quyền <strong>ads_read</strong> → Cài app vào Business Manager → 
              Nhập App ID + Secret ở đây. Sau đó thêm Ad Account ID (dạng <code>act_...</code>) của từng tài khoản quảng cáo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}