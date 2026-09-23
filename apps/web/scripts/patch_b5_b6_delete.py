with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

# Add colgroup to B5
c = c.replace(
    '<table className="w-full" style={{tableLayout:\'fixed\', borderCollapse:\'separate\', borderSpacing:0}}>\n            <thead>',
    '<table className="w-full" style={{tableLayout:\'fixed\', borderCollapse:\'collapse\'}}>\n            <colgroup>\n              <col style={{width:180}} /><col style={{width:170}} /><col style={{width:85}} /><col style={{width:85}} /><col style={{width:85}} /><col style={{width:50}} /><col style={{width:65}} /><col style={{width:36}} />\n            </colgroup>\n            <thead>'
)

# Add delete column header to B5
c = c.replace(
    '<th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:100}}>%KPI</th>\n              </tr>',
    '<th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:100}}>%KPI</th>\n                <th className="px-4 py-3 w-[36px]"></th>\n              </tr>'
)

# Find B5 body %KPI td + closing </tr> and add delete button
c = c.replace(
    '<td className="p-4 text-xs text-right font-bold align-top">\n{(() => { const totalAllTarget = planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0); return team.totalActual > 0 && totalAllTarget > 0 ? <span className="text-[#4f46e5]">{Math.round(team.totalActual / totalAllTarget * 100)}%</span> : <span className="text-muted italic">\u2014</span>; })()}\n</td>\n                  </tr>',
    '<td className="p-4 text-xs text-right font-bold align-top">\n{(() => { const totalAllTarget = planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0); return team.totalActual > 0 && totalAllTarget > 0 ? <span className="text-[#4f46e5]">{Math.round(team.totalActual / totalAllTarget * 100)}%</span> : <span className="text-muted italic">\u2014</span>; })()}\n</td>\n                    <td className="p-4 text-center align-top">\n                      {currentUser?.role === \'admin\' && <button onClick={() => { if (confirm(\'Xo\u00e1 team kh\u1ecfi b\u1ea3ng B5?\')) api(\'/teams/\' + team.id + \'/visibility\', { method:\'PATCH\', body:JSON.stringify({table:\'b5\'}) }).then(() => loadPlan(planMonth)); }} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xo\u00e1 kh\u1ecfi b\u1ea3ng"><X size={13} /></button>}\n                    </td>\n                  </tr>'
)

# B5 total row: add action cell
c = c.replace(
    '<td className="px-4 py-3text-xs text-right font-bold text-[#4f46e5]">{(()=>{const a=planData.reduce((s:number,t:any)=>s+(t.totalActual||0),0);const b=planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0);return a>0&&b>0?Math.round(a/b*100)+\'%\':\'—\';})()}</td>\n                </tr>\n              )}\n              {planData.length === 0',
    '<td className="px-4 py-3 text-xs text-right font-bold text-[#4f46e5]">{(()=>{const a=planData.reduce((s:number,t:any)=>s+(t.totalActual||0),0);const b=planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0);return a>0&&b>0?Math.round(a/b*100)+\'%\':\'—\';})()}</td>\n                  <td className="px-4 py-3"></td>\n                </tr>\n              )}\n              {planData.length === 0'
)

# B6 colgroup
c = c.replace(
    '<table className="w-full" style={{tableLayout:\'fixed\', borderCollapse:\'separate\', borderSpacing:0}}>\n            <thead>\n              <tr className="bg-gray-50/80 border-b border-border">',
    '<table className="w-full" style={{tableLayout:\'fixed\', borderCollapse:\'collapse\'}}>\n            <colgroup>\n              <col style={{width:160}} />{((b6Data as any)?.products || []).map((p:string) => (<React.Fragment key={p}><col style={{width:75}} /><col style={{width:85}} /></React.Fragment>))}<col style={{width:75}} /><col style={{width:85}} /><col style={{width:36}} />\n            </colgroup>\n            <thead>\n              <tr className="bg-gray-50/80 border-b border-border">'
)

# B6 add action header
c = c.replace(
    '<th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:100}}>T\u1ed5ng CP</th>\n              </tr>',
    '<th className="px-4 py-3 text-[11px] font-semibold text-muted tracking-wider text-right" style={{width:100}}>T\u1ed5ng CP</th>\n                <th className="px-4 py-3 w-[36px]"></th>\n              </tr>'
)

# B6 add delete button to body rows
c = c.replace(
    '<td className="px-3 py-3 text-xs text-right font-bold">{teamTotalCost > 0 ? teamTotalCost.toLocaleString(\'vi-VN\')+\'d\' : \'-\'}</td>\n                    </tr>',
    '<td className="px-3 py-3 text-xs text-right font-bold">{teamTotalCost > 0 ? teamTotalCost.toLocaleString(\'vi-VN\')+\'d\' : \'-\'}</td>\n                      <td className="px-3 py-3 text-center">\n                        {currentUser?.role === \'admin\' && <button onClick={() => { if (confirm(\'Xo\u00e1 team kh\u1ecfi b\u1ea3ng B6?\')) api(\'/teams/\' + team.id + \'/visibility\', { method:\'PATCH\', body:JSON.stringify({table:\'b6\'}) }).then(() => loadB6()); }} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xo\u00e1 kh\u1ecfi b\u1ea3ng"><X size={13} /></button>}\n                      </td>\n                    </tr>'
)

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx').read()
print(f'B5 delete: {"Xoá team khỏi bảng B5?" in c2}')
print(f'B6 delete: {"Xoá team khỏi bảng B6?" in c2}')
print(f'B5 colgroup: {"width:180" in c2}')
print(f'B6 dynamic colgroup: {"width:75" in c2 and "products || []).map" in c2}')
print(f'No plus row: {"Thêm team" not in c2 and "showAddTeam" not in c2}')