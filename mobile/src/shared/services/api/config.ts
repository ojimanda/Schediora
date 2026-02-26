import { Platform } from 'react-native';

const devHost = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';

export const API_BASE_URL = `http://${devHost}:8000/api/v1`;
export const REQUEST_TIMEOUT_MS = 12000;
