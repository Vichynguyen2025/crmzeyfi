# Fix B2 date filter
with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

# Add B2 date state
c = c.replace(
    "const [b6Dater, setB6Dater] = useState({ from: '', to: '', key: 'month' });",
    "const [b6Dater, setB6Dater] = useState({ from: '', to: '', key: 'month' });\n  const [b2Dater, setB2Dater] = useState({ from: '', to: '', key: 'month' });"
)

# Find B2 date inputs in the JSX
# Look for actualDateFrom after the B2 section starts
b2 = c.find('Tình hình Thực tế')
if b2 >= 0:
    start = c.find('actualDateFrom', b2)
    if start >= 0:
        # Find the containing fragment/div
        ctx = c[start:start+300]
        # Find the exact date input pattern
        end = c.find('/>', start) + 30
        if end > start:
            ctx2 = c[start-30:end+100]
            print(f'B2 date area: {repr(ctx2[:200])}')

# Simpler: find the exact pattern
old_b2 = "actualDateFrom} onChange={e=>setActualDateFrom(e.target.value)} className=\"px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none\" />"
old_b2_to = "actualDateTo} onChange={e=>setActualDateTo(e.target.value)} className=\"px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none\" />"
  
# Find the surrounding structure
b2_section = c.find('actualDateFrom')
if b2_section >= 0:
    # Find the parent element
    div_start = c.rfind('<div', b2_section - 50, b2_section)
    if div_start < 0: div_start = c.rfind('<div', b2_section - 100, b2_section)
    div_end = c.find('</div>', b2_section) + 20
    if div_end > div_start:
        section = c[div_start:div_end]
        print(f'\nB2 div section: {repr(section[:300])}')
        
        # Check if this div contains the groupBy buttons or date inputs
        if 'actualView' in section or 'actualDateFrom' in section:
            # Replace the date inputs part
            old_date_ui = c[b2_section-15:div_end]
            new_date_ui = '<DateRangeFilter value={b2Dater} onChange={v => { setB2Dater(v); setActualDateFrom(v.from); setActualDateTo(v.to); }} ranges={[{key:\'today\',label:\'H\u00f4m nay\'},{key:\'week\',label:\'7 ng\u00e0y\'},{key:\'month\',label:\'30 ng\u00e0y\'},{key:\'custom\',label:\'Tu\u1ef3 ch\u1ec9nh\'}]} />'
            c = c.replace(old_date_ui, new_date_ui)
            print('✅ B2 dates replaced')

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx').read()
print(f'b2Dater: {"b2Dater" in c2}')