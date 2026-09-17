import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAccountCircle, MdKeyboardArrowDown, MdLogout, MdPersonOutline } from 'react-icons/md';
import logo from '../../../assets/Logo/TechnoAi-Logo.png';
import { useAuth } from '../../../Context/AuthContext';
import { ROLE_LABELS } from '../../../Constants/roles';
import './DashboardHeader.scss';
import NotificationBell from '../NotificationBell/NotificationBell';

export default function DashboardHeader({ onProfileClick }) {
  const { user, handleLogout } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Staff';
  const roleLabel = ROLE_LABELS[user?.role] || user?.role || '';

  useEffect(() => {
    const closeAccountMenu = (event) => {
      if (event.key === 'Escape' || !accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', closeAccountMenu);
    document.addEventListener('keydown', closeAccountMenu);
    return () => {
      document.removeEventListener('mousedown', closeAccountMenu);
      document.removeEventListener('keydown', closeAccountMenu);
    };
  }, []);

  const openProfile = () => {
    setIsAccountMenuOpen(false);
    onProfileClick?.();
  };

  return (
    <header className="dashboard-header">
      <Link to="/dashboard" className="dashboard-header__brand" aria-label="TechnoAi dashboard home">
        <img src={logo} alt="TechnoAi" className="dashboard-header__logo" />
        <span className="dashboard-header__brand-divider" aria-hidden />
        <span className="dashboard-header__brand-context">Operations hub</span>
      </Link>

      <div className="dashboard-header__actions">
        <NotificationBell />
        <div className="dashboard-header__account-menu" ref={accountMenuRef}>
          <button type="button" className="dashboard-header__user" aria-label={`Signed in as ${displayName}`} aria-expanded={isAccountMenuOpen} aria-haspopup="menu" onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}>
            <MdAccountCircle className="dashboard-header__account-icon" aria-hidden />
            <div className="dashboard-header__user-info">
              <p className="dashboard-header__user-name">{displayName}</p>
              <p className="dashboard-header__user-role">{roleLabel}</p>
            </div>
            <MdKeyboardArrowDown className={`dashboard-header__account-chevron${isAccountMenuOpen ? ' is-open' : ''}`} aria-hidden />
          </button>
          {isAccountMenuOpen && (
            <div className="dashboard-header__account-dropdown" role="menu">
              <button type="button" role="menuitem" onClick={openProfile}><MdPersonOutline aria-hidden />Profile</button>
              <button type="button" role="menuitem" className="is-logout" onClick={handleLogout}><MdLogout aria-hidden />Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
