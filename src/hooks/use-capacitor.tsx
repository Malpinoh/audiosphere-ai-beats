
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export function useCapacitor() {
  const [isNative, setIsNative] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if running in a native app context
    setIsNative(Capacitor.isNativePlatform());
    
    // Initialize native UI components
    if (Capacitor.isNativePlatform()) {
      initializeNative();
    }
  }, []);

  const initializeNative = async () => {
    try {
      // Dynamically import StatusBar and SplashScreen to prevent build errors
      const statusBarModule = await import('@capacitor/status-bar');
      const splashScreenModule = await import('@capacitor/splash-screen');
      
      const StatusBar = statusBarModule.StatusBar;
      const SplashScreen = splashScreenModule.SplashScreen;
      
      await StatusBar.setStyle({ style: statusBarModule.Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#121212' });
      
      // Hide the splash screen with a fade out
      await SplashScreen.hide({
        fadeOutDuration: 500
      });
    } catch (error) {
      console.error('Error initializing native UI:', error);
    }
  };
  
  const shareContent = async (title: string, text: string, url: string) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title,
          text,
          url,
          dialogTitle: 'Share with friends'
        });
        return true;
      } catch (error) {
        console.error('Error sharing content natively:', error);
        return false;
      }
    }
    return false;
  };

  return {
    isNative,
    shareContent
  };
}
