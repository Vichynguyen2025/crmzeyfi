with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx') as f:
    c = f.read()

expanded_metrics = """<h4 className=\"text-xs font-semibold text-muted uppercase tracking-wider mb-3\">Ch\u1ec9 s\u1ed1 kinh doanh</h4>
                        <div className=\"grid grid-cols-2 sm:grid-cols-4 gap-3\">
                          {dd.metrics.todayOrders > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-ink\">{dd.metrics.todayOrders}</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">\u0110\u01a1n h\u00e0ng</p>
                            </div>
                          )}
                          {dd.metrics.todayCost > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-ink\">{Number(dd.metrics.todayCost).toLocaleString('vi-VN')}\u0111</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">Chi ph\u00ed</p>
                            </div>
                          )}
                          {dd.metrics.todayMessages > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-ink\">{dd.metrics.todayMessages}</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">Tin nh\u1eafn</p>
                            </div>
                          )}
                          {dd.metrics.avgMessCost > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-[#d97706]\">{Number(dd.metrics.avgMessCost).toLocaleString('vi-VN')}\u0111</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">CP/Tin nh\u1eafn</p>
                            </div>
                          )}
                          {dd.metrics.adsTotal > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-[#0068d6]\">{Number(dd.metrics.adsTotal).toLocaleString('vi-VN')}\u0111</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">CP QC</p>
                            </div>
                          )}
                          {dd.metrics.adsRevenue > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-[#16a34a]\">{Number(dd.metrics.adsRevenue).toLocaleString('vi-VN')}\u0111</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">Doanh thu QC</p>
                            </div>
                          )}
                          {dd.metrics.adsOrders > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-ink\">{dd.metrics.adsOrders}</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">\u0110\u01a1n QC</p>
                            </div>
                          )}
                          {dd.metrics.roas !== '\u2014' && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-[#7c3aed]\">{dd.metrics.roas}x</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">ROAS</p>
                            </div>
                          )}
                          {dd.metrics.cpOrder !== '\u2014' && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-[#db2777]\">{dd.metrics.cpOrder}\u0111</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">CP/\u0111\u01a1n</p>
                            </div>
                          )}
                          {dd.metrics.seoOrders > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-[#16a34a]\">{dd.metrics.seoOrders}</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">\u0110\u01a1n SEO</p>
                            </div>
                          )}
                          {dd.metrics.seoRevenue > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-[#16a34a]\">{Number(dd.metrics.seoRevenue).toLocaleString('vi-VN')}\u0111</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">Doanh thu SEO</p>
                            </div>
                          )}
                          {dd.metrics.publishedPosts > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-ink\">{dd.metrics.publishedPosts}/{dd.metrics.socialPosts}</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">B\u00e0i \u0111\u0103ng</p>
                            </div>
                          )}
                          {dd.metrics.b3TotalCost > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-[#0068d6]\">{Number(dd.metrics.b3TotalCost).toLocaleString('vi-VN')}\u0111</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">CP QC 3M</p>
                            </div>
                          )}
                          {dd.metrics.b3Reach > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-ink\">{Number(dd.metrics.b3Reach).toLocaleString('vi-VN')}</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">Ti\u1ebfp c\u1eadn</p>
                            </div>
                          )}
                          {dd.metrics.b3Clicks > 0 && (
                            <div className=\"bg-[#fafafa] rounded-xl p-4 text-center\" style={{boxShadow:'rgba(0,0,0,0.04) 0px 0px 0px 1px'}}>
                              <p className=\"text-xl font-bold text-ink\">{Number(dd.metrics.b3Clicks).toLocaleString('vi-VN')}</p>
                              <p className=\"text-xs text-muted mt-1 font-medium\">Click</p>
                            </div>
                          )}
                        </div>"""

# Replace received modal metrics
old_recv = c[c.find('<h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Ch\u1ec9 s\u1ed1 kinh doanh</h4>', c.find('detailReport && (')) : c.find('</div>\n                  </div>\n                )\n              }\n            </div>', c.find('detailReport && (')) + 20]
# Actually simpler: find the exact pattern to replace
old_start = c.find('<h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Ch\u1ec9 s\u1ed1 kinh doanh</h4>', c.find('detailReport && ('))
old_end = c.find('</div>\n                  </div>\n                )\n              }\n            </div>', c.find('</div>', old_start + 100) + 10)
if old_end < old_start + 100:
    old_end = old_start + 2000
old_section = c[old_start:old_end+5]
c = c.replace(old_section, expanded_metrics)
print('Received modal metrics replaced')

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])