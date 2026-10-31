import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({command, mode}) => {
  if (command === 'build' && mode === 'production') {
    const apiUrl = process.env.VITE_API_URL?.trim();
    let parsedApiUrl: URL | undefined;

    try {
      parsedApiUrl = apiUrl ? new URL(apiUrl) : undefined;
    } catch {
      throw new Error('VITE_API_URL must be a valid HTTPS API origin.');
    }

    const hostname = parsedApiUrl?.hostname.toLowerCase();
    const isLoopback =
      hostname === 'localhost' ||
      hostname?.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]';

    if (
      !parsedApiUrl ||
      parsedApiUrl.protocol !== 'https:' ||
      parsedApiUrl.pathname !== '/' ||
      parsedApiUrl.search ||
      parsedApiUrl.hash ||
      isLoopback
    ) {
      throw new Error(
        'Set VITE_API_URL to the deployed HTTPS backend origin before building.'
      );
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
