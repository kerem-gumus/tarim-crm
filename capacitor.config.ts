import type { CapacitorConfig } from '@capacitor/cli';

// Production URL — deploy sonrası buraya gerçek adres gelecek
// Geliştirme için: 'http://10.0.2.2:3000' (Android emulator) veya 'http://localhost:3000' (iOS simulator)
const PRODUCTION_URL = process.env.CAPACITOR_SERVER_URL ?? 'http://192.168.50.46:3000/';

const config: CapacitorConfig = {
  appId: 'com.tarimcrm.app',
  appName: 'TarimCRM',
  webDir: 'out', // server.url tanımlıyken kullanılmaz, fallback olarak kalır
  server: {
    // Server URL modu: uygulama bu adresi native WebView'da açar.
    // SSR, API route, middleware, auth cookie — hepsi tam çalışır.
    url: PRODUCTION_URL,
    cleartext: true,        // HTTP (yerel ağ) için gerekli; production'da false yap
    androidScheme: 'http',  // URL http:// ise bu da http olmalı; production'da https yap
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2b7a2b',
      showSpinner: false,
    },
    // Capacitor Network: çevrimiçi/çevrimdışı algılama
    Network: {},
  },
  android: {
    allowMixedContent: true, // HTTP içerik için gerekli; production'da false yap
    captureInput: true,
    webContentsDebuggingEnabled: false, // production'da false
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
};

export default config;
