const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (!configuredApiUrl) {
  throw new Error('VITE_API_URL must be configured before starting the frontend.');
}

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');