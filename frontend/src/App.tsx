import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import AlertRules from './pages/AlertRules';
import Alerts from './pages/Alerts';
import Dashboard from './pages/Dashboard';
import DeviceDetail from './pages/DeviceDetail';
import Devices from './pages/Devices';
import Flows from './pages/Flows';
import Login from './pages/Login';
import type { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="devices" element={<Devices />} />
            <Route path="devices/:id" element={<DeviceDetail />} />
            <Route path="flows" element={<Flows />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="alert-rules" element={<AlertRules />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
