import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../Api/api';

export const fetchPurchaseOrderFilterOptions = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/purchase-orders/filter-options`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const fetchPurchaseOrders = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/purchase-orders/`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const fetchPurchaseOrderById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/api/purchase-orders/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createPurchaseOrder = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/api/purchase-orders/`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updatePurchaseOrder = async (id, payload) => {
  const response = await axios.put(`${API_BASE_URL}/api/purchase-orders/${id}`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deletePurchaseOrder = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/api/purchase-orders/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const addLineItem = async (poId, payload) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/purchase-orders/${poId}/lines`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const updateLineItem = async (poId, lineNumber, payload) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/purchase-orders/${poId}/lines/${lineNumber}`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const removeLineItem = async (poId, lineNumber) => {
  const response = await axios.delete(
    `${API_BASE_URL}/api/purchase-orders/${poId}/lines/${lineNumber}`,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const fetchPurchaseOrderActivity = async (poId, params = {}) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/purchase-orders/${poId}/activity`,
    { headers: getAuthHeaders(), params },
  );
  return response.data;
};
