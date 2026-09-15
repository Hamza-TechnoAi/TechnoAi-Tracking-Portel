import axios from 'axios';
import { API_BASE_URL } from '../Api/api';

export const trackPurchaseOrder = async (poNumber) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/track/${encodeURIComponent(poNumber.trim())}`,
  );
  return response.data;
};

export const subscribeToTrackUpdates = async (poNumber, email) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/track/${encodeURIComponent(poNumber.trim())}/subscribe`,
    { email },
  );
  return response.data;
};
