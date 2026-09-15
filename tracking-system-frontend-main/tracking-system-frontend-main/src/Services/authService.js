import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../Api/api';

export const loginUser = async ({ username, password }) => {
  const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
    username,
    password,
  });
  return response.data;
};

export const fetchAccount = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/users/account`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/users/change-password`,
    { currentPassword, newPassword },
    { headers: getAuthHeaders() },
  );
  return response.data;
};
