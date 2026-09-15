import { Link, Navigate } from 'react-router-dom';
import Seo from '../Components/Common/Seo/Seo';
import LoginForm from '../Components/Auth/LoginForm/LoginForm';
import TrackingNavbar from '../Components/Tracking/TrackingNavbar/TrackingNavbar';
import TrackingFooter from '../Components/Tracking/TrackingFooter/TrackingFooter';
import { useAuth } from '../Context/AuthContext';
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
        <TrackingNavbar />

        <div className="login-page__body">
          <section className="login-page__card" aria-labelledby="login-page-title">
            <h1 id="login-page-title" className="login-page__title">
              Staff Login
            </h1>
            <p className="login-page__subtitle">
              Sign in to manage purchase orders and shipments.
            </p>

            <LoginForm />

            <p className="login-page__back">
              <Link to="/">Back to shipment tracking</Link>
            </p>
          </section>
        </div>

        <TrackingFooter />
      </main>
    </>
  );
}
