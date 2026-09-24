with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx') as f:
    c = f.read()

# Find history modal metrics
h_chiso = c.find('Ch\u1ec9 s\u1ed1 kinh doanh', c.find('historyDetail && ('))
# Find end of this block
end = c.find('{\/* Recipients *\/}', h_chiso)
if end < 0:
    end = c.find('\u0110\u00e3 g\u1eedi \u0111\u1ebfn', h_chiso)
old = c[h_chiso:end]

# Read the pre-prepared expansion text
with open('/opt/data/crmzeyfi-ts/apps/web/scripts/expanded_metrics.txt') as f:
    new = f.read()

c = c.replace(old, new)

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Reports.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])