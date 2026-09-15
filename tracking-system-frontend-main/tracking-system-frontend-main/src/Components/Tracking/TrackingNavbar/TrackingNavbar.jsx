import { Link, useLocation } from 'react-router-dom';
import logo from '../../../assets/Logo/TechnoAi-Logo.png';
import { useAuth } from '../../../Context/AuthContext';
import './TrackingNavbar.scss';

export default function TrackingNavbar() {
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <header className="tracking-navbar">
      <div className="tracking-navbar__inner">
        <a
          href="https://technoai.ae"
          className="tracking-navbar__logo-link"
          aria-label="TechnoAi home"
        >
          <img className="tracking-navbar__logo" src={logo} alt="TechnoAi" />
        </a>

        <div className="tracking-navbar__actions">
          {user ? (
            <Link
              to="/dashboard"
              className="tracking-navbar__btn tracking-navbar__btn--primary"
            >
              Dashboard
            </Link>
          ) : !isLoginPage ? (
            <Link
              to="/login"
              className="tracking-navbar__btn tracking-navbar__btn--primary"
            >
              Login
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
