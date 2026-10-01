import subprocess, json

# Get token
tok = json.loads(subprocess.run(['curl','-sk','-m','5','-H','Content-Type: application/json',
    '-d','{"email":"admin@zeyfi.com","password":"admin123"}',
    'https://staging.zeyfi.cloud/api/auth/login'], capture_output=True,text=True).stdout).get('accessToken','')

uid = "dcaa6a28-3ff8-457e-ba5b-9aeccd79c4f0"

# Save a row with date 2026-09-28
rows = json.dumps({"rows":[{"date":"2026-09-28","channel":"google_ads","orders":1,"revenue":100000}],"month":"2026-09"})
r = subprocess.run(['curl','-sk','-m','10','-X','POST','-H',f'Authorization: Bearer {tok}',
    '-H','Content-Type: application/json','-d',rows,
    f'https://staging.zeyfi.cloud/api/seo-revenue/{uid}'], capture_output=True,text=True)
print(f"POST: {r.stdout.strip()}")

# Fetch back
r = subprocess.run(['curl','-sk','-m','5','-H',f'Authorization: Bearer {tok}',
    f'https://staging.zeyfi.cloud/api/seo-revenue/{uid}?month=2026-09'], capture_output=True,text=True)
data = json.loads(r.stdout)
print(f"\nRows: {len(data)}")
for row in data:
    print(f"  date={row['date']} dateStr={row.get('dateStr','')}")
# Check the last saved row  
last = data[-1] if data else None
if last:
    d = last['date']
    actual = d[:10] if d else ''
    expected = '2026-09-28'
    print(f"\nExpected: {expected}")
    print(f"Actual:   {actual}")
    print("✅ PASS" if actual == expected else "❌ FAIL")