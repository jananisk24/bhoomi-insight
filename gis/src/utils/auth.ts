export interface AuthResponse {
  access_token: string;
  token_type: string;
  username: string;
  role: 'Officer' | 'Admin';
}

const requestError = async (
  response: Response,
  operation: string
): Promise<string> => {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      typeof body.detail === 'string'
    ) {
      return body.detail;
    }
  } catch {
    // Fall back to the explicit HTTP status when the server response is not JSON.
  }
  return `${operation} failed (HTTP ${response.status}).`;
};

const parseAuthResponse = async (response: Response): Promise<AuthResponse> => {
  const body: unknown = await response.json();
  if (
    typeof body !== 'object' ||
    body === null ||
    !('access_token' in body) ||
    typeof body.access_token !== 'string' ||
    body.access_token.length === 0 ||
    !('username' in body) ||
    typeof body.username !== 'string' ||
    !('role' in body) ||
    (body.role !== 'Officer' && body.role !== 'Admin')
  ) {
    throw new Error('The server returned an invalid login response.');
  }

  return {
    access_token: body.access_token,
    token_type:
      'token_type' in body && typeof body.token_type === 'string'
        ? body.token_type
        : 'bearer',
    username: body.username,
    role: body.role,
  };
};

export const registerOfficerAndLogin = async (
  username: string,
  password: string,
  apiBaseUrl: string,
  request: typeof fetch = fetch
): Promise<AuthResponse> => {
  const credentials = { username, password };
  const registration = await request(`${apiBaseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!registration.ok) {
    throw new Error(await requestError(registration, 'Registration'));
  }

  const login = await request(`${apiBaseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!login.ok) {
    throw new Error(
      `Account created, but automatic sign-in failed: ${await requestError(login, 'Login')}`
    );
  }

  return parseAuthResponse(login);
};
