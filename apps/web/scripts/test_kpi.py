import subprocess, json

# Login
r = subprocess.run(['curl','-sk','-m','5','-H','Content-Type: application/json',
    '-d','{"email":"admin@zeyfi.com","password":"admin123"}',
    'https://staging.zeyfi.cloud/api/auth/login'],
    capture_output=True, text=True, timeout=10)
tok = json.loads(r.stdout).get('accessToken','')
h = {'Authorization': f'Bearer {tok}'}

# Get teams
r = subprocess.run(['curl','-sk','-m','5','-H',f'Authorization: Bearer {tok}',
    'https://staging.zeyfi.cloud/api/teams'], capture_output=True, text=True, timeout=10)
teams = json.loads(r.stdout)
for t in teams:
    n = t.get('name','').lower()
    if 'dinh' in n or 'vi' in n:
        tid = t['id']
        print(f"Team: {t['name']}")
        for m in ['2026-09','2026-10','2026-11']:
            r2 = subprocess.run(['curl','-sk','-m','5','-H',f'Authorization: Bearer {tok}',
                f'https://staging.zeyfi.cloud/api/kpis/{tid}?month={m}'],
                capture_output=True, text=True, timeout=10)
            data = json.loads(r2.stdout)
            print(f"  Month {m}: {len(data)} kpi rows")
            for row in data:
                print(f"    {row.get('name','?')}: budget={row.get('daily_budget',0)} msgs={row.get('daily_messages',0)} orders={row.get('monthly_orders',0)}")
        break