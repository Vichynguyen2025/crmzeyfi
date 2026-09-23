import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Save, Palette, Type, Globe, Radio, Image } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/admin/settings').then(setSettings).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setToast('Đã lưu');
      // Apply changes immediately
      applySettings(settings);
    } catch { setToast('Lỗi lưu'); }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const update = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {toast && (
        <div className={'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ' +
          (toast === 'Đã lưu' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
          <span>{toast === 'Đã lưu' ? '✓' : '✗'} {toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Cài đặt giao diện</h1>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50">
          <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gray-50/60">
          <h2 className="text-sm font-bold text-ink"><Globe size={16} className="inline mr-1.5" />Thông tin chung</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Tên website</label>
            <input value={settings.site_name || ''} onChange={e => update('site_name', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Favicon (URL)</label>
            <input value={settings.favicon || ''} onChange={e => update('favicon', e.target.value)} placeholder="https://..."
              className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/25" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gray-50/60">
          <h2 className="text-sm font-bold text-ink"><Palette size={16} className="inline mr-1.5" />Màu sắc</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Màu chủ đạo</label>
            <div className="flex items-center gap-3">
              <input type="color" value={settings.primary_color || '#4f46e5'} onChange={e => update('primary_color', e.target.value)}
                className="w-10 h-10 rounded-xl border border-border cursor-pointer" />
              <input value={settings.primary_color || ''} onChange={e => update('primary_color', e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/25 font-mono" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gray-50/60">
          <h2 className="text-sm font-bold text-ink"><Type size={16} className="inline mr-1.5" />Kích thước chữ</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Font scale</label>
            <div className="flex gap-2">
              {[
                { key: 'small', label: 'Nhỏ', desc: '12px / 13px' },
                { key: 'medium', label: 'Vừa', desc: '14px / 16px' },
                { key: 'large', label: 'Lớn', desc: '16px / 18px' },
              ].map(opt => (
                <button key={opt.key} onClick={() => update('font_scale', opt.key)}
                  className={'flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all text-left ' +
                    (settings.font_scale === opt.key ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted hover:border-gray-300')}>
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gray-50/60">
          <h2 className="text-sm font-bold text-ink"><Radio size={16} className="inline mr-1.5" />Bo góc</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Border radius</label>
            <div className="flex gap-2">
              {[
                { key: 'small', label: 'Ít', desc: '4px / 8px' },
                { key: 'medium', label: 'Vừa', desc: '8px / 12px' },
                { key: 'large', label: 'Nhiều', desc: '12px / 16px' },
              ].map(opt => (
                <button key={opt.key} onClick={() => update('border_radius', opt.key)}
                  className={'flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all text-left ' +
                    (settings.border_radius === opt.key ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted hover:border-gray-300')}>
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function applySettings(settings: Record<string, string>) {
  const root = document.documentElement;
  if (settings.primary_color) root.style.setProperty('--color-primary', settings.primary_color);
  if (settings.font_scale === 'small') {
    root.style.setProperty('--font-xs', '11px');
    root.style.setProperty('--font-sm', '13px');
    root.style.setProperty('--font-base', '14px');
    root.style.setProperty('--font-table-header', '13px');
    root.style.setProperty('--font-table-body', '13px');
  } else if (settings.font_scale === 'large') {
    root.style.setProperty('--font-xs', '13px');
    root.style.setProperty('--font-sm', '15px');
    root.style.setProperty('--font-base', '17px');
    root.style.setProperty('--font-table-header', '15px');
    root.style.setProperty('--font-table-body', '15px');
  } else {
    root.style.setProperty('--font-xs', '12px');
    root.style.setProperty('--font-sm', '14px');
    root.style.setProperty('--font-base', '16px');
    root.style.setProperty('--font-table-header', '14px');
    root.style.setProperty('--font-table-body', '14px');
  }
  if (settings.border_radius === 'small') {
    root.style.setProperty('--radius-sm', '4px');
    root.style.setProperty('--radius-md', '6px');
    root.style.setProperty('--radius-lg', '8px');
    root.style.setProperty('--radius-xl', '12px');
  } else if (settings.border_radius === 'large') {
    root.style.setProperty('--radius-sm', '8px');
    root.style.setProperty('--radius-md', '10px');
    root.style.setProperty('--radius-lg', '14px');
    root.style.setProperty('--radius-xl', '18px');
  } else {
    root.style.setProperty('--radius-sm', '6px');
    root.style.setProperty('--radius-md', '8px');
    root.style.setProperty('--radius-lg', '12px');
    root.style.setProperty('--radius-xl', '16px');
  }
}