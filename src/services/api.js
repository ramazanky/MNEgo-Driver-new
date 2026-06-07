// =====================================================
// 1. SÜRÜCÜ api.js (TAM KOD)
// =====================================================
// services/api.js - SÜRÜCÜ
import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('driver_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ========== AUTH SERVİSLER ==========
export const authService = {
  login: (phone, password, role) => api.post('/auth/login', { phone, password, role }),
  registerDriver: (data) => api.post('/auth/register/driver', data),
  forgotPassword: (phone, role) => api.post('/auth/forgot-password', { phone, role }),
  resetPassword: (phone, code, newPassword, role) => api.post('/auth/reset-password', { phone, code, newPassword, role }),
  verify: () => api.get('/auth/verify'),
};

// ========== SÜRÜCÜ SERVİSLER ==========
export const driverService = {
  getProfile: () => api.get('/driver/profile'),
  updateProfile: (data) => api.put('/driver/profile', data),
  updateAvailability: (isAvailable) => api.post('/driver/update-availability', { is_available: isAvailable }),
  updateLocation: (lat, lng) => api.post('/driver/update-location', { lat, lng }),
  getVehicles: () => api.get('/driver/vehicles'),
  getVehicle: () => api.get('/driver/vehicle'),
  updateVehicle: (data) => api.put('/driver/vehicle', data),
  getTrips: (page = 1) => api.get(`/driver/trips?page=${page}`),
  getActiveTrip: () => api.get('/driver/active-trip'),
  verifyCode: (tripId, code) => api.post('/driver/verify-code', { tripId, code }),
  completeTrip: (tripId, actual_distance, actual_duration, total_fare) =>
    api.post('/driver/complete-trip', { tripId, actual_distance, actual_duration, total_fare }),
  cancelTrip: (tripId) => api.post('/driver/cancel-trip', { tripId }),
  rateRider: (tripId, rating) => api.post('/trips/rate-rider', { tripId, rating }),
};

// ========== TRIP SERVİSLER (CHAT İÇİN) ==========
export const tripService = {
  getMessages: (tripId) => api.get(`/trips/${tripId}/messages`),
  sendMessage: (tripId, message, senderId, senderType) => {
    socketService.sendMessage(tripId, message, senderId, senderType);
  },
};

export default api;