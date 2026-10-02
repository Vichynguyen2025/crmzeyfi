import subprocess, json

# Login
r = subprocess.run(['curl','-sk','-m','5','-H','Content-Type: application/json',
    '-d','{"email":"admin@zeyfi.com","password":"admin123"}',
    'https://staging.zeyfi.cloud/api/auth/login'], capture_output=True, text=True)
token = json.loads(r.stdout).get('accessToken', '')

# Get KPIs summary
month = '2026-10'
r2 = subprocess.run(['curl','-sk','-m','5','-H',f'Authorization: Bearer {token}',
    f'https://staging.zeyfi.cloud/api/kpis-summary/{month}'], capture_output=True, text=True)
data = json.loads(r2.stdout)
for t in data:
    n = t.get('name','?')[:15]
    tg = t.get('totalTarget',0) or 0
    ac = t.get('totalActual',0) or 0
    bd = t.get('totalBudget',0) or 0
    mc = t.get('memberCount',0) or 0
    hd = t.get('hide_from_b5',0) or 0
    pct = round(ac / tg * 100, 1) if tg > 0 else 0
    print(f'{n:15s} target={tg:>5} actual={ac:>5} ({pct:>5.1f}%) budget={bd:>5} members={mc:>2} hidden={hd}')

# Sums
visible = [t for t in data if not t.get('hide_from_b5')]
vtg = sum(t.get('totalTarget',0) or 0 for t in visible)
vac = sum(t.get('totalActual',0) or 0 for t in visible)
vb = sum(t.get('totalBudget',0) or 0 for t in visible)
vm = sum(t.get('memberCount',0) or 0 for t in visible)
print(f'\nTotal (visible): target={vtg} actual={vac} ({round(vac/vtg*100,1) if vtg>0 else 0}%) budget={vb} members={vm}')
print(f'Visible teams: {len(visible)}')