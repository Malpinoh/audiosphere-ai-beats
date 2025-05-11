
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

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
      await StatusBar.setStyle({ style: 'dark' });
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
    if (Capacitor.isNativePlatform() && Capacitor.Plugins.Share) {
      try {
        await Capacitor.Plugins.Share.share({
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
