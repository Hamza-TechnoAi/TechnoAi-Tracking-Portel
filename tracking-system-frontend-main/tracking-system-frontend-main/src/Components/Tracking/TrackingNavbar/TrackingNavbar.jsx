import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MdChevronLeft } from 'react-icons/md';
import logo from '../../../assets/Logo/TechnoAi-Logo.png';
import './TrackingNavbar.scss';

export default function TrackingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className="tracking-navbar" ref={menuRef}>
      <div className="tracking-navbar__inner">
        <a
          href="https://technoai.ae"
          className="tracking-navbar__logo-link"
          aria-label="TechnoAi home"
        >
          <img className="tracking-navbar__logo" src={logo} alt="TechnoAi" />
        </a>

        <div className="tracking-navbar__actions">
          <div className="tracking-navbar__site-control">
            <a
              href="https://technoai.ae/"
              className="tracking-navbar__site-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className="tracking-navbar__globe-icon"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.4" />
                <path d="M6 24h36M24 6c5.2 5 8 11 8 18s-2.8 13-8 18c-5.2-5-8-11-8-18S18.8 11 24 6Z" stroke="currentColor" strokeWidth="2.4" />
                <path d="M9.5 15h29M9.5 33h29" stroke="currentColor" strokeWidth="2.4" />
              </svg>
              <span className="tracking-navbar__sr-only">Visit TechnoAI.ae</span>
            </a>
          </div>

        </div>
      </div>

      <button
        type="button"
        className={`tracking-navbar__menu-toggle${isMenuOpen ? ' is-open' : ''}`}
        aria-label="Open navigation menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <MdChevronLeft aria-hidden="true" />
      </button>

      {isMenuOpen && (
        <div className="tracking-navbar__dropdown" role="menu">
          <NavLink
            to="/login"
            role="menuitem"
            className={({ isActive }) => (isActive ? 'is-active' : '')}
            onClick={() => setIsMenuOpen(false)}
          >
            Login
          </NavLink>
          <NavLink
            to="/dashboard"
            role="menuitem"
            className={({ isActive }) => (isActive ? 'is-active' : '')}
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </NavLink>
        </div>
      )}
    </header>
  );
}
