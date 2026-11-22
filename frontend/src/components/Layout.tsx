import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1 className="sidebar-title">NetFlow</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/devices">Devices</NavLink>
          <NavLink to="/alerts">Alerts</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
