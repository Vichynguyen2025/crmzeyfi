# Update App.tsx and Sidebar.tsx for admin settings
with open('/opt/data/crmzeyfi-ts/apps/web/src/App.tsx') as f:
    app = f.read()

# Add import
app = app.replace(
    "import AdminPermissions from './pages/AdminPermissions';",
    "import AdminPermissions from './pages/AdminPermissions';\nimport AdminSettings from './pages/AdminSettings';"
)

# Add route
app = app.replace(
    '<Route path="/admin" element={<ProtectedRoute><AppLayout><AdminPermissions /></AppLayout></ProtectedRoute>} />',
    '<Route path="/admin" element={<ProtectedRoute><AppLayout><AdminPermissions /></AppLayout></ProtectedRoute>} />\n          <Route path="/admin/settings" element={<ProtectedRoute><AppLayout><AdminSettings /></AppLayout></ProtectedRoute>} />'
)

with open('/opt/data/crmzeyfi-ts/apps/web/src/App.tsx', 'w') as f:
    f.write(app)
print('✅ App.tsx updated')

# Update Sidebar
with open('/opt/data/crmzeyfi-ts/apps/web/src/components/layout/Sidebar.tsx') as f:
    sidebar = f.read()

# Check if Settings icon already imported
if 'Settings' not in sidebar:
    sidebar = sidebar.replace(
        'import { ',
        'import { Settings, '
    )

# Add settings link after admin link
old_admin_link = '<NavLink to="/admin" className={({ isActive }) => \'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all \' + (isActive ? \'bg-primary/10 text-primary\' : \'text-muted hover:text-ink hover:bg-gray-50\')}>\n                <Shield size={18} />\n                <span>Qu\u1ea3n l\u00fd</span>\n              </NavLink>'

new_admin_link = '<NavLink to="/admin" className={({ isActive }) => \'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all \' + (isActive ? \'bg-primary/10 text-primary\' : \'text-muted hover:text-ink hover:bg-gray-50\')}>\n                <Shield size={18} />\n                <span>Qu\u1ea3n l\u00fd</span>\n              </NavLink>\n              <NavLink to="/admin/settings" className={({ isActive }) => \'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all \' + (isActive ? \'bg-primary/10 text-primary\' : \'text-muted hover:text-ink hover:bg-gray-50\')}>\n                <Settings size={18} />\n                <span>C\u00e0i \u0111\u1eb7t</span>\n              </NavLink>'

if old_admin_link in sidebar:
    sidebar = sidebar.replace(old_admin_link, new_admin_link)
    print('✅ Sidebar updated')
else:
    print('❌ Sidebar pattern not found')
    # Debug
    idx = sidebar.find('Quản lý')
    if idx >= 0:
        ctx = sidebar[idx-100:idx+100]
        print(f'Found: {repr(ctx)}')

with open('/opt/data/crmzeyfi-ts/apps/web/src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(sidebar)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])