with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

# 1. Find and remove the WRONG sub-header row (B6 products in B5 table)
wrong_subheader_start = c.find('<tr className=\"bg-gray-50/40 border-b border-border\">\n                <th className=\"px-4 py-2 text-[10px] font-medium text-muted tracking-wider text-left\" style={{width:150}}></th>')
wrong_subheader_end = c.find('</tr>\n            </thead>', wrong_subheader_start) + 5

if wrong_subheader_start >= 0 and wrong_subheader_end >= 0:
    c = c[:wrong_subheader_start] + c[wrong_subheader_end:]
    print('✅ Removed B5 sub-header row (was showing B6 products)')

# 2. Normalize padding in B5 cells: change all p-4 to px-4 py-3 for consistency
c = c.replace(
    '<td className=\"p-4 text-xs text-right font-medium align-top\">',
    '<td className=\"px-4 py-3 text-xs text-right font-medium\">'
)
c = c.replace(
    '<td className=\"p-4 text-xs text-right align-top\">',
    '<td className=\"px-4 py-3 text-xs text-right\">'
)
c = c.replace(
    '<td className=\"p-4 text-xs text-center align-top\">\n                      <span className=\"inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-muted font-medium text-xs\">',
    '<td className=\"px-4 py-3 text-xs text-center\">\n                      <span className=\"inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-muted font-medium text-xs\">'
)
c = c.replace(
    '<td className=\"p-4 text-xs text-right font-bold align-top\">',
    '<td className=\"px-4 py-3 text-xs text-right font-bold\">'
)
c = c.replace(
    '<td className=\"p-4 text-center align-top\">',
    '<td className=\"px-4 py-3 text-center\">'
)

# 3. Normalize total row padding  
c = c.replace(
    '<td className=\"px-4 py-3.5 text-xs font-bold text-[#4f46e5]\">Tổng cộng</td>',
    '<td colSpan={2} className=\"px-4 py-3 text-xs font-bold text-[#4f46e5]\">Tổng cộng</td>'
)

# Fix: The total row should have colSpan=2 for team+product and then ALL other columns including action
# Current: total row has colSpan=2 then 5 tds = 7 total
# Need: colSpan=2 then 6 tds = 8 total (missing action)
total_old_end = '<td className=\"px-4 py-3 text-xs text-right font-bold text-[#4f46e5]\">{(()=>{const a=planData.reduce((s:number,t:any)=>s+(t.totalActual||0),0);const b=planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0);return a>0&&b>0?Math.round(a/b*100)+\'%\':\'—\';})()}</td>\n                </tr>'
total_new_end = '<td className=\"px-4 py-3 text-xs text-right font-bold text-[#4f46e5]\">{(()=>{const a=planData.reduce((s:number,t:any)=>s+(t.totalActual||0),0);const b=planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0);return a>0&&b>0?Math.round(a/b*100)+\'%\':\'—\';})()}</td>\n                  <td className=\"px-4 py-3\"></td>\n                </tr>'
c = c.replace(total_old_end, total_new_end)

# 4. Remove conflicting inline widths from header (colgroup handles sizing)
c = c.replace(
    'style={{width:200}}',
    'className=\"\"'
)
c = c.replace(
    'style={{width:160}}',
    'className=\"\"'
)
c = c.replace(
    'style={{width:120}}',
    'className=\"\"'
)
c = c.replace(
    'style={{width:100}}',
    'className=\"\"'
)
c = c.replace(
    'style={{width:80}}',
    'className=\"\"'
)
c = c.replace(
    'style={{width:150}}',
    'className=\"\"'
)

# 5. Fix total row: remove colSpan={2} and use two separate cells with correct padding
# Actually colSpan={2} for Team+Product is fine, just make sure the rest align
# The issue is that colSpan=2 spans columns 1-2, then remaining 6 cells span columns 3-8
# But we had only 5 value cells + no action = 6 used + action missing = 7
# Now we have 5 value + action = 6 = total 7+1 = 8 ✓

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx').read()
print(f'B5 sub-header: {"bg-gray-50/40 border-b" in c and "products" not in c.split(\"bg-gray-50/40\")[1] if \"bg-gray-50/40\" in c else \"no sub-header\"}')
print(f'Total action cell: {"px-4 py-3\"></td>" in c2}')
print(f'Consistent padding: {c2.count("px-4 py-3 text-xs")}')