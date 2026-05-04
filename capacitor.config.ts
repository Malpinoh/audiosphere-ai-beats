
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.37c241b2011b4b289680e9eaec2c83e7',
  appName: 'maudio',
  webDir: 'dist',
  // NOTE: `server.url` is intentionally NOT set so the Android app always loads
  // the latest compiled web bundle from `dist/` after `npx cap sync`.
  // Re-enable only for live-reload during development.
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
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
    },
    CapacitorSQLite: {
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false
      }
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#7c3aed"
    }
  }
};

export default config;
