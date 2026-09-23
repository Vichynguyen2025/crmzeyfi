import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, UserCog, ScrollText, Settings as SettingsIcon, X, Lock, CheckCircle2, XCircle, Radio, Table2 } from 'lucide-react';
import { api } from '../lib/api';

const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'users', label: 'Tài khoản', icon: '👤' },
  { key: 'teams', label: 'Kinh doanh 3M', icon: '📦' },
  { key: 'drive', label: 'Kho dữ liệu', icon: '📁' },
  { key: 'channels', label: 'Kênh Marketing', icon: '📢' },
  { key: 'products', label: 'Sản phẩm', icon: '🏷️' },
  { key: 'marketing', label: 'Marketing eSim', icon: '📱' },
  { key: 'reports', label: 'Báo cáo', icon: '📋' },
  { key: 'customers', label: 'Khách hàng', icon: '🤝' },
  { key: 'seo', label: 'SEO', icon: '🔍' },
];

const TABLE_DEFS = [
  { key: 'b1', label: 'Bảng 1 — Mục tiêu & Ngân sách' },
  { key: 'b2', label: 'Bảng 2 — Tình hình Thực tế' },
  { key: 'b3', label: 'Bảng 3 — Chi tiết hiệu suất' },
  { key: 'b4', label: 'Bảng 4 — Kênh Marketing' },
];

const TABS = [
  { key: 'teams', label: 'Theo Team', icon: Users },
  { key: 'users', label: 'Theo Nhân sự', icon: UserCog },
  { key: 'settings', label: 'Cài đặt', icon: SettingsIcon },
  { key: 'tables', label: 'Quyền bảng', icon: Table2 },
  { key: 'logs', label: 'Hoạt động', icon: ScrollText },
];

export default function AdminPermissions() {
  const [tab, setTab] = useState('teams');
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teamPerms, setTeamPerms] = useState<Record<string, string[]>>({});
  const [userPerms, setUserPerms] = useState<Record<string, string[]>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [tablePerms, setTablePerms] = useState<Record<string, string[]>>({});
  const [userTablePerms, setUserTablePerms] = useState<Record<string, string[]>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [wsStatus, setWsStatus] = useState<'offline' | 'online'>('offline');

  const load = useCallback(async () => {
    try {
      const [tData, pData, uData, upData, sData, lData, tpData, utpData] = await Promise.all([
        api('/teams'),
        api('/team-modules'),
        api('/users'),
        api('/user-modules'),
        api('/settings'),
        api('/activity-logs?limit=50'),
        api('/team-table-perms'),
        api('/user-table-perms'),
      ]);
      setTeams(tData || []);
      setUsers(uData || []);
      setLogs(lData || []);
      const tp: Record<string, string[]> = {};
      (pData || []).forEach((p: any) => { (tp[p.team_id] = tp[p.team_id] || []).push(p.module_key); });
      setTeamPerms(tp);
      const up: Record<string, string[]> = {};
      (upData || []).forEach((p: any) => { (up[p.user_id] = up[p.user_id] || []).push(p.module_key); });
      setUserPerms(up);
      const sm: Record<string, string> = {};
      (sData || []).forEach((s: any) => sm[s.setting_key] = s.setting_value);
      setSettings(sm);
      const tpm: Record<string, string[]> = {};
      (tpData || []).forEach((p: any) => { (tpm[p.team_id] = tpm[p.team_id] || []).push(p.table_key); });
      setTablePerms(tpm);
      const utpm: Record<string, string[]> = {};
      (utpData || []).forEach((p: any) => { (utpm[p.user_id] = utpm[p.user_id] || []).push(p.table_key); });
      setUserTablePerms(utpm);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime logs via Socket.IO
  useEffect(() => {
    let sock: any = null;
    try {
      const { io } = require('socket.io-client');
      sock = io(window.location.origin, { path: '/socket.io' });
      sock.on('connect', () => setWsStatus('online'));
      sock.on('disconnect', () => setWsStatus('offline'));
      sock.on('activity:new', (e: any) => { setLogs(prev => [e, ...prev].slice(0, 100)); });
      sock.on('settings:update', (e: any) => { setSettings(prev => ({ ...prev, [e.key]: String(e.value) })); });
      sock.on('modules:update', (e: any) => { load(); });
    } catch { /* socket optional */ }
    return () => { try { sock?.disconnect(); } catch {} };
  }, [load]);

  const toggleTeamMod = async (teamId: string, moduleKey: string, add: boolean) => {
    setSaving('t' + teamId + moduleKey);
    try {
      await api('/team-modules/toggle', { method: 'POST', body: JSON.stringify({ teamId, moduleKey, add }) });
      setTeamPerms(prev => {
        const next = { ...prev };
        if (add) { next[teamId] = [...(next[teamId] || []), moduleKey]; }
        else { next[teamId] = (next[teamId] || []).filter(k => k !== moduleKey); }
        return next;
      });
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    setSaving(null);
  };

  const toggleUserMod = async (userId: string, moduleKey: string, add: boolean) => {
    setSaving('u' + userId + moduleKey);
    try {
      await api('/user-modules/toggle', { method: 'POST', body: JSON.stringify({ userId, moduleKey, add }) });
      setUserPerms(prev => {
        const next = { ...prev };
        if (add) { next[userId] = [...(next[userId] || []), moduleKey]; }
        else { next[userId] = (next[userId] || []).filter(k => k !== moduleKey); }
        return next;
      });
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    setSaving(null);
  };

  const toggleTablePerm = async (teamId: string, tableKey: string, add: boolean) => {
    setSaving('b' + teamId + tableKey);
    try {
      await api('/team-table-perms/toggle', { method: 'POST', body: JSON.stringify({ teamId, tableKey, add }) });
      setTablePerms(prev => {
        const next = { ...prev };
        if (add) { next[teamId] = [...(next[teamId] || []), tableKey]; }
        else { next[teamId] = (next[teamId] || []).filter(k => k !== tableKey); }
        return next;
      });
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    setSaving(null);
  };

  const toggleUserTablePerm = async (userId: string, tableKey: string, add: boolean) => {
    setSaving('ub' + userId + tableKey);
    try {
      await api('/user-table-perms/toggle', { method: 'POST', body: JSON.stringify({ userId, tableKey, add }) });
      setUserTablePerms(prev => {
        const next = { ...prev };
        if (add) { next[userId] = [...(next[userId] || []), tableKey]; }
        else { next[userId] = (next[userId] || []).filter(k => k !== tableKey); }
        return next;
      });
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    setSaving(null);
  };

  const updateSetting = async (key: string, value: string) => {
    await api('/settings/' + key, { method: 'PUT', body: JSON.stringify({ value }) });
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const filteredTeams = teams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = users.filter(u => !search || (u.name || '').toLowerCase().includes(search.toLowerCase()));

  const actionColor = (a: string) => a === 'grant' ? 'bg-green-50 text-green-600' : a === 'revoke' ? 'bg-red-50 text-red-600' : a === 'update' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600';
  const actionLabel = (a: string) => a === 'grant' ? 'Cấp quyền' : a === 'revoke' ? 'Thu hồi' : a === 'update' ? 'Cập nhật' : 'Thao tác';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Shield size={22} className="text-primary" /> Phân quyền & Quản trị
          </h1>
          <p className="text-sm text-muted mt-1">Quản lý quyền truy cập module theo team, nhân sự, cài đặt hệ thống</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${wsStatus === 'online' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <Radio size={12} /> {wsStatus === 'online' ? 'Realtime' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-border p-1 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
            className={'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ' + (tab === t.key ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-ink hover:bg-gray-50')}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'teams' && (
        <>
          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-border">
            <p className="text-sm text-muted">Bật/tắt module cho từng team. Click team để xem chi tiết.</p>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm team..." className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
          </div>
          {filteredTeams.map(team => {
            const mods = teamPerms[team.id] || [];
            const open = expanded === team.id;
            const allOn = mods.length === ALL_MODULES.length;
            return (
              <div key={team.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-all" onClick={() => setExpanded(open ? null : team.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold">{(team.name || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-semibold text-sm">{team.name}</p>
                      <p className="text-xs text-muted">{mods.length}/{ALL_MODULES.length} module · {mods.map(k => ALL_MODULES.find(m => m.key === k)?.label).filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted">{allOn ? 'Toàn quyền' : mods.length + ' module'}</span>
                </div>
                {open && (
                <>
                  <div className="px-5 py-4 border-t border-border bg-gray-50/30 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {ALL_MODULES.map(mod => {
                      const has = mods.includes(mod.key);
                      const isSaving = saving === 't' + team.id + mod.key;
                      return (
                        <button key={mod.key} onClick={() => toggleTeamMod(team.id, mod.key, !has)} disabled={isSaving}
                          className={'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left ' + (has ? 'bg-indigo-50 border-indigo-200 text-primary' : 'bg-white border-border text-muted hover:border-indigo-200') + (isSaving ? ' opacity-50' : '')}>
                          <span className="text-sm">{mod.icon}</span><span className="flex-1">{mod.label}</span>
                          <span className={'w-5 h-5 rounded-full grid place-items-center text-xs ' + (has ? 'bg-primary text-white' : 'bg-gray-100 text-muted')}>{has ? '✓' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
                )}
              </div>
            );
          })}
        </>
      )}

      {tab === 'users' && (
        <>
          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-border">
            <p className="text-sm text-muted">Gán module bổ sung cho nhân sự (ngoài quyền team). Admin luôn có toàn quyền.</p>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân sự..." className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
          </div>
          {filteredUsers.filter(u => u.role !== 'admin').map(user => {
            const mods = userPerms[user.id] || [];
            const open = expanded === 'u' + user.id;
            return (
              <div key={user.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-all" onClick={() => setExpanded(open ? null : 'u' + user.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white text-xs font-bold">{(user.name || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted">{user.email} · {mods.length > 0 ? 'Thêm ' + mods.length + ' module' : 'Theo quyền team'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted">{user.role}</span>
                </div>
                {open && (
                  <>
                  <div className="px-5 py-4 border-t border-border bg-gray-50/30 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {ALL_MODULES.map(mod => {
                      const has = mods.includes(mod.key);
                      const isSaving = saving === 'u' + user.id + mod.key;
                      return (
                        <button key={mod.key} onClick={() => toggleUserMod(user.id, mod.key, !has)} disabled={isSaving}
                          className={'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left ' + (has ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-border text-muted hover:border-emerald-200') + (isSaving ? ' opacity-50' : '')}>
                          <span className="text-sm">{mod.icon}</span><span className="flex-1">{mod.label}</span>
                          <span className={'w-5 h-5 rounded-full grid place-items-center text-xs ' + (has ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-muted')}>{has ? '+' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs font-medium text-muted mb-2 mt-4">Quyền bảng B1-B4 (hợp với quyền team)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TABLE_DEFS.map(tbl => {
                      const has = (userTablePerms[user.id] || []).includes(tbl.key);
                      const isSaving = saving === 'ub' + user.id + tbl.key;
                      return (
                        <button key={tbl.key} onClick={() => toggleUserTablePerm(user.id, tbl.key, !has)} disabled={isSaving}
                          className={'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left ' + (has ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-white border-border text-muted hover:border-violet-200') + (isSaving ? ' opacity-50' : '')}>
                          <span className="flex-1">{tbl.label}</span>
                          <span className={'w-5 h-5 rounded-full grid place-items-center text-xs shrink-0 ' + (has ? 'bg-violet-500 text-white' : 'bg-gray-100 text-muted')}>{has ? '✓' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}

      {tab === 'settings' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2"><SettingsIcon size={16} className="text-primary" /> Cài đặt hệ thống</h3>
          {[
            { key: 'upload_limit_mb', label: 'Giới hạn upload (MB)', desc: 'Dung lượng tối đa mỗi file', type: 'number' },
            { key: 'allow_registration', label: 'Mở đăng ký tài khoản', desc: 'Cho phép user tự đăng ký', type: 'bool' },
            { key: 'marketing_enabled', label: 'Module Marketing eSim', type: 'bool' },
            { key: 'seo_enabled', label: 'Module SEO', type: 'bool' },
            { key: 'drive_enabled', label: 'Module Kho dữ liệu', type: 'bool' },
            { key: 'teams_enabled', label: 'Module Kinh doanh 3M', type: 'bool' },
            { key: 'reports_enabled', label: 'Module Báo cáo', type: 'bool' },
            { key: 'customers_enabled', label: 'Module Khách hàng', type: 'bool' },
            { key: 'channels_enabled', label: 'Module Kênh Marketing', type: 'bool' },
            { key: 'products_enabled', label: 'Module Sản phẩm', type: 'bool' },
            { key: 'users_enabled', label: 'Module Tài khoản', type: 'bool' },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                {s.desc && <p className="text-xs text-muted">{s.desc}</p>}
              </div>
              {s.type === 'bool' ? (
                <button onClick={() => updateSetting(s.key, settings[s.key] === 'true' ? 'false' : 'true')}
                  className={'relative w-11 h-6 rounded-full transition-all ' + (settings[s.key] === 'true' ? 'bg-primary' : 'bg-gray-200')}>
                  <span className={'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ' + (settings[s.key] === 'true' ? 'left-[22px]' : 'left-0.5')} />
                </button>
              ) : (
                <input type="number" value={settings[s.key] || ''} onChange={e => updateSetting(s.key, e.target.value)}
                  className="w-28 px-3 py-1.5 bg-white border border-border rounded-lg text-sm outline-none text-right" />
              )}
            </div>
          ))}
        </div>
      )}

      
      {tab === 'tables' && (
        <>
          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-border">
            <p className="text-sm text-muted">Bật/tắt quyền <b>chỉnh sửa</b> từng bảng (B1-B4) cho team. Không có quyền → bảng hiển thị chỉ đọc.</p>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm team..." className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none" />
          </div>
          {filteredTeams.map(team => {
            const mods = tablePerms[team.id] || [];
            return (
              <div key={team.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center text-white text-xs font-bold">{(team.name || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-medium text-sm">{team.name}</p>
                      <p className="text-xs text-muted">{mods.length}/4 bảng được phép sửa</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted">{mods.length === 4 ? 'Toàn quyền' : mods.length + ' bảng'}</span>
                </div>
                <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {TABLE_DEFS.map(tbl => {
                    const has = mods.includes(tbl.key);
                    const isSaving = saving === 'b' + team.id + tbl.key;
                    return (
                      <button key={tbl.key} onClick={() => toggleTablePerm(team.id, tbl.key, !has)} disabled={isSaving}
                        className={'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left ' + (has ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-white border-border text-muted hover:border-violet-200') + (isSaving ? ' opacity-50' : '')}>
                        <span className="flex-1">{tbl.label}</span>
                        <span className={'w-5 h-5 rounded-full grid place-items-center text-xs shrink-0 ' + (has ? 'bg-violet-500 text-white' : 'bg-gray-100 text-muted')}>{has ? '✓' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

{tab === 'logs' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-gray-50/60 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><ScrollText size={16} className="text-primary" /> Nhật ký hoạt động</h3>
            <span className="text-xs text-muted">{logs.length} gần nhất · realtime</span>
          </div>
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {logs.length === 0 && <div className="px-5 py-12 text-center text-sm text-muted">Chưa có hoạt động nào</div>}
            {logs.map((log, i) => (
              <div key={log.id || i} className="px-5 py-2.5 flex items-start gap-3 hover:bg-gray-50/60 transition-all">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold mt-0.5 shrink-0">{(log.user_name || '?').charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs"><span className="font-medium">{log.user_name || 'Hệ thống'}</span> <span className="mx-1">·</span>
                    <span className={'inline-block px-1.5 py-0.5 rounded-md text-xs font-medium ' + actionColor(log.action)}>{actionLabel(log.action)}</span>
                    <span className="mx-1">·</span><span className="font-medium">{log.module}</span></p>
                  <p className="text-xs text-muted mt-0.5 truncate">{log.entity}{log.detail ? ' — ' + log.detail : ''}</p>
                </div>
                <span className="text-xs text-muted shrink-0">{new Date(log.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}