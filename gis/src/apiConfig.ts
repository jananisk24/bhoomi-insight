const DEVELOPMENT_API_URL = 'http://127.0.0.1:8000';

export const resolveApiBaseUrl = (
  configuredApiUrl: string | undefined,
  isDevelopment: boolean
): string => {
  const apiUrl = configuredApiUrl?.trim();
  if (!apiUrl) {
    if (isDevelopment) {
      return DEVELOPMENT_API_URL;
    }
    throw new Error('VITE_API_URL must be configured before starting the frontend.');
  }

  return apiUrl.replace(/\/+$/, '');
};
