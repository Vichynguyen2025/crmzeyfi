with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx', 'r') as f:
    c = f.read()

# 1. Add state after analysisPeriod
old_state = "const [analysisPeriod, setAnalysisPeriod] = useState('');"
new_state = old_state + "\nconst [analysisSummary, setAnalysisSummary] = useState<any>(null);"
c = c.replace(old_state, new_state)

# 2. Add aggregation after setAnalysisCount(data.length)
old_agg = "setAnalysisCount(data.length);"
new_agg = old_agg + """
                // Aggregate metrics from all selected reports
                const summary: any = { orders:0, cost:0, b3Cost:0, messages:0, msgCost:0, adsTotal:0, adsRevenue:0, adsOrders:0, seoOrders:0, seoRevenue:0, socialPosts:0, publishedPosts:0 };
                data.forEach((rpt:any) => {
                  const d = (() => { try { return JSON.parse(rpt.data || '{}'); } catch { return {}; } })();
                  const m = d.metrics || {};
                  summary.orders += m.todayOrders || 0;
                  summary.cost += m.todayCost || 0;
                  summary.b3Cost += m.b3TotalCost || 0;
                  summary.messages += m.todayMessages || 0;
                  summary.msgCost += (m.avgMessCost || 0) * (m.todayMessages || 0);
                  summary.adsTotal += m.adsTotal || 0;
                  summary.adsRevenue += m.adsRevenue || 0;
                  summary.adsOrders += m.adsOrders || 0;
                  summary.seoOrders += m.seoOrders || 0;
                  summary.seoRevenue += m.seoRevenue || 0;
                  summary.socialPosts += m.socialPosts || 0;
                  summary.publishedPosts += m.publishedPosts || 0;
                });
                if (summary.messages > 0) summary.avgMsgCost = summary.msgCost / summary.messages;
                summary.roas = summary.adsTotal > 0 ? Math.round((summary.adsRevenue / summary.adsTotal) * 100) / 100 : 0;
                setAnalysisSummary(summary);"""
c = c.replace(old_agg, new_agg)

# 3. Add UI section in modal after KPI cards and before analysisHtml
old_ui = "{analysisHtml ? <div"
new_ui = "{analysisSummary && (<div>"
new_ui += """
                  <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-3">Tổng hợp dữ liệu</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#101828]">{analysisSummary.orders}</p>
                      <p className="text-xs text-[#667085] mt-0.5">Tổng đơn</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#2563EB]">{Number(analysisSummary.cost).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-[#667085] mt-0.5">Tổng chi phí</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#D97706]">{Number(analysisSummary.adsTotal).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-[#667085] mt-0.5">Chi phí QC</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#16A34A]">{Number(analysisSummary.adsRevenue).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-[#667085] mt-0.5">Doanh thu QC</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#7C3AED]">{analysisSummary.roas}x</p>
                      <p className="text-xs text-[#667085] mt-0.5">ROAS</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#101828]">{analysisSummary.messages}</p>
                      <p className="text-xs text-[#667085] mt-0.5">Tin nhắn</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#16A34A]">{analysisSummary.seoOrders}</p>
                      <p className="text-xs text-[#667085] mt-0.5">Đơn SEO</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#16A34A]">{Number(analysisSummary.seoRevenue).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-[#667085] mt-0.5">Doanh SEO</p>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-center">
                      <p className="text-lg font-bold text-[#101828]">{analysisSummary.socialPosts} / {analysisSummary.publishedPosts}</p>
                      <p className="text-xs text-[#667085] mt-0.5">Bài viết / Đã đăng</p>
                    </div>
                  </div>
                </div>)}
                  {analysisHtml ? <div"""
c = c.replace(old_ui, new_ui)

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx', 'w') as f:
    f.write(c)

print("✅ Summary feature added")