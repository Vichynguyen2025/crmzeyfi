with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

# 1. Add states after b6DateTo
c = c.replace(
    "const [b6DateTo, setB6DateTo] = useState('');",
    "const [b6DateTo, setB6DateTo] = useState('');\n  const [showAddTeamB5, setShowAddTeamB5] = useState(false);\n  const [showAddTeamB6, setShowAddTeamB6] = useState(false);\n  const [addTeamList, setAddTeamList] = useState<any[]>([]);"
)

# 2. B5: Add plus row after total row, before the empty state
old_b5_end = "                </tr>\n              )}\n              {planData.length === 0 && ("
new_b5_plus = """                </tr>
              )}
              {planData.length > 0 && (
                <tr className="bg-white hover:bg-gray-50/30 transition-all">
                  <td colSpan={7} className="px-4 py-3">
                    {showAddTeamB5 && addTeamList.length > 0 ? (
                      <select value="" onChange={async e => { if (!e.target.value) return; try { await api('/teams/' + e.target.value + '/visibility', { method:'PATCH', body:JSON.stringify({table:'b5'}) }); setShowAddTeamB5(false); loadPlan(planMonth); } catch {} }} className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none cursor-pointer">
                        <option value="">Ch\u1ecdn team...</option>
                        {addTeamList.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => { const existing = new Set(planData.filter((t:any)=>!t.hide_from_b5).map((t:any)=>t.id)); const avail = (teams||[]).filter((t:any)=>!existing.has(t.id)); setAddTeamList(avail); setShowAddTeamB5(true); }} className="flex items-center gap-1 text-xs text-[#4f46e5] font-medium hover:underline transition-all"><Plus size={12} /> Th\u00eam team</button>
                    )}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                </tr>
              )}
              {planData.length === 0 && ("""
c = c.replace(old_b5_end, new_b5_plus)

# 3. B6: Add plus row after total row
old_b6_end = "<td className={''}></td>\n                </tr>\n              )}\n            </tbody>\n          </table>"
new_b6_plus = """<td className={''}></td>
                </tr>
              )}
              {((b6Data as any)?.teams || []).length > 0 && (
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
c = c.replace(old_b6_end, new_b6_plus)

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx').read()
print(f'B5 Thêm team: {"showAddTeamB5" in c2}')
print(f'B6 Thêm team: {"showAddTeamB6" in c2}')
print(f'B5 row: {c2.count("Thêm team")}')
print(f'B6 products map: {"((b6Data as any)?.products || []).map" in c2}')