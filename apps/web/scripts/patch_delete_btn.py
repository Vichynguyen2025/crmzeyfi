with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

# B5: add delete button after %KPI cell
b5_marker = '<span className="text-muted italic">\u2014</span>; })()}\n                    </td>\n                  </tr>'
b5_replacement = '<span className="text-muted italic">\u2014</span>; })()}\n                    </td>\n                    <td className="p-4 text-center align-top">\n                      {currentUser?.role === \'admin\' && <button onClick={() => { if (confirm(\'Xo\u00e1 team kh\u1ecfi b\u1ea3ng B5?\')) api(\'/teams/\' + team.id + \'/visibility\', { method:\'PATCH\', body:JSON.stringify({table:\'b5\'}) }).then(() => loadPlan(planMonth)); }} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xo\u00e1 kh\u1ecfi b\u1ea3ng"><X size={13} /></button>}\n                    </td>\n                  </tr>'
c = c.replace(b5_marker, b5_replacement)

# B6: add delete button after cost cell
b6_marker = '{teamTotalCost > 0 ? teamTotalCost.toLocaleString(\'vi-VN\')+\'d\' : \'-\'}</td>\n                    </tr>'
b6_replacement = '{teamTotalCost > 0 ? teamTotalCost.toLocaleString(\'vi-VN\')+\'d\' : \'-\'}</td>\n                      <td className="px-3 py-3 text-center">\n                        {currentUser?.role === \'admin\' && <button onClick={() => { if (confirm(\'Xo\u00e1 team kh\u1ecfi b\u1ea3ng B6?\')) api(\'/teams/\' + team.id + \'/visibility\', { method:\'PATCH\', body:JSON.stringify({table:\'b6\'}) }).then(() => loadB6()); }} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-all" title="Xo\u00e1 kh\u1ecfi b\u1ea3ng"><X size={13} /></button>}\n                      </td>\n                    </tr>'
c = c.replace(b6_marker, b6_replacement)

# B6 total row: add action cell
b6_total_marker = '{(()=>{const a=planData.reduce((s:number,t:any)=>s+(t.totalActual||0),0);const b=planData.reduce((s:number,t:any)=>s+(t.totalTarget||0),0);return a>0&&b>0?Math.round(a/b*100)+\'%\':\'—\';})()}</td>\n                </tr>\n              )}\n              {planData.length === 0'
# This is B5 total, not B6. Let me fix B6 total instead.
b6_total_end = '</td>\n                  <td className="px-4 py-3"></td>\n                </tr>\n              )}\n            </tbody>\n          </table>'
# Check if action is already added
if 'px-4 py-3"></td>\n                </tr>' in c:
    print('Action already present')
else:
    # Find the B6 total row end
    print('Need to check B6 total')

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=15, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx').read()
print(f'B5 delete: {"Xoá team khỏi bảng B5?" in c2}')
print(f'B6 delete: {"Xoá team khỏi bảng B6?" in c2}')
print(f'B5 colgroup: {"width:180" in c}')
print(f'B6 colgroup: {"width:160" in c}')