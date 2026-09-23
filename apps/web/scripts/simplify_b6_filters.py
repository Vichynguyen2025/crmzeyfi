with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

# 1. Remove b6Month state and its setter
c = c.replace(
    "const [b6Month, setB6Month] = useState(() => new Date().toISOString().slice(0, 7));\n",
    ""
)

# 2. Update loadB6 dependency
old_load = """loadB6 = useCallback(async () => {
    try {
      let url = '/actuals-summary?month=' + b6Month + '&groupBy=product&viewMode=' + b6GroupBy;
      if (b6GroupBy === 'day' || b6GroupBy === 'week') {
        if (b6DateFrom) url += '&dateFrom=' + b6DateFrom;
        if (b6DateTo) url += '&dateTo=' + b6DateTo;
      }
      const r = await api(url);
      setB6Data(r || []);
    } catch { setB6Data([]); }
  }, [b6Month, b6GroupBy, b6DateFrom, b6DateTo]);"""

new_load = """loadB6 = useCallback(async () => {
    try {
      let url = '/actuals-summary?groupBy=product&viewMode=' + b6GroupBy;
      if (b6GroupBy === 'month') {
        const m = b6Dater.from ? b6Dater.from.slice(0, 7) : new Date().toISOString().slice(0, 7);
        url += '&month=' + m;
      } else {
        if (b6Dater.from) url += '&dateFrom=' + b6Dater.from;
        if (b6Dater.to) url += '&dateTo=' + b6Dater.to;
      }
      const r = await api(url);
      setB6Data(r || []);
    } catch { setB6Data([]); }
  }, [b6Dater, b6GroupBy]);"""

if old_load in c:
    c = c.replace(old_load, new_load)
    print('loadB6 updated')
else:
    print('loadB6 pattern not found')

# 3. Remove month input from UI
old_month_input = """            <input type=\"month\" value={b6Month} onChange={e => setB6Month(e.target.value)} className=\"px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none\" />
            """
new_month_input = ""
if old_month_input in c:
    c = c.replace(old_month_input, new_month_input)
    print('Month input removed')
else:
    print('Month input not found')

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx').read()
print(f'b6Month removed: {"b6Month" not in c2}')
print(f'b6Dater used: {c2.count("b6Dater")}')
print(f'DateRangeFilter: {"DateRangeFilter" in c2}')