with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx') as f:
    c = f.read()

# 1. Add states
c = c.replace(
    "const [attachments, setAttachments] = useState<string[]>([]);",
    "const [attachments, setAttachments] = useState<string[]>([]);\n  const [reportLinks, setReportLinks] = useState<string[]>([]);\n  const [newLink, setNewLink] = useState('');"
)

# 2. Add link to submit payload
c = c.replace(
    "attachments: attachments,",
    "attachments: attachments,\n          links: reportLinks,"
)

# 3. Add Link icon to import
c = c.replace(
    "FileText, X, CheckCircle2, Clock, Users, Download, Eye, Inbox, UserCheck, ChevronRight, Folder, Trash2",
    "FileText, X, CheckCircle2, Clock, Users, Link, Download, Eye, Inbox, UserCheck, ChevronRight, Folder, Trash2"
)

# 4. Add link section after attachments
old = """                  )}
                </div>
              </div>
            </div>

            {/* Submit */}"""

new = """                  )}
                </div>

                {/* Link attachment */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted mb-2">\u0110\u00ednh k\u00e8m link</label>
                  <div className="flex items-center gap-2">
                    <input type="url" value={newLink} onChange={e => setNewLink(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-[#f8fafc] border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-all" />
                    <button onClick={() => { if (newLink.trim()) { setReportLinks([...reportLinks, newLink.trim()]); setNewLink(''); } }}
                      className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium">Th\u00eam</button>
                  </div>
                  {reportLinks.length > 0 && reportLinks.map((link, i) => (
                    <div key={i} className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-border rounded-lg text-xs">
                      <Link size={12} className="text-primary shrink-0" />
                      <span className="text-primary truncate max-w-[200px]">{link}</span>
                      <button onClick={() => setReportLinks(prev => prev.filter(function(_, j) { return j !== i; }))} className="text-red-400 hover:text-red-600 ml-auto shrink-0"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}"""

c = c.replace(old, new)

# 5. Reset links on cancel
c = c.replace(
    "setContent(''); setAttachments([]); setConfirming(false);",
    "setContent(''); setAttachments([]); setReportLinks([]); setConfirming(false);"
)

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx').read()
print(f'reportLinks: {"reportLinks" in c2}')
print(f'newLink: {"newLink" in c2}')
print(f'Link icon: {"Link size" in c2}')