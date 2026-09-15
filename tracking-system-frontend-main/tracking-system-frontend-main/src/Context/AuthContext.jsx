import { createContext, useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedDashboardMenu, setSelectedDashboardMenu] = useState('');

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    toast.success('Successfully logged out');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('dashboardMenu');
    navigate('/');
  };

  const handleDashboardMenuChange = useCallback((menu) => {
    setSelectedDashboardMenu(menu);
    if (menu) {
      localStorage.setItem('dashboardMenu', menu);
    } else {
      localStorage.removeItem('dashboardMenu');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        handleLogin,
        handleLogout,
        selectedDashboardMenu,
        handleDashboardMenuChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
