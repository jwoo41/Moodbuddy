import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindflow.app',
  appName: 'MindFlow',
  webDir: 'dist/public',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#2563eb",
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small"
    },
    StatusBar: {
      style: "default",
      backgroundColor: "#2563eb"
    }
  }
};

export default config;
