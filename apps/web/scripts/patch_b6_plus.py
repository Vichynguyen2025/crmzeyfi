with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

old = "<td className={''}></td>\n                </tr>\n              )}\n            </tbody>\n          </table>"

new = """<td className={''}></td>
                </tr>
                <tr className="bg-white hover:bg-gray-50/30 transition-all">
                  <td className="px-4 py-3">
                    {showAddTeamB6 && addTeamList.length > 0 ? (
                      <select value="" onChange={async e => { if (!e.target.value) return; try { await api('/teams/' + e.target.value + '/visibility', { method:'PATCH', body:JSON.stringify({table:'b6'}) }); setShowAddTeamB6(false); loadB6(); } catch {} }} className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none cursor-pointer">
                        <option value="">Ch\u1ecdn team...</option>
                        {addTeamList.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => { const existing = new Set(((b6Data as any)?.teams||[]).filter((t:any)=>!t.hide_from_b6).map((t:any)=>t.id)); const avail = (teams||[]).filter((t:any)=>!existing.has(t.id)); setAddTeamList(avail); setShowAddTeamB6(true); }} className="flex items-center gap-1 text-xs text-[#4f46e5] font-medium hover:underline transition-all"><Plus size={12} /> Th\u00eam team</button>
                    )}
                  </td>
                  {((b6Data as any)?.products || []).map((p:string) => (
                    <React.Fragment key={'add-'+p}>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                    </React.Fragment>
                  ))}
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                </tr>
              )}
            </tbody>
          </table>"""

c = c.replace(old, new)

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx').read()
print(f'Thêm team count: {c2.count("Thêm team")}')
print(f'showAddTeamB6: {c2.count("showAddTeamB6")}')
print(f'B5 plus: {c2.count("showAddTeamB5")}')
print(f'B6 plus: {c2.count("showAddTeamB6")}')