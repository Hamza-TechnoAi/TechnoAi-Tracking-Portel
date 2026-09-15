import { useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import DashboardLayout from '../Components/Dashboard/DashboardLayout/DashboardLayout';
import DashboardOverview from '../Components/Dashboard/DashboardOverview/DashboardOverview';
import UserManagement from '../Components/Dashboard/UserManagement/UserManagement';
import PurchaseOrders from '../Components/Dashboard/PurchaseOrders/PurchaseOrders';
import Reporting from '../Components/Dashboard/Reporting/Reporting';
import SalesPersons from '../Components/Dashboard/SalesPersons/SalesPersons';
import ProfileSettings from '../Components/Dashboard/ProfileSettings/ProfileSettings';
import ChangePassword from '../Components/Dashboard/ChangePassword/ChangePassword';

const DASHBOARD_VIEWS = {
  overview: DashboardOverview,
  users: UserManagement,
  'purchase-orders': PurchaseOrders,
  reporting: Reporting,
  'sales-persons': SalesPersons,
  profile: ProfileSettings,
  password: ChangePassword,
};

export default function DashboardPage() {
  const { selectedDashboardMenu, handleDashboardMenuChange } = useAuth();
  const activeMenu = selectedDashboardMenu || 'overview';
  const ActiveView = DASHBOARD_VIEWS[activeMenu] || DashboardOverview;

  useEffect(() => {
    const savedMenu = localStorage.getItem('dashboardMenu');
    if (savedMenu && !selectedDashboardMenu) {
      handleDashboardMenuChange(savedMenu);
    } else if (!selectedDashboardMenu) {
      handleDashboardMenuChange('overview');
    }
  }, [handleDashboardMenuChange, selectedDashboardMenu]);

  return (
    <DashboardLayout
      activeMenu={activeMenu}
      onMenuChange={handleDashboardMenuChange}
    >
      <ActiveView key={activeMenu} />
    </DashboardLayout>
  );
}
