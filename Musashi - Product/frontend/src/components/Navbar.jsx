/**
 * NAVIGATION BAR
 *
 * Shows at top of every page.
 * Displays user balance and navigation links.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Format balance from cents to dollars
  const formatBalance = (cents) => {
    return '$' + (cents / 100).toFixed(2);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <img src="/katana-logo.svg" alt="Musashi" className="navbar-logo" />
          <span>MUSASHI</span>
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/">Markets</Link>
        {user && <Link to="/portfolio">Portfolio</Link>}
      </div>

      <div className="navbar-auth">
        {user ? (
          <>
            <span className="balance">{formatBalance(user.balance)}</span>
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
