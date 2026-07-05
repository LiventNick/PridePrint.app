import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  return (
    <div className="layout-container">
      <nav className="navbar glass-panel">
        <Link to="/" className="navbar-brand">
          <img src="/logo.svg" alt="PridePrint Logo" className="brand-icon" style={{ width: 32, height: 32 }} />
          <span className="brand-text">Nick's Pride Print Shop</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/poster-optimizer" className={`nav-link ${location.pathname === '/poster-optimizer' ? 'active' : ''}`}>
            Poster Optimizer
          </Link>
          <Link to="/button-printer" className={`nav-link ${location.pathname === '/button-printer' ? 'active' : ''}`}>
            Button Printer
          </Link>
        </div>
      </nav>
      <main className="layout-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="footer-content">
          <span>PridePrint.app (Nick's Pride Print Shop)</span>
          <span className="footer-divider">|</span>
          <a href="https://github.com/LiventNick/prideprint.app" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="footer-divider">|</span>
          <a href="https://github.com/LiventNick/prideprint.app/issues/new/choose" target="_blank" rel="noopener noreferrer">Report a Bug / Request a Feature</a>
          <span className="footer-divider">|</span>
          <span>Made by <a href="https://liventnick.xyz" target="_blank" rel="noopener noreferrer">LiventNick</a></span>
        </div>
      </footer>
    </div>
  );
}
