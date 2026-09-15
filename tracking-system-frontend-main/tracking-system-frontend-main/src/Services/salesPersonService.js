import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../Api/api';

export const fetchSalesPersons = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/sales-persons/`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const createSalesPerson = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/api/sales-persons/`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateSalesPerson = async (id, payload) => {
  const response = await axios.put(`${API_BASE_URL}/api/sales-persons/${id}`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteSalesPerson = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/api/sales-persons/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
