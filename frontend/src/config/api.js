// Centralized API configuration supporting web browser (localhost & LAN) and mobile Capacitor app
const getBaseUrl = () => {
  // Check if running inside Capacitor native mobile container
  const isNativeApp = typeof window !== 'undefined' && (
    (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (typeof window.origin === 'string' && window.origin.includes('capacitor://'))
  );

  // 1. If running as native mobile app on phone, use configured Wi-Fi IP or cloud URL
  if (isNativeApp) {
    return (import.meta.env.VITE_API_URL || 'http://192.168.0.104:5000').replace(/\/+$/, '');
  }

  // 2. If running on laptop browser (localhost / 127.0.0.1), ALWAYS connect directly to localhost:5000
  // This guarantees laptop dashboard always loads instantly without being affected by Wi-Fi IP changes
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }

  // 3. If accessing via phone browser on local Wi-Fi (e.g. http://192.168.0.104:5173)
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:5000`;
  }

  // 4. Fallback to env variable
  return (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
};

export const API_BASE_URL = getBaseUrl();
export const API_BASE = `${API_BASE_URL}/api`;
