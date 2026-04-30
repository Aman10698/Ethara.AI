import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Logo = () => (
  <div className="sidebar-logo">
    <div className="sidebar-logo-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <div>
      <div className="sidebar-logo-text">Team Task Manager</div>
      <div className="sidebar-logo-sub">Manage &amp; track progress</div>
    </div>
  </div>
);

const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  let navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/projects', label: 'Projects' },
    { to: '/tasks', label: 'Tasks' },
    { to: '/reports', label: 'Reports' },
    { to: '/settings', label: 'Settings' },
  ];

  if (isAdmin) {
    navItems.splice(3, 0, { to: '/users', label: 'Members' });
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <Logo />
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          let isActive = false;
          if (location.pathname === item.to) {
            isActive = true;
          } else if (item.to !== '/dashboard' && location.pathname.startsWith(item.to)) {
            isActive = true;
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{
          width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0
        }}>
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2 }} className="truncate">
            {user?.name}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }} className="truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

const AppLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="top-header">
          <div className="search-bar">
            <input placeholder="Search anything..." />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user?.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role === 'admin' ? 'Admin' : 'Member'}</p>
            </div>
          </div>
        </header>

        <div className="page-body fade-in">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
