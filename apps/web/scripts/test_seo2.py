import subprocess, json

tok = json.loads(subprocess.run(['curl','-sk','-m','5','-H','Content-Type: application/json',
    '-d','{"email":"admin@zeyfi.com","password":"admin123"}',
    'https://staging.zeyfi.cloud/api/auth/login'], capture_output=True,text=True).stdout).get('accessToken','')

uid = "dcaa6a28-3ff8-457e-ba5b-9aeccd79c4f0"

# Save
rows = json.dumps({"rows":[{"date":"2026-09-28","channel":"google_ads","orders":2,"revenue":200000}],"month":"2026-09"})
r = subprocess.run(['curl','-sk','-m','10','-X','POST','-H',f'Authorization: Bearer {tok}',
    '-H','Content-Type: application/json','-d',rows,
    f'https://staging.zeyfi.cloud/api/seo-revenue/{uid}'], capture_output=True,text=True)
print(f"POST: {r.status_code if hasattr(r,'status_code') else ''}{r.stdout.strip()[:50]}")

# Fetch
r = subprocess.run(['curl','-sk','-m','5','-H',f'Authorization: Bearer {tok}',
    f'https://staging.zeyfi.cloud/api/seo-revenue/{uid}?month=2026-09'], capture_output=True,text=True)
try:
    data = json.loads(r.stdout)
    print(f"Rows: {len(data)}")
    for row in data[-2:]:
        d = row.get('date','?')
        print(f"  date={d}")
        if d == '2026-09-28':
            print("✅ PASS - date correct!")
        elif d and d.startswith('2026-09-28'):
            print(f"⚠️  Date has time component: {d}")
        elif d and 'T' in str(d):
            print(f"❌ FAIL - timezone shifted: {d}")
        else:
            print(f"❌ FAIL - wrong date: {d}")
except Exception as e:
    print(f"Error: {e}")
    print(f"Response: {r.stdout[:200]}")