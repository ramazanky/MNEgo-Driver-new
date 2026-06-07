// src/config.js
import { Platform } from 'react-native';

// Bilgisayarınızın IP adresi (sürücü ile aynı)
const COMPUTER_IP = '192.168.0.238';

let API_URL, BASE_URL, SOCKET_URL;

if (Platform.OS === 'android') {
  API_URL = `http://${COMPUTER_IP}:5000/api`;
  BASE_URL = `http://${COMPUTER_IP}:5000`;
  SOCKET_URL = `http://${COMPUTER_IP}:5000`;
} else if (Platform.OS === 'ios') {
  API_URL = `http://${COMPUTER_IP}:5000/api`;
  BASE_URL = `http://${COMPUTER_IP}:5000`;
  SOCKET_URL = `http://${COMPUTER_IP}:5000`;
} else {
  API_URL = 'http://localhost:5000/api';
  BASE_URL = 'http://localhost:5000';
  SOCKET_URL = 'http://localhost:5000';
}

export const COLORS = {
  inkBlack: '#0d1b2a',
  prussianBlue: '#1b263b',
  duskBlue: '#415a77',
  dustyDenim: '#778da9',
  white: '#ffffff',
  deepTeal: '#52796f',
  danger: '#e76f51',
  success: '#84a98c',
  warning: '#f4a261',
};

export { API_URL, BASE_URL, SOCKET_URL };
export default { API_URL, BASE_URL, SOCKET_URL, COLORS };