import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Alerts from './pages/Alerts';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
