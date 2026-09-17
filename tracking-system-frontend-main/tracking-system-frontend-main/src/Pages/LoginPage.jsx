import { Navigate } from 'react-router-dom';
import Seo from '../Components/Common/Seo/Seo';
import LoginForm from '../Components/Auth/LoginForm/LoginForm';
import { useAuth } from '../Context/AuthContext';
import logo from '../assets/Logo/TechnoAi-Logo.png';
import './LoginPage.scss';

export default function LoginPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Seo
        title="Staff Login | TechnoAi Tracking"
        description="Sign in to manage purchase orders and shipments."
        path="/login"
        noindex
      />

      <main className="login-page">
        <div className="login-page__body">
          <section className="login-page__card" aria-labelledby="login-page-title">
            <div className="login-page__brand">
              <img src={logo} alt="TechnoAi" className="login-page__logo" />
              <div>
                <strong>TechnoAI</strong>
                <span>Tracking Portal</span>
              </div>
            </div>
            <h1 id="login-page-title" className="login-page__title">
              Welcome Back
            </h1>
            <p className="login-page__subtitle">
              Sign in to manage your Tracking 
            </p>

            <LoginForm />
            <p className="login-page__copyright">©TechnoAI Tracking System</p>
          </section>
        </div>
      </main>
    </>
  );
}
