# Apply font tokens to B5/B6 on Teams.tsx
with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx') as f:
    c = f.read()

changes = []

# B5 headers: text-[9px] font-semibold text-muted tracking-wider → text-table-header font-semibold text-muted tracking-wider
repl = c.replace('text-[9px] font-semibold text-muted tracking-wider text-left', 'text-table-header font-semibold text-muted tracking-wider text-left')
c = repl
repl = c.replace('text-[9px] font-semibold text-muted tracking-wider text-right', 'text-table-header font-semibold text-muted tracking-wider text-right')
c = repl
repl = c.replace('text-[9px] font-semibold text-muted tracking-wider text-center', 'text-table-header font-semibold text-muted tracking-wider text-center')
c = repl

# B6 headers
repl = c.replace('text-[9px] font-semibold text-muted tracking-wider text-left', 'text-table-header font-semibold text-muted tracking-wider text-left')
c = repl
repl = c.replace('text-[9px] font-semibold text-muted tracking-wider text-right', 'text-table-header font-semibold text-muted tracking-wider text-right')
c = repl

# B6 sub-headers (text-[10px])
repl = c.replace('text-[10px] font-medium text-muted tracking-wider text-right', 'text-table-sub font-medium text-muted tracking-wider text-right')
c = repl
repl = c.replace('text-[10px] font-medium text-muted tracking-wider text-left', 'text-table-sub font-medium text-muted tracking-wider text-left')
c = repl
repl = c.replace('text-[11px] font-medium text-muted tracking-wider text-right', 'text-table-sub font-medium text-muted tracking-wider text-right')
c = repl

# Body: text-xs in table cells → text-table-body
# B5 body cells
repl = c.replace('px-4 py-3 text-xs text-right font-medium', 'px-4 py-3 text-table-body text-right')
c = repl
repl = c.replace('px-4 py-3 text-xs text-right font-bold', 'px-4 py-3 text-table-body text-right font-bold')
c = repl
repl = c.replace('px-4 py-3 text-xs text-right', 'px-4 py-3 text-table-body text-right')
c = repl
repl = c.replace('px-4 py-3 text-xs text-center', 'px-4 py-3 text-table-body text-center')
c = repl
repl = c.replace('px-4 py-3 text-xs font-medium', 'px-4 py-3 text-table-body')
c = repl
repl = c.replace('px-3 py-3 text-xs text-right font-medium', 'px-3 py-3 text-table-body text-right')
c = repl
repl = c.replace('px-3 py-3 text-xs text-right text-muted', 'px-3 py-3 text-table-body text-right text-muted')
c = repl
repl = c.replace('px-3 py-3 text-xs text-right font-bold', 'px-3 py-3 text-table-body text-right font-bold')
c = repl

# Total row
repl = c.replace('px-4 py-3 text-xs font-bold text-[#4f46e5]', 'px-4 py-3 text-table-body font-bold text-primary')
c = repl
repl = c.replace('px-4 py-3 text-xs text-right font-bold text-[#4f46e5]', 'px-4 py-3 text-table-body text-right font-bold text-primary')
c = repl
repl = c.replace('px-4 py-3 text-xs font-bold text-[#171717]', 'px-4 py-3 text-table-body font-bold text-ink')
c = repl
repl = c.replace('px-4 py-3 text-xs text-right font-bold', 'px-4 py-3 text-table-body text-right font-bold')
c = repl
repl = c.replace('px-4 py-3 text-xs text-right font-semibold', 'px-4 py-3 text-table-body text-right font-semibold')
c = repl
repl = c.replace('px-4 py-3 text-xs text-center font-semibold', 'px-4 py-3 text-table-body text-center font-semibold')
c = repl

# B6 total 
repl = c.replace('px-3 py-3 text-xs text-right font-bold text-[#4f46e5]', 'px-3 py-3 text-table-body text-right font-bold text-primary')
c = repl
repl = c.replace('px-3 py-3 text-xs text-right font-bold', 'px-3 py-3 text-table-body text-right font-bold')
c = repl

# B5 .5 total cells
repl = c.replace('px-4 py-3.5 text-xs text-right font-semibold', 'px-4 py-3.5 text-table-body text-right font-semibold')
c = repl
repl = c.replace('px-4 py-3.5 text-xs text-center font-semibold', 'px-4 py-3.5 text-table-body text-center font-semibold')
c = repl
repl = c.replace('px-4 py-3.5 text-xs font-bold text-[#4f46e5]', 'px-4 py-3.5 text-table-body font-bold text-primary')
c = repl
repl = c.replace('px-4 py-3.5 text-xs text-right font-bold text-[#4f46e5]', 'px-4 py-3.5 text-table-body text-right font-bold text-primary')
c = repl

# text-[9px] in avatar (not table) - keep as-is
changes.append(f'text-[9px] remaining: {c.count("text-[9px]")}')
changes.append(f'text-table-header: {c.count("text-table-header")}')
changes.append(f'text-table-sub: {c.count("text-table-sub")}')
changes.append(f'text-table-body: {c.count("text-table-body")}')

with open('/opt/data/crmzeyfi-ts/apps/web/src/pages/Teams.tsx', 'w') as f:
    f.write(c)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])
for ch in changes:
    print(ch)