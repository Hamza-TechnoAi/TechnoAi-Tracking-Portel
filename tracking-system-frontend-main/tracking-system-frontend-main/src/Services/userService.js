import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../Api/api';

export const fetchUsers = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/users/list`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createStaffUser = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/api/users/staff`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const toggleBlockUser = async (userId, isBlocked) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/users/toggleBlock/${userId}`,
    { isBlocked },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await axios.delete(`${API_BASE_URL}/api/users/delete/${userId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const changePasswordByAdmin = async (userId, newPassword) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/users/change-password-byAdmin/${userId}`,
    { newPassword },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const updateProfile = async (payload) => {
  const response = await axios.put(`${API_BASE_URL}/api/users/update`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
