import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.be817c5d90344c649c0aa89ce7b59faf',
  appName: 'construction-flow-ai-vision',
  webDir: 'dist',
  server: {
    url: 'https://be817c5d-9034-4c64-9c0a-a89ce7b59faf.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#ffffff'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: true,
      spinnerColor: '#3b82f6'
    }
  }
};

export default config;