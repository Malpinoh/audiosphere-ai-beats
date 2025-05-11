
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.tsx';
import './index.css';

// Only import and use SplashScreen when actually running on a native platform
// This prevents build issues in the web environment
if (Capacitor.isNativePlatform()) {
  // Use dynamic import for SplashScreen to prevent build issues
  import('@capacitor/splash-screen').then(({ SplashScreen }) => {
    try {
      SplashScreen.show();
    } catch (error) {
      console.error('Error showing splash screen:', error);
    }
  }).catch(error => {
    console.error('Error importing SplashScreen module:', error);
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
