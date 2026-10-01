import subprocess, json

tok = json.loads(subprocess.run(['curl','-sk','-m','5','-H','Content-Type: application/json',
    '-d','{"email":"admin@zeyfi.com","password":"admin123"}',
    'https://staging.zeyfi.cloud/api/auth/login'], capture_output=True,text=True).stdout).get('accessToken','')

# Get ads list
ads = json.loads(subprocess.run(['curl','-sk','-m','5','-H',f'Authorization: Bearer {tok}',
    'https://staging.zeyfi.cloud/api/ads?month=2026-09'], capture_output=True,text=True).stdout)
if len(ads) == 0:
    print("No ads data")
    exit()

r = ads[0]
print(f"BEFORE: id={r['id'][:8]} date={r.get('date')}")

# Save new date
new_date = '2026-09-25'
aid = r['id']
r2 = subprocess.run(['curl','-sk','-m','10','-X','PUT','-H',f'Authorization: Bearer {tok}',
    '-H','Content-Type: application/json','-d',f'{{"date":"{new_date}"}}',
    f'https://staging.zeyfi.cloud/api/ads/{aid}'], capture_output=True,text=True)
print(f"PUT: {r2.stdout.strip()}")

# Verify - refetch list
ads2 = json.loads(subprocess.run(['curl','-sk','-m','5','-H',f'Authorization: Bearer {tok}',
    'https://staging.zeyfi.cloud/api/ads?month=2026-09'], capture_output=True,text=True).stdout)
r3 = ads2[0]
print(f"AFTER:  date={r3.get('date')}")

# Check
expected = new_date
actual = r3.get('date','')
# The API returns date as "2026-09-24T17:00:00.000Z" (ISO) - need to compare YYYY-MM-DD
actual_date = actual[:10] if actual else ''
if actual_date == expected:
    print(f"✅ PASS - date saved and persisted as {actual_date}")
else:
    print(f"❌ FAIL - expected {expected}, got {actual}")

# Now test SEO - save and refetch
print("\n--- Testing SEO batch save ---")
seo = json.loads(subprocess.run(['curl','-sk','-m','5','-H',f'Authorization: Bearer {tok}',
    'https://staging.zeyfi.cloud/api/seo-revenue/dcaa6a28-3ff8-457e-ba5b-9aeccd79c4f0?month=2026-09'], capture_output=True,text=True).stdout)
print(f"SEO rows: {len(seo)}")