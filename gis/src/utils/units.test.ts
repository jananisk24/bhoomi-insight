import assert from 'node:assert/strict';
import test from 'node:test';

import {
  acresToHectares,
  croresToRupees,
  formatAcres,
  formatAcresLabel,
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

test('formats acre values with at most two decimals and no trailing zeros', () => {
  assert.equal(formatAcres(25), '25');
  assert.equal(formatAcres(25.5), '25.5');
  assert.equal(formatAcres(25.56789), '25.57');
  assert.equal(formatAcres(864.868), '864.87');
  assert.equal(formatAcres(0), '0');
  assert.equal(formatAcres(1234.5), '1234.5');
});

test('formats acre labels with units and handles missing values', () => {
  assert.equal(formatAcresLabel(25.56789), '25.57 Acres');
  assert.equal(formatAcresLabel(864.868), '864.87 Acres');
  assert.equal(formatAcresLabel(1234.5), '1,234.5 Acres');
  assert.equal(formatAcresLabel(null), 'N/A');
  assert.equal(formatAcresLabel(undefined), 'N/A');
  assert.equal(formatAcres(Number.NaN), 'N/A');
  assert.equal(formatAcres(Number.POSITIVE_INFINITY), 'N/A');
});

test('calculates the risk score percentage from model probability', () => {
  assert.ok(Math.abs((probabilityToPercent(0.4574) ?? 0) - 45.74) < 1e-10);
  assert.equal(probabilityToPercent(0), 0);
  assert.equal(probabilityToPercent(1), 100);
  assert.equal(probabilityToPercent(1.01), null);
});
