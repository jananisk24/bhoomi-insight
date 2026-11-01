import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveApiBaseUrl } from './apiConfig';

test('uses the local backend when development has no configured API URL', () => {
  assert.equal(
    resolveApiBaseUrl(undefined, true),
    'http://127.0.0.1:8000'
  );
});

test('uses the configured API URL without trailing slashes', () => {
  assert.equal(
    resolveApiBaseUrl('https://api.example.test///', true),
    'https://api.example.test'
  );
});

test('requires an explicit API URL outside development', () => {
  assert.throws(
    () => resolveApiBaseUrl(undefined, false),
    /VITE_API_URL must be configured/
  );
});
