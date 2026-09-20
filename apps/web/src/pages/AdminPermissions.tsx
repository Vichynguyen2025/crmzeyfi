import { useState, useEffect } from 'react';
import { Shield, Lock, X } from 'lucide-react';
import { api } from '../lib/api';

const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', color: 'from-indigo-500 to-blue-500' },
  { key: 'users', label: 'Tài khoản', icon: '👤', color: 'from-purple-500 to-violet-500' },
  { key: 'teams', label: 'Kinh doanh 3M', icon: '📦', color: 'from-blue-500 to-cyan-500' },
  { key: 'drive', label: 'Kho dữ liệu', icon: '📁', color: 'from-amber-500 to-orange-500' },
  { key: 'channels', label: 'Kênh Marketing', icon: '📢', color: 'from-pink-500 to-rose-500' },
  { key: 'products', label: 'Sản phẩm', icon: '🏷️', color: 'from-green-500 to-emerald-500' },
  { key: 'marketing', label: 'Marketing eSim', icon: '📱', color: 'from-teal-500 to-cyan-500' },
  { key: 'reports', label: 'Báo cáo', icon: '📋', color: 'from-orange-500 to-amber-500' },
  { key: 'customers', label: 'Khách hàng', icon: '🤝', color: 'from-rose-500 to-pink-500' },
  { key: 'seo', label: 'SEO', icon: '🔍', color: 'from-violet-500 to-purple-500' },
];

export default function AdminPermissions() {
  const [teams, setTeams] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [tData, pData] = await Promise.all([
        api('/teams'),
        api('/team-modules'),
      ]);
      setTeams(tData || []);
      const permMap: Record<string, string[]> = {};
      (pData || []).forEach((p: any) => {
        if (!permMap[p.team_id]) permMap[p.team_id] = [];
        permMap[p.team_id].push(p.module_key);
      });
      setPermissions(permMap);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const toggle = async (teamId: string, moduleKey: string, add: boolean) => {
    setSaving(teamId + moduleKey);
    try {
      await api('/team-modules/toggle', {
        method: 'POST',
        body: JSON.stringify({ teamId, moduleKey, add })
      });
      setPermissions(prev => {
        const updated = { ...prev };
        if (add) {
          updated[teamId] = [...(updated[teamId] || []), moduleKey];
        } else {
          updated[teamId] = (updated[teamId] || []).filter(k => k !== moduleKey);
        }
        return updated;
      });
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    setSaving(null);
  };

  const filteredTeams = teams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] flex items-center gap-2">
            <Shield size={22} className="text-[#4f46e5]" /> Phân quyền module
          </h1>
          <p className="text-sm text-muted mt-1">Quản lý quyền truy cập module cho từng team</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm team..."
          className="px-4 py-2 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4f46e5]/25" />
      </div>

      {filteredTeams.length === 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-12 text-center text-muted">
          <Shield size={48} className="mx-auto mb-3 opacity-20" />
          <p>Chưa có team nào</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredTeams.map((team) => {
          const teamMods = permissions[team.id] || [];
          const isExpanded = expanded === team.id;
          const canToggle = (teamMods.length > 1) && teamMods.length < ALL_MODULES.length;
          const allOn = teamMods.length === ALL_MODULES.length;
          return (
            <div key={team.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div
                className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-all"
                onClick={() => setExpanded(isExpanded ? null : team.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] grid place-items-center text-white text-xs font-bold">
                    {(team.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#171717]">{team.name}</p>
                    <p className="text-xs text-muted">{teamMods.length}/{ALL_MODULES.length} module · {teamMods.map(k => ALL_MODULES.find(m => m.key === k)?.label).filter(Boolean).join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{allOn ? 'Tất cả' : teamMods.length + ' module'}</span>
                  <button onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : team.id); }}
                    className="p-1 rounded hover:bg-gray-200 text-muted transition-all"><X size={14} className={'transition-transform ' + (isExpanded ? 'rotate-45' : '')} /></button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 py-4 border-t border-border bg-gray-50/30">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {ALL_MODULES.map(mod => {
                      const hasMod = teamMods.includes(mod.key);
                      const isSaving = saving === team.id + mod.key;
                      return (
                        <button key={mod.key} onClick={() => toggle(team.id, mod.key, !hasMod)}
                          disabled={isSaving}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left
                            ${hasMod
                              ? 'bg-indigo-50 border-indigo-200 text-[#4f46e5]'
                              : 'bg-white border-border text-muted hover:border-indigo-200 hover:text-[#4f46e5]'}
                            ${isSaving ? 'opacity-50 cursor-wait' : ''}`}>
                          <span className="text-sm">{mod.icon}</span>
                          <span className="flex-1">{mod.label}</span>
                          <span className={`w-5 h-5 rounded-full grid place-items-center transition-all ${hasMod ? 'bg-[#4f46e5] text-white' : 'bg-gray-100 text-muted'}`}>
                            {hasMod ? '✓' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}