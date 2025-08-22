// config/config.ts

export interface AppConfig {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  UPLOAD_TIMEOUT: number;
  PROCESSING_TIMEOUT: number;
  MAX_RETRY_ATTEMPTS: number;
}

// Development configuration
const DEV_CONFIG: AppConfig = {
  API_BASE_URL: 'https://boulevard-thorough-lives-cuts.trycloudflare.com',  // HTTPS for Cloudflare
  WS_BASE_URL: 'wss://boulevard-thorough-lives-cuts.trycloudflare.com',     // WSS for Cloudflare WebSocket
  UPLOAD_TIMEOUT: 60000, // 60 seconds (longer for Cloudflare)
  PROCESSING_TIMEOUT: 180000, // 3 minutes
  MAX_RETRY_ATTEMPTS: 3,
};

// Production configuration
const PROD_CONFIG: AppConfig = {
  API_BASE_URL: 'http://YOUR_PRODUCTION_SERVER:8000',
  WS_BASE_URL: 'ws://YOUR_PRODUCTION_SERVER:8000',
  UPLOAD_TIMEOUT: 60000, // 60 seconds
  PROCESSING_TIMEOUT: 180000, // 3 minutes
  MAX_RETRY_ATTEMPTS: 5,
};

// Automatically select config based on environment
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

export const CONFIG: AppConfig = isDevelopment ? DEV_CONFIG : PROD_CONFIG;

// Helper functions
export const getApiUrl = (endpoint: string): string => {
  return `${CONFIG.API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

export const getWsUrl = (endpoint: string): string => {
  return `${CONFIG.WS_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

export default CONFIG;