
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App.tsx';
import './index.css';

// Show splash screen if running in native mode
if (Capacitor.isNativePlatform()) {
  SplashScreen.show();
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
