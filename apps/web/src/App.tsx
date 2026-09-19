import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Reports from './pages/Reports';
import Kanban from './pages/Kanban';
import Customers from './pages/Customers';
import AdCosts from './pages/AdCosts';
import CalendarPage from './pages/Calendar';
import UsersPage from './pages/Users';
import DrivePage from './pages/Drive';
import ChannelsPage from './pages/Channels';
import ProductsPage from './pages/Products';
import AppLayout from './components/layout/AppLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('zeyfi_token') : null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const [token, setToken] = useState(typeof window !== 'undefined' ? localStorage.getItem('zeyfi_token') : null);
  useEffect(() => {
    const check = () => setToken(localStorage.getItem('zeyfi_token'));
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);
  return <Navigate to={token ? '/crm/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/" element={<RootRedirect />} />

        {/* CRM Routes with /crm prefix */}
        <Route path="/crm" element={<RootRedirect />} />
        <Route path="/crm/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/teams" element={<ProtectedRoute><AppLayout><Teams /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/teams/:teamSlug" element={<ProtectedRoute><AppLayout><Teams /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/kanban" element={<ProtectedRoute><AppLayout><Kanban /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/customers" element={<ProtectedRoute><AppLayout><Customers /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/ad-costs" element={<ProtectedRoute><AppLayout><AdCosts /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/calendar" element={<ProtectedRoute><AppLayout><CalendarPage /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/users" element={<ProtectedRoute><AppLayout><UsersPage /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/drive" element={<ProtectedRoute><AppLayout><DrivePage /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/channels" element={<ProtectedRoute><AppLayout><ChannelsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/products" element={<ProtectedRoute><AppLayout><ProductsPage /></AppLayout></ProtectedRoute>} />

        {/* Redirect old routes to new /crm/ equivalents */}
        <Route path="/dashboard" element={<Navigate to="/crm/dashboard" replace />} />
        <Route path="/teams" element={<Navigate to="/crm/teams" replace />} />
        <Route path="/teams/:teamSlug" element={<Navigate to="/crm/teams/:teamSlug" replace />} />
        <Route path="/reports" element={<Navigate to="/crm/reports" replace />} />
        <Route path="/kanban" element={<Navigate to="/crm/kanban" replace />} />
        <Route path="/customers" element={<Navigate to="/crm/customers" replace />} />
        <Route path="/ad-costs" element={<Navigate to="/crm/ad-costs" replace />} />
        <Route path="/calendar" element={<Navigate to="/crm/calendar" replace />} />
        <Route path="/users" element={<Navigate to="/crm/users" replace />} />
        <Route path="/drive" element={<Navigate to="/crm/drive" replace />} />
        <Route path="/channels" element={<Navigate to="/crm/channels" replace />} />
        <Route path="/products" element={<Navigate to="/crm/products" replace />} />
      </Routes>
    </BrowserRouter>
  );
}