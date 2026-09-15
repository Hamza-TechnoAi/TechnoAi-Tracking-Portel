import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getAuthToken } from '../Api/api';

export default function PrivateRoutes({ children, permittedRoles = [] }) {
  const { user } = useAuth();
  const token = getAuthToken();

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  if (!user && token) {
    return (
      <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
        Loading session...
      </div>
    );
  }

  if (user && permittedRoles.length > 0 && !permittedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
