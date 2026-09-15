import TrackingPage from '../Pages/TrackingPage';
import DashboardPage from '../Pages/DashboardPage';
import LoginPage from '../Pages/LoginPage';
import UnauthorizedPage from '../Pages/UnauthorizedPage';
import { STAFF_ROLES } from '../Constants/roles';

const routes = [
  {
    path: '/',
    element: <TrackingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
    isProtected: true,
    roles: STAFF_ROLES,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
];

export default routes;
