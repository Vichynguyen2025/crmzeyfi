# Fix B6 date filter
with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

# 1. Add import
c = c.replace(
    "import { api } from '../lib/api';",
    "import { api } from '../lib/api';\nimport DateRangeFilter from '../components/DateRangeFilter';"
)

# 2. Add B6 date state
c = c.replace(
    "const [b6DateTo, setB6DateTo] = useState('');",
    "const [b6DateTo, setB6DateTo] = useState('');\n  const [b6Dater, setB6Dater] = useState({ from: '', to: '', key: 'month' });"
)

# 3. Replace B6 date inputs. Find the exact text in the B6 section
# The pattern is: b6GroupBy === 'day' && ( ... )
old = "{b6GroupBy === 'day' && <>\n              <input type=\"date\" value={b6DateFrom} onChange={e => setB6DateFrom(e.target.value)} className=\"px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none\" />\n              <span className=\"text-xs text-muted\">\u2192</span>\n              <input type=\"date\" value={b6DateTo} onChange={e => setB6DateTo(e.target.value)} className=\"px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none\" />\n            </>}"

new = "<DateRangeFilter value={b6Dater} onChange={v => { setB6Dater(v); setB6DateFrom(v.from); setB6DateTo(v.to); }} ranges={[{key:'week',label:'7 ng\u00e0y'},{key:'month',label:'30 ng\u00e0y'},{key:'custom',label:'Tu\u1ef3 ch\u1ec9nh'}]} />"

if old in c:
    c = c.replace(old, new)
    print('✅ B6 dates replaced')
else:
    print('❌ Pattern not found')
    # Debug: show what's near that area
    b6 = c.find('b6GroupBy')
    if b6 >= 0:
        ctx = c[b6:b6+400]
        print(f'Actual text: {repr(ctx[:400])}')

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx').read()
print(f'DateRangeFilter: {"b6Dater" in c2}')