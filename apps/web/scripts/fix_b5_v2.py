with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

# 1. Remove the wrong sub-header row
start = c.find('<tr className="bg-gray-50/40 border-b border-border">\n                <th className="px-4 py-2 text-[10px] font-medium text-muted tracking-wider text-left" style={{width:150}}></th>')
end = c.find('</tr>\n            </thead>', start) + 5
if start >= 0 and end >= 0:
    c = c[:start] + c[end:]
    print('✅ Sub-header removed')

# 2. Normalize body cell padding
c = c.replace('p-4 text-xs text-right font-medium align-top', 'px-4 py-3 text-xs text-right font-medium')
c = c.replace('p-4 text-xs text-right align-top', 'px-4 py-3 text-xs text-right')
c = c.replace('p-4 text-xs text-center align-top', 'px-4 py-3 text-xs text-center')
c = c.replace('p-4 text-xs text-right font-bold align-top', 'px-4 py-3 text-xs text-right font-bold')
c = c.replace('p-4 text-center align-top', 'px-4 py-3 text-center')

# 3. Normalize total row padding
c = c.replace('px-4 py-3.5 text-xs', 'px-4 py-3 text-xs')

# 4. Add action cell to total row  
old = '<td className="px-4 py-3 text-xs text-right font-bold text-[#4f46e5]">{(()=>{const a=planData.reduce((s:number,t:any)=>s+(t.totalActual||0),0);const b=planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0);return a>0&&b>0?Math.round(a/b*100)+\'%\':\'—\';})()}</td>\n                </tr>'
new = '<td className="px-4 py-3 text-xs text-right font-bold text-[#4f46e5]">{(()=>{const a=planData.reduce((s:number,t:any)=>s+(t.totalActual||0),0);const b=planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0);return a>0&&b>0?Math.round(a/b*100)+\'%\':\'—\';})()}</td>\n                  <td className="px-4 py-3"></td>\n                </tr>'
c = c.replace(old, new)

# 5. Remove redundant inline widths  
c = c.replace('style={{width:200}}', 'className=""')
c = c.replace('style={{width:160}}', 'className=""')
c = c.replace('style={{width:120}}', 'className=""')
c = c.replace('style={{width:100}}', 'className=""')
c = c.replace('style={{width:80}}', 'className=""')
c = c.replace('style={{width:150}}', 'className=""')

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx').read()
print(f'Sub-header present: {c2.count("products || []).map((p: string)")}')
print(f'px-4 py-3 count: {c2.count("px-4 py-3 text-xs")}')
print(f'Total action: {c2.count("px-4 py-3\"></td>")}')