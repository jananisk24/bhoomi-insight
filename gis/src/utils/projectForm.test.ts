import assert from 'node:assert/strict';
import test from 'node:test';

import { parseProjectNumericInputs } from './projectForm';

const validInputs = {
  landArea: '12.75',
  affectedFamilies: '0',
  budgetCr: '1.25',
  approvalDaysPending: '0',
  stakeholderScore: '5',
  districtHistoricalDelay: '100',
};

test('parses editable decimal and zero values without normalizing while typing', () => {
  assert.deepEqual(parseProjectNumericInputs(validInputs), {
    landArea: 12.75,
    affectedFamilies: 0,
    budgetCr: 1.25,
    approvalDaysPending: 0,
    stakeholderScore: 5,
    districtHistoricalDelay: 100,
  });
  assert.equal(
    parseProjectNumericInputs({ ...validInputs, landArea: '' }),
    null
  );
  assert.equal(
    parseProjectNumericInputs({ ...validInputs, budgetCr: '1.' })?.budgetCr,
    1
  );
});

test('rejects numeric values outside their field bounds', () => {
  for (const [field, value] of [
    ['landArea', '0'],
    ['landArea', '-1'],
    ['affectedFamilies', '-1'],
    ['affectedFamilies', '1.5'],
    ['budgetCr', '0'],
    ['approvalDaysPending', '-1'],
    ['approvalDaysPending', '366'],
    ['approvalDaysPending', '1.5'],
    ['stakeholderScore', '0'],
    ['stakeholderScore', '6'],
    ['stakeholderScore', '1.5'],
    ['districtHistoricalDelay', '-1'],
    ['districtHistoricalDelay', '101'],
  ] as const) {
    assert.equal(
      parseProjectNumericInputs({ ...validInputs, [field]: value }),
      null,
      `${field}=${value} should be rejected`
    );
  }
});

test('rejects non-numeric and incomplete values', () => {
  assert.equal(
    parseProjectNumericInputs({ ...validInputs, landArea: '1e' }),
    null
  );
  assert.equal(
    parseProjectNumericInputs({
      ...validInputs,
      affectedFamilies: ' ',
    }),
    null
  );
  assert.equal(
    parseProjectNumericInputs({
      ...validInputs,
      districtHistoricalDelay: ' ',
    })?.districtHistoricalDelay,
    0
  );
});
