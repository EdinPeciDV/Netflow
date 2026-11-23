import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1 className="sidebar-title">NetFlow</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/devices">Devices</NavLink>
          <NavLink to="/alerts">Alerts</NavLink>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
