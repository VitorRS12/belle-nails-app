import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bellenails',
  appName: 'Belle Nails',
  webDir: 'dist',
  server: {
    url: 'https://8011af2c-9eff-47f8-bbdd-af8a9c4a5689.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
