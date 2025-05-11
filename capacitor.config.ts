
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.37c241b2011b4b289680e9eaec2c83e7',
  appName: 'maudio',
  webDir: 'dist',
  server: {
    url: 'https://37c241b2-011b-4b28-9680-e9eaec2c83e7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#121212",
      showSpinner: true,
      spinnerColor: "#a855f7"
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#121212"
    }
  }
};

export default config;
