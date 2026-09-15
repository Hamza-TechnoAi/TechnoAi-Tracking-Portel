import { MdSpaceDashboard, MdInventory2, MdPeople, MdPerson, MdLock, MdAssessment, MdBadge } from 'react-icons/md';
import { TbLogout } from 'react-icons/tb';
import { useAuth } from '../../../Context/AuthContext';
import { ADMIN_ROLES } from '../../../Constants/roles';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import './DashboardLayout.scss';

const MAIN_MENU = [
  {
    id: 'overview',
    name: 'Overview',
    icon: MdSpaceDashboard,
  },
  {
    id: 'purchase-orders',
    name: 'Purchase Orders',
    icon: MdInventory2,
  },
];

const ADMIN_MENU = [
  {
    id: 'users',
    name: 'Users',
    icon: MdPeople,
  },
];

const REPORTING_MENU = [
  {
    id: 'reporting',
    name: 'Reporting',
    icon: MdAssessment,
  },
];

const SALES_PERSONS_MENU = [
  {
    id: 'sales-persons',
    name: 'Sales Persons',
    icon: MdBadge,
  },
];

const BOTTOM_MENU = [
  {
    id: 'profile',
    name: 'Profile',
    icon: MdPerson,
  },
  {
    id: 'password',
    name: 'Password',
    icon: MdLock,
  },
];

const renderNavItem = (item, activeMenu, onMenuChange) => {
  const Icon = item.icon;
  const isActive = activeMenu === item.id;

  return (
    <button
      key={item.id}
      type="button"
      className={`dashboard-layout__nav-item${isActive ? ' is-active' : ''}`}
      onClick={() => onMenuChange(item.id)}
    >
      <Icon className="icon" aria-hidden />
      {item.name}
    </button>
  );
};

export default function DashboardLayout({
  activeMenu,
  onMenuChange,
  children,
}) {
  const { user, handleLogout } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const mainMenuItems = isAdmin ? [...MAIN_MENU, ...ADMIN_MENU] : MAIN_MENU;

  return (
    <div className="dashboard-layout">
      <DashboardHeader />

      <div className="dashboard-layout__body">
        <aside className="dashboard-layout__sidebar">
          <nav className="dashboard-layout__nav" aria-label="Dashboard">
            {mainMenuItems.map((item) => renderNavItem(item, activeMenu, onMenuChange))}
            {REPORTING_MENU.map((item) => renderNavItem(item, activeMenu, onMenuChange))}
            {isAdmin && SALES_PERSONS_MENU.map((item) => renderNavItem(item, activeMenu, onMenuChange))}
          </nav>

          <div className="dashboard-layout__sidebar-footer">
            <nav className="dashboard-layout__nav dashboard-layout__nav--footer" aria-label="Account">
              {BOTTOM_MENU.map((item) => renderNavItem(item, activeMenu, onMenuChange))}
            </nav>

            <button
              type="button"
              className="dashboard-layout__logout"
              onClick={handleLogout}
            >
              <TbLogout className="dashboard-layout__logout-icon" aria-hidden />
              Logout
            </button>
          </div>
        </aside>

        <main className="dashboard-layout__content">{children}</main>
      </div>
    </div>
  );
}
