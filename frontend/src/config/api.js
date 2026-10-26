// Centralized API configuration supporting web browser (localhost, LAN, Cloud) and mobile Capacitor app
const CLOUD_BACKEND_URL = 'https://modern-interior-backend.onrender.com';

const getBaseUrl = () => {
  // Check if running inside Capacitor native mobile container
  const isNativeApp = typeof window !== 'undefined' && (
    (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (typeof window.origin === 'string' && window.origin.includes('capacitor://'))
  );

  // 1. If running as native mobile app on phone
  if (isNativeApp) {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('192.168.')) {
      return envUrl.replace(/\/+$/, '');
    }
    return CLOUD_BACKEND_URL;
  }

  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || '';

    // 2. Laptop browser dev (localhost / 127.0.0.1)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    // 3. Local Wi-Fi testing on LAN (e.g. 192.168.x.x, 10.x.x.x)
    const isLocalLanIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
    if (isLocalLanIp) {
      return `http://${hostname}:5000`;
    }

    // 4. Deployed online (Render, Vercel, or custom cloud domain)
    return CLOUD_BACKEND_URL;
  }

  // 5. Fallback
  return CLOUD_BACKEND_URL;
};

export const API_BASE_URL = getBaseUrl();
export const API_BASE = `${API_BASE_URL}/api`;
