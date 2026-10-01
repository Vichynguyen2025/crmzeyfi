import subprocess, json

# Get token
r = subprocess.run(['curl', '-sk', '-m', '5', '-H', 'Content-Type: application/json',
    '-d', '{"email":"admin@zeyfi.com","password":"admin123"}',
    'https://staging.zeyfi.cloud/api/auth/login'],
    capture_output=True, text=True)
tok = json.loads(r.stdout).get('accessToken', '')

# Test SEO data
print("=== SEO data ===")
r = subprocess.run(['curl', '-sk', '-m', '5', '-H', f'Authorization: Bearer {tok}',
    'https://staging.zeyfi.cloud/api/seo-revenue/dcaa6a28-3ff8-457e-ba5b-9aeccd79c4f0?month=2026-09'],
    capture_output=True, text=True)
try:
    d = json.loads(r.stdout)
    if isinstance(d, list):
        print(f"Rows: {len(d)}")
        for row in d[:3]:
            print(f"  id={row.get('id','?')[:8]} date={row.get('date')} dateStr={row.get('dateStr','')}")
    else:
        print(f"Unexpected: {r.stdout[:200]}")
except:
    print(f"Parse error: {r.stdout[:200]}")

# Test Ads data
print("\n=== Ads data ===")
r = subprocess.run(['curl', '-sk', '-m', '5', '-H', f'Authorization: Bearer {tok}',
    'https://staging.zeyfi.cloud/api/ads?month=2026-09'],
    capture_output=True, text=True)
try:
    d = json.loads(r.stdout)
    if isinstance(d, list):
        print(f"Rows: {len(d)}")
        for row in d[:3]:
            print(f"  id={row.get('id','?')[:8]} date={row.get('date')} dateStr={row.get('dateStr','')}")
    else:
        print(f"Unexpected: {r.stdout[:200]}")
except:
    print(f"Parse error: {r.stdout[:200]}")

# Test saving an ad date
print("\n=== Save ad date ===")
d = json.loads(r.stdout)
if isinstance(d, list) and len(d) > 0:
    aid = d[0]['id']
    r = subprocess.run(['curl', '-sk', '-m', '10', '-X', 'PUT', '-H', f'Authorization: Bearer {tok}',
        '-H', 'Content-Type: application/json',
        '-d', '{"date":"2026-09-25"}',
        f'https://staging.zeyfi.cloud/api/ads/{aid}'],
        capture_output=True, text=True)
    print(f"PUT: {r.stdout.strip()}")
    
    # Verify by refetching
    r = subprocess.run(['curl', '-sk', '-m', '5', '-H', f'Authorization: Bearer {tok}',
        f'https://staging.zeyfi.cloud/api/ads/{aid}'],
        capture_output=True, text=True)
    d2 = json.loads(r.stdout)
    print(f"After save: date={d2.get('date')} (expected: 2026-09-25)")
    print("PASS" if d2.get('date') == '2026-09-25' else "FAIL - date jumping!")

print("\n=== DONE ===")