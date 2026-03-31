import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        product: 'http://localhost:3001/assets/remoteEntry.js',
        cart: 'http://localhost:3002/assets/remoteEntry.js',
      },
      shared: {
        // eager: true → included in shell's initial bundle, not async loaded
        // singleton: true → only one instance across all MFEs, version mismatch throws warning
        react: { singleton: true, eager: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.2.0' },
        // router doesn't need eager — loaded when first MF mounts
        'react-router-dom': { singleton: true, requiredVersion: '^6.22.0' },
      },
    }),
  ],
  build: { target: 'esnext' },
});
