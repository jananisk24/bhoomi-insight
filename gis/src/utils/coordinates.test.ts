import assert from 'node:assert/strict';
import test from 'node:test';

import { formatCoordinates, isValidCoordinatePair } from './coordinates';

test('accepts empty or in-range paired coordinates only', () => {
  assert.equal(isValidCoordinatePair('', ''), true);
  assert.equal(isValidCoordinatePair('13.0827', '80.2707'), true);
  assert.equal(isValidCoordinatePair('-90', '180'), true);
  assert.equal(isValidCoordinatePair('90.01', '80'), false);
  assert.equal(isValidCoordinatePair('13', '-180.01'), false);
  assert.equal(isValidCoordinatePair('13', ''), false);
  assert.equal(isValidCoordinatePair('north', '80'), false);
});

test('rounds map-selected coordinates to six decimal places', () => {
  assert.deepEqual(formatCoordinates(13.082712345, 80.270798765), [
    13.082712,
    80.270799,
  ]);
});
