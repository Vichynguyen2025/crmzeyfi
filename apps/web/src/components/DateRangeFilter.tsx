import { useState } from 'react';

export interface RangeOption {
  key: string;
  label: string;
}

export interface DateRangeValue {
  from: string;
  to: string;
  key: string;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  ranges?: RangeOption[];
}

const DEFAULT_RANGES: RangeOption[] = [
  { key: 'today', label: 'H\u00f4m nay' },
  { key: 'week', label: '7 ng\u00e0y' },
  { key: 'month', label: '30 ng\u00e0y' },
  { key: 'custom', label: 'Tu\u1ef3 ch\u1ec9nh' },
];

const DateRangeFilter = ({ value, onChange, ranges }: DateRangeFilterProps) => {
  const today = new Date().toISOString().slice(0, 10);
  const items = ranges || DEFAULT_RANGES;
  const hasCustom = items.some(i => i.key === 'custom');

  const handleTab = (key: string) => {
    if (key === 'custom' && hasCustom) {
      onChange({ from: '', to: '', key: 'custom' });
      return;
    }
    const to = today;
    let from = today;
    if (key === 'week' || key === '7d') {
      const d = new Date(); d.setDate(d.getDate() - 7); from = d.toISOString().slice(0, 10);
    } else if (key === 'month' || key === '30d') {
      const d = new Date(); d.setDate(d.getDate() - 30); from = d.toISOString().slice(0, 10);
    } else if (key === '90d') {
      const d = new Date(); d.setDate(d.getDate() - 90); from = d.toISOString().slice(0, 10);
    }
    onChange({ from, to, key });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-border" style={{boxShadow:'rgba(0,0,0,0.08) 0px 0px 0px 1px'}}>
        {items.map(dr => (
          <button key={dr.key} onClick={() => handleTab(dr.key)}
            className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' + (value.key === dr.key ? 'bg-[#171717] text-white' : 'text-[#808080] hover:text-[#171717]')}>
            {dr.label}
          </button>
        ))}
      </div>
      {value.key === 'custom' && hasCustom && (
        <>
          <input type="date" value={value.from || ''} onChange={e => onChange({ ...value, from: e.target.value })}
            className="px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25 w-36" />
          <span className="text-xs text-muted">{'\u0111\u1ebfn'}</span>
          <input type="date" value={value.to || ''} onChange={e => onChange({ ...value, to: e.target.value })}
            className="px-3 py-2 bg-white border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/25 w-36" />
        </>
      )}
    </div>
  );
};

export default DateRangeFilter;