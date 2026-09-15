import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import AppRouter from './Components/AppRouter/AppRouter';
import routes from './Routes/routes';
import { useAuth } from './Context/AuthContext';
import { fetchAccount } from './Services/authService';
import { getAuthToken } from './Api/api';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { handleLogin } = useAuth();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    (async () => {
      try {
        const userData = await fetchAccount();
        handleLogin(userData);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
        }
      }
    })();
  }, [handleLogin]);

  return (
    <div className="app-shell">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
      <AppRouter routes={routes} />
    </div>
  );
}

export default App;
