export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export const getAuthToken = () => localStorage.getItem('token');

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: token } : {};
};

export { getFriendlyErrorMessage, isServerOrNetworkError } from '../Utils/apiError';
