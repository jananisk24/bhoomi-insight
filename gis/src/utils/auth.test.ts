import assert from 'node:assert/strict';
import test from 'node:test';

import { registerOfficerAndLogin } from './auth';

test('registers an officer and immediately signs in with the same credentials', async () => {
  const calls: Array<{ url: string; body: string }> = [];
  const request: typeof fetch = async (input, init) => {
    calls.push({
      url: String(input),
      body: String(init?.body),
    });
    if (calls.length === 1) {
      return new Response(
        JSON.stringify({ message: 'User registered successfully' }),
        { status: 200 }
      );
    }
    return new Response(
      JSON.stringify({
        access_token: 'test-token',
        token_type: 'bearer',
        username: 'test.officer',
        role: 'Officer',
      }),
      { status: 200 }
    );
  };

  const result = await registerOfficerAndLogin(
    'test.officer',
    'valid-password',
    'https://api.example.test',
    request
  );

  assert.deepEqual(result, {
    access_token: 'test-token',
    token_type: 'bearer',
    username: 'test.officer',
    role: 'Officer',
  });
  assert.deepEqual(calls, [
    {
      url: 'https://api.example.test/register',
      body: JSON.stringify({
        username: 'test.officer',
        password: 'valid-password',
      }),
    },
    {
      url: 'https://api.example.test/login',
      body: JSON.stringify({
        username: 'test.officer',
        password: 'valid-password',
      }),
    },
  ]);
});

test('returns a clear duplicate-account registration error', async () => {
  const request: typeof fetch = async () =>
    new Response(JSON.stringify({ detail: 'Username already exists' }), {
      status: 409,
    });

  await assert.rejects(
    registerOfficerAndLogin(
      'existing.officer',
      'valid-password',
      'https://api.example.test',
      request
    ),
    /Username already exists/
  );
});
