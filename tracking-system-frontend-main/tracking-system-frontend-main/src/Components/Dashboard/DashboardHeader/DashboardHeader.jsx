import { Link } from 'react-router-dom';
import { MdAccountCircle } from 'react-icons/md';
import logo from '../../../assets/Logo/TechnoAi-Logo.png';
import { useAuth } from '../../../Context/AuthContext';
import { ROLE_LABELS } from '../../../Constants/roles';
import './DashboardHeader.scss';

export default function DashboardHeader() {
  const { user } = useAuth();

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Staff';
  const roleLabel = ROLE_LABELS[user?.role] || user?.role || '';

  return (
    <header className="dashboard-header">
      <Link to="/dashboard" className="dashboard-header__brand" aria-label="TechnoAi dashboard home">
        <img src={logo} alt="TechnoAi" className="dashboard-header__logo" />
      </Link>

      <div className="dashboard-header__user">
        <MdAccountCircle className="dashboard-header__account-icon" aria-hidden />
        <div className="dashboard-header__user-info">
          <p className="dashboard-header__user-name">{displayName}</p>
          <p className="dashboard-header__user-role">{roleLabel}</p>
        </div>
      </div>
    </header>
  );
}
