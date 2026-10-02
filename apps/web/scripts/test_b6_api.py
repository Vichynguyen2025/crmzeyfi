import subprocess, json
s = lambda cmd: subprocess.run(cmd, capture_output=True, text=True, shell=True)

# Login
r = s("curl -sk -m 5 -H 'Content-Type: application/json' -d '{\"email\":\"admin@zeyfi.com\",\"password\":\"admin123\"}' https://staging.zeyfi.cloud/api/auth/login")
tok = json.loads(r.stdout).get('accessToken', '')
if not tok: print('Login FAIL'); exit()

B = f"curl -sk -m 5 -H 'Authorization: Bearer {tok}'"

tests = [
    ("Day + no date filter", "/actuals-summary?groupBy=product&viewMode=day"),
    ("Day + Oct filter",  "/actuals-summary?groupBy=product&viewMode=day&dateFrom=2026-10-01&dateTo=2026-10-02"),
    ("Day + Sep filter",  "/actuals-summary?groupBy=product&viewMode=day&dateFrom=2026-09-01&dateTo=2026-09-30"),
    ("Month + Sep",  "/actuals-summary?groupBy=product&viewMode=month&month=2026-09"),
    ("Month + Oct",  "/actuals-summary?groupBy=product&viewMode=month&month=2026-10"),
]
for label, url in tests:
    r2 = json.loads(s(f"{B} '{url}'").stdout)
    teams = r2.get('teams', [])
    products = r2.get('products', [])
    team_ids = [t.get('id','')[:8] for t in teams]
    print(f"\n{label}:")
    print(f"  Products: {products}")
    print(f"  Teams: {[t['name'] for t in teams]}")
    # Show data for first team
    first = team_ids[0] if team_ids else None
    if first and r2.get('data'):
        print(f"  Data for {teams[0]['name']}: {json.dumps(r2['data'].get(first, {}), default=str)[:200]}")