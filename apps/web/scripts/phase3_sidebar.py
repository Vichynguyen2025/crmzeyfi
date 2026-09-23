with open('/opt/data/crmzeyfi-ts/apps/web/src/components/layout/Sidebar.tsx') as f:
    s = f.read()

# Fix duplicate imports
s = s.replace("import { Settings, useState, useEffect } from 'react';\nimport { Settings, useNavigate, useLocation } from 'react-router-dom';\nimport { Settings, api } from '../../lib/api';\nimport { Settings, LayoutDashboard,", 
              "import { useState, useEffect } from 'react';\nimport { useNavigate, useLocation } from 'react-router-dom';\nimport { api } from '../../lib/api';\nimport { Settings, LayoutDashboard,")

# Add Settings button after Phân quyền
s = s.replace(
    '{isAdmin && (\n          <button onClick={() => nav(\'/crm/admin\')}',
    '{isAdmin && (\n          <button onClick={() => nav(\'/admin/settings\')}\n            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all\n              ${loc.pathname.startsWith(\'/admin/settings\') ? \'bg-white/10 text-white shadow-sm\' : \'text-white/60 hover:bg-white/5 hover:text-white/90\'}`}>\n            <Settings size={20} className={loc.pathname.startsWith(\'/admin/settings\') ? \'text-primary\' : \'\'} />\n            {!collapsed && <span className="flex-1 text-left">Cài đặt</span>}\n          </button>\n        )}\n        {isAdmin && (\n          <button onClick={() => nav(\'/crm/admin\')}'
)

with open('/opt/data/crmzeyfi-ts/apps/web/src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(s)

import subprocess
r = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True, timeout=30, cwd='/opt/data/crmzeyfi-ts/apps/web')
print('Build:', 'OK' if r.returncode == 0 else r.stderr[-200:])