import assert from 'node:assert/strict';
import test from 'node:test';

import {
  acresToHectares,
  croresToRupees,
  hectaresToAcres,
  probabilityToPercent,
  rupeesToCrores,
} from './units';

test('converts acres and hectares using the specified factor', () => {
  assert.ok(Math.abs(acresToHectares(10) - 4.0468564224) < 1e-10);
  assert.ok(Math.abs(hectaresToAcres(4.0468564224) - 10) < 1e-10);
});

test('converts rupees and crores using the specified factor', () => {
  assert.equal(croresToRupees(2), 20_000_000);
  assert.equal(rupeesToCrores(20_000_000), 2);
});

test('converts a delay probability to a percentage', () => {
  assert.ok(Math.abs((probabilityToPercent(0.4574) ?? 0) - 45.74) < 1e-10);
  assert.equal(probabilityToPercent(1.01), null);
});
