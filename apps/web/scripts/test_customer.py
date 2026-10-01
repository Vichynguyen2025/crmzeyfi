import subprocess, json

# Get token
out = subprocess.run(['curl', '-sk', '-m', '5', '-H', 'Content-Type: application/json', 
    '-d', '{"email":"admin@zeyfi.com","password":"admin123"}',
    'https://staging.zeyfi.cloud/api/auth/login'],
    capture_output=True, text=True)
token = json.loads(out.stdout).get('accessToken', '')

# List customers
out = subprocess.run(['curl', '-sk', '-m', '5', '-H', f'Authorization: Bearer {token}',
    'https://staging.zeyfi.cloud/api/customers'],
    capture_output=True, text=True)
customers = json.loads(out.stdout)
print(f'Total: {len(customers)}')
for c in customers[:3]:
    print(f"  {c['id'][:20]}... name={c.get('name','?')} phone={c.get('phone','')}")

# Test PUT on first customer
if len(customers) > 0:
    cid = customers[0]['id']
    payload = json.dumps({'name': customers[0].get('name','Test'), 'notes': 'test save'})
    out = subprocess.run(['curl', '-sk', '-m', '10', '-X', 'PUT',
        '-H', f'Authorization: Bearer {token}',
        '-H', 'Content-Type: application/json',
        '-d', payload,
        f'https://staging.zeyfi.cloud/api/customers/{cid}'],
        capture_output=True, text=True)
    print(f'PUT /customers/{cid[:20]}...: {out.stdout.strip()}')