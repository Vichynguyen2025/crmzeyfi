with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx') as f:
    c = f.read()

# 1. Change today from const to state
c = c.replace(
    "const today = new Date().toISOString().slice(0, 10);",
    "const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));"
)

# 2. Add auto-day-advance useEffect (before the main component return)
old_metrics_effect = "useEffect(() => { loadMetrics(); loadReports(); }, [loadMetrics, loadReports]);"

new_metrics_effect = """useEffect(() => { loadMetrics(); loadReports(); }, [loadMetrics, loadReports]);

  // Auto-advance to new day every 30s
  useEffect(() => {
    const check = () => {
      const d = new Date().toISOString().slice(0, 10);
      if (d !== today) {
        setToday(d);
        setReportDate(d);
        setContent('');
        setReason('');
        setDifficulties('');
        setSuggestions('');
        setExtraTasks([]);
        setAttachments([]);
        setReportLinks([]);
        setNewLink('');
        setConfirming(false);
        loadReports();
        loadMetrics();
        showToast('success', '\\u0110\\u00e3 sang ng\\u00e0y m\\u1edbi (' + d + ') — form b\\u00e1o c\\u00e1o m\\u1edbi');
      }
    };
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [today]);"""

c = c.replace(old_metrics_effect, new_metrics_effect)

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])

c2 = open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx').read()
print(f'today state: {"const [today, setToday]" in c2}')
print(f'auto-advance effect: {"auto-advance" not in c2 and "checkTimer" not in c2}')
print(f'setInterval check: {"setInterval(check" in c2}')