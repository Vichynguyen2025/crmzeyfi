import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, RefreshCw, Settings, ExternalLink, Wallet, DollarSign, Target, Activity, Shield, CheckCircle, AlertCircle, Ban, Check, Users, BarChart3 } from 'lucide-react';
import { api } from '../lib/api';

export default function AdsManager() {
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessTokenCfg, setAccessTokenCfg] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', adAccountId: '', bmName: '' });
  const [toast, setToast] = useState<{type:'success'|'error',message:string}|null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState<{id:string, val:string}|null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCampaigns, setShowCampaigns] = useState<any>(null);
  const [campaignHistory, setCampaignHistory] = useState<any[]>([]);
  const [showChart, setShowChart] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zeyfi_user')||'{}') : {};

  const showMsg = (type: 'success'|'error', msg: string) => {
    setToast({type, message: msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    try {
      const cfg = await api('/ads-manager/config');
      if (cfg?.access_token) { setAccessTokenCfg(cfg.access_token); }
      if (cfg?.app_id) { setAppId(cfg.app_id); setAppSecret(cfg.app_secret || ''); setConfigSaved(true); }
      const accs = await api('/ads-manager/accounts');
      setAccounts(accs || []);
      const m = await api('/ads-manager/members');
      setMembers(m || []);
      const u = await api('/users');
      setAllUsers(u || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const saveConfig = async () => {
    if (!appId || !appSecret) { showMsg('error', 'Vui lòng nhập App ID và App Secret'); return; }
    try {
      await api('/ads-manager/config', { method:'POST', body:JSON.stringify({ app_id: appId, app_secret: appSecret, access_token: accessTokenCfg }) });
      setConfigSaved(true);
      showMsg('success', 'Đã lưu cấu hình Facebook App');
    } catch (e: any) { showMsg('error', e?.message || 'Lỗi lưu cấu hình'); }
  };

  const addAccount = async () => {
    if (!newAccount.name || !newAccount.adAccountId) { showMsg('error', 'Vui lòng nhập tên và Ad Account ID'); return; }
    try {
      await api('/ads-manager/accounts', { method:'POST', body:JSON.stringify(newAccount) });
      setShowAdd(false);
      setNewAccount({ name: '', adAccountId: '', bmName: '' });
      showMsg('success', 'Đã thêm tài khoản quảng cáo');
      load();
    } catch (e: any) { showMsg('error', e?.message || 'Lỗi thêm tài khoản'); }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Xoá tài khoản quảng cáo này?')) return;
    try {
      await api('/ads-manager/accounts/' + id, { method:'DELETE' });
      showMsg('success', 'Đã xoá tài khoản');
      load();
    } catch { showMsg('error', 'Lỗi xoá'); }
  };

  const addMember = async (userId: string) => {
    if (!userId) return;
    try {
      await api('/ads-manager/members', { method:'POST', body:JSON.stringify({ userId }) });
      showMsg('success', 'Đã thêm thành viên');
      load();
    } catch (e: any) { showMsg('error', e?.message || 'Lỗi'); }
    setShowAddMember(false);
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Xoá thành viên này khỏi module Quảng cáo?')) return;
    try {
      await api('/ads-manager/members/' + userId, { method:'DELETE' });
      showMsg('success', 'Đã xoá thành viên');
      load();
    } catch (e: any) { showMsg('error', e?.message || 'Lỗi'); }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const r = await api('/ads-manager/sync', { method:'POST', body:JSON.stringify({}) });
      showMsg('success', 'Đã đồng bộ: ' + (r?.synced || 0) + ' tài khoản' + (r?.errors ? ', lỗi: ' + r.errors : ''));
      load();
    } catch (e: any) { showMsg('error', e?.message || 'Lỗi đồng bộ'); }
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

  const saveThreshold = async (id: string) => {
    if (!editThreshold) return;
    try {
      await api('/ads-manager/accounts/' + id + '/threshold', { method:'PUT', body:JSON.stringify({ billing_threshold: Number(editThreshold.val) || 0 }) });
      setEditThreshold(null);
      showMsg('success', 'Đã lưu ngưỡng thanh toán');
      load();
    } catch (e: any) { showMsg('error', e?.message || 'Lỗi lưu ngưỡng'); }
  };

  const loadCampaigns = async (accountId: string) => {
    try {
      const d = await api('/ads-manager/campaigns/' + accountId);
      setCampaigns(d || []);
    } catch {}
  };

  const loadCampaignStats = async (campaignId: string) => {
    try {
      const d = await api('/ads-manager/campaign-stats/' + campaignId);
      setCampaignHistory(d || []);
      setShowChart(campaignId);
    } catch {}
  };

  const formatCurrency = (val: number, cur?: string) => {
    if (!val && val !== 0) return '—';
    if (cur === 'VND') return Number(val).toLocaleString('vi-VN') + 'đ';
    return (val / 100).toLocaleString('vi-VN') + 'đ';
  };

  // Campaign money: raw VND value, tabular, no division
  const fmtMoney = (val: any) => {
    if (val === null || val === undefined || val === 0) return '—';
    return Number(val).toLocaleString('vi-VN') + ' ₫';
  };
  const fmtNum = (val: any) => {
    if (val === null || val === undefined || val === 0) return '—';
    return Number(val).toLocaleString('vi-VN');
  };
  const fmtPct = (val: any) => {
    if (val === null || val === undefined || val === 0) return '—';
    return Number(val).toFixed(2) + '%';
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
            <RefreshCw size={14} />{syncing ? 'Đang đồng bộ...' : 'Đồng bộ chỉ số'}
          </button>
          <button onClick={async () => {
            if (!confirm('Lấy danh sách tài khoản quảng cáo từ Meta và thêm vào CRM?')) return;
            try {
              const r = await api('/ads-manager/fetch-accounts');
              if (r?.error) { showMsg('error', r.error); return; }
              if (r?.accounts?.length > 0) {
                let ok = 0, dup = 0, fail = 0;
                const existingIds = new Set(accounts.map((a: any) => 'act_' + a.ad_account_id));
                for (const acc of r.accounts) {
                  if (existingIds.has(acc.account_id)) { dup++; continue; }
                  try {
                    await api('/ads-manager/accounts', { method:'POST', body:JSON.stringify({
                      name: acc.name, adAccountId: acc.account_id.replace(/^act_/,''), bmName: acc.business_name
                    }) });
                    ok++;
                  } catch { fail++; }
                }
                showMsg('success', `Đã thêm ${ok} tài khoản${dup ? ', bỏ qua ' + dup + ' trùng' : ''}${fail ? ', lỗi ' + fail : ''}`);
                load();
              } else {
                showMsg('error', 'Không tìm thấy tài khoản quảng cáo nào với token này');
              }
            } catch (e: any) { showMsg('error', e?.message || 'Lỗi lấy danh sách'); }
          }} disabled={!configSaved}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-40">
            <ExternalLink size={14} />Lấy từ Meta
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
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Access Token (System User Token từ BM)</label>
                <input value={accessTokenCfg} onChange={e => setAccessTokenCfg(e.target.value)} placeholder="Nhập Access Token có quyền ads_read" type="password"
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-ink outline-none transition-all focus:border-[#4f46e5]" />
              </div>
              <p className="text-xs text-muted flex items-center gap-2"><Shield size={12} />App Secret và Access Token sẽ được mã hoá và lưu an toàn</p>
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

      {/* Members section */}
      {currentUser?.role === 'admin' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gray-50/50">
            <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-2"><Users size={16} />Thành viên</h2>
            <button onClick={() => setShowAddMember(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
              <Plus size={14} />Thêm thành viên
            </button>
          </div>
          {members.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted">Chưa có thành viên nào</div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold">{m.name?.charAt(0) || '?'}</div>
                    <div>
                      <p className="text-sm font-medium text-ink">{m.name}</p>
                      <p className="text-xs text-muted">{m.email}</p>
                    </div>
                  </div>
                  <button onClick={() => removeMember(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-all" title="Xoá"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add member modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={e => e.target === e.currentTarget && setShowAddMember(false)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-96">
            <p className="text-sm font-semibold text-[#1F2937] mb-3">Thêm thành viên vào module Quảng cáo</p>
            <select onChange={e => addMember(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-sm outline-none">
              <option value="">Chọn nhân sự...</option>
              {allUsers.filter((u: any) => !members.find((m: any) => m.id === u.id)).map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} - {u.email}</option>
              ))}
            </select>
            <button onClick={() => setShowAddMember(false)} className="mt-3 px-4 py-2 text-sm text-muted rounded-lg hover:bg-gray-100 transition-all">Đóng</button>
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
                  <td className="px-4 py-3 cursor-pointer hover:text-primary transition-all" onClick={() => { loadCampaigns(acc.id); setShowCampaigns(acc); }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold shrink-0">
                        <DollarSign size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-ink truncate underline decoration-dotted">{acc.name}</p>
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
                      <span className={acc.balance > 0 ? 'text-green-600' : 'text-muted'}>{formatCurrency(acc.balance, acc.currency)}</span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">{acc.amount_spent ? formatCurrency(acc.amount_spent, acc.currency) : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3 text-right text-xs">
                    {editThreshold?.id === acc.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <input type="number" value={editThreshold.val}
                          onChange={e => setEditThreshold({...editThreshold, val: e.target.value})}
                          className="w-24 px-2 py-1 border border-border rounded-lg text-xs text-right outline-none" />
                        <button onClick={() => saveThreshold(acc.id)} className="p-1 rounded hover:text-green-600"><Check size={12} /></button>
                        <button onClick={() => setEditThreshold(null)} className="p-1 rounded hover:text-red-400"><X size={12} /></button>
                      </div>
                    ) : (
                      <span onClick={() => setEditThreshold({id: acc.id, val: String(acc.billing_threshold || '')})} className="cursor-pointer hover:text-primary transition-all" title="Nhấn để sửa ngưỡng">
                        {acc.billing_threshold != null && acc.billing_threshold !== 0 ? formatCurrency(acc.billing_threshold, acc.currency) : <span className="text-muted">Nhập ngưỡng</span>}
                      </span>
                    )}
                  </td>
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

      {/* Campaign modal */}
      {showCampaigns && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCampaigns(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ width: 'min(94vw, 1400px)', maxWidth: 1400 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#EAECF0] sticky top-0 bg-white z-10">
              <h3 className="font-bold text-[15px] text-[#101828] flex items-center gap-2.5"><Activity size={17} className="text-[#4f46e5]" />Chiến dịch của <strong>{showCampaigns.name}</strong></h3>
              <button onClick={() => setShowCampaigns(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-all text-[#98A2B3] hover:text-[#1F2937]"><X size={19} /></button>
            </div>
            {campaigns.length === 0 ? (
              <div className="px-6 py-16 text-center text-[13px] text-[#98A2B3]">Chưa có dữ liệu chiến dịch. Bấm "Đồng bộ chỉ số" để cập nhật.</div>
            ) : (
              <div className="overflow-x-auto" style={{ paddingTop: 16 }}>
                <table className="w-full border-collapse" style={{ minWidth: 1350 }}>
                  <colgroup>
                    <col style={{ width: '1.8fr', minWidth: 210 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 115 }} />
                    <col style={{ width: 125 }} />
                    <col style={{ width: 112 }} />
                    <col style={{ width: 88 }} />
                    <col style={{ width: 78 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 72 }} />
                    <col style={{ width: 78 }} />
                    <col style={{ width: 88 }} />
                    <col style={{ width: 88 }} />
                    <col style={{ width: 92 }} />
                    <col style={{ width: 86 }} />
                    <col style={{ width: 76 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ height: 44, background: '#F9FAFB', borderBottom: '1px solid #EAECF0' }}>
                      <th className="px-4 text-left font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Chiến dịch</th>
                      <th className="px-3 text-center font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Trạng thái</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Budget/ngày</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Budget trọn đời</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Chi phí</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Hiển thị</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Click</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Tin nhắn</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>CP/Tin</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>CTR</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>CPM</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>CPC</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Tiếp cận</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Tần suất</th>
                      <th className="px-3 text-center font-semibold uppercase tracking-wide" style={{ fontSize: 12, lineHeight: '16px', color: '#667085', whiteSpace: 'nowrap' }}>Chart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp: any) => (
                      <tr key={camp.campaign_id} style={{ height: 50, borderBottom: '1px solid #EAECF0', transition: 'background .15s' }} className="hover:bg-[#F9FAFB]">
                        <td className="px-4" style={{ maxWidth: 0 }}>
                          <p className="font-medium text-[13px] text-[#1F2937] truncate" style={{ lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={camp.name}>{camp.name}</p>
                        </td>
                        <td className="px-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-full text-[11px] font-semibold"
                            style={{ height: 24, padding: '0 8px', whiteSpace: 'nowrap',
                              background: camp.status === 'ACTIVE' ? '#ECFDF3' : camp.status === 'PAUSED' ? '#FFFAEB' : '#F2F4F7',
                              color: camp.status === 'ACTIVE' ? '#027A48' : camp.status === 'PAUSED' ? '#B54708' : '#475467' }}>
                            {camp.status || '—'}
                          </span>
                        </td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] whitespace-nowrap tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(camp.daily_budget)}</td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] whitespace-nowrap tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(camp.lifetime_budget)}</td>
                        <td className="px-3 text-right text-[13px] font-medium text-[#1F2937] whitespace-nowrap tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(camp.last_spend)}</td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(camp.last_impressions)}</td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(camp.last_clicks)}</td>
                        <td className="px-3 text-right text-[13px] font-medium text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(camp.last_messages)}</td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] whitespace-nowrap tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(camp.last_cost_per_message)}</td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtPct(camp.last_ctr)}</td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] whitespace-nowrap tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(camp.last_cpm)}</td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] whitespace-nowrap tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(camp.last_cpc)}</td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(camp.last_reach)}</td>
                        <td className="px-3 text-right text-[13px] text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{camp.last_frequency ? Number(camp.last_frequency).toFixed(1) : <span className="text-[#98A2B3]">—</span>}</td>
                        <td className="px-3 text-center">
                          <button onClick={() => loadCampaignStats(camp.campaign_id)} title="Xem biểu đồ"
                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold text-[#4f46e5] hover:bg-[#EEF2FF] transition-all"
                            style={{ height: 28, padding: '0 8px' }}>
                            <BarChart3 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {showChart && campaignHistory.length > 0 && (
              <div className="px-6 py-4 border-t border-[#EAECF0]">
                <h4 className="text-sm font-bold text-[#1F2937] mb-2.5">Biểu đồ chiến dịch (30 ngày)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse" style={{ minWidth: 760 }}>
                    <colgroup>
                      <col style={{ width: 110 }} />
                      <col style={{ width: 110 }} />
                      <col style={{ width: 100 }} />
                      <col style={{ width: 80 }} />
                      <col style={{ width: 80 }} />
                      <col style={{ width: 100 }} />
                      <col style={{ width: 100 }} />
                      <col style={{ width: 100 }} />
                    </colgroup>
                    <thead><tr style={{ background: '#F9FAFB', borderBottom: '1px solid #EAECF0', height: 36 }}>
                      <th className="px-3 text-left font-semibold uppercase tracking-wide" style={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>Ngày</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>Chi phí</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>Hiển thị</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>Click</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>CTR</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>CPM</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>CPC</th>
                      <th className="px-3 text-right font-semibold uppercase tracking-wide" style={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>Tiếp cận</th>
                    </tr></thead>
                    <tbody>
                      {campaignHistory.slice(-30).map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #EAECF0', height: 34 }} className="hover:bg-[#F9FAFB]">
                          <td className="px-3 text-[12px] text-[#475467] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.date}</td>
                          <td className="px-3 text-right text-[12px] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(s.spend)}</td>
                          <td className="px-3 text-right text-[12px] text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(s.impressions)}</td>
                          <td className="px-3 text-right text-[12px] text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(s.clicks)}</td>
                          <td className="px-3 text-right text-[12px] text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtPct(s.ctr)}</td>
                          <td className="px-3 text-right text-[12px] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(s.cpm)}</td>
                          <td className="px-3 text-right text-[12px] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(s.cpc)}</td>
                          <td className="px-3 text-right text-[12px] text-[#1F2937] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(s.reach)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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