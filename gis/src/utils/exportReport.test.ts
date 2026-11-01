import assert from 'node:assert/strict';
import test from 'node:test';

import type { Project } from '../types';
import {
  buildExecutiveAssessment,
  buildProjectAuditText,
  buildProjectsCsv,
} from './exportReport';

const project = (overrides: Partial<Project> = {}): Project => ({
  id: '1',
  name: 'Road, Phase 1',
  district: 'Chennai',
  state: 'Tamil Nadu',
  landArea: 10,
  affectedFamilies: 25,
  compensationStatus: 'Pending (<25%)',
  legalDispute: false,
  approvalStatus: 'In Administrative Review',
  rehabilitationStatus: 'Not Started',
  riskScore: 62.5,
  riskCategory: 'Medium',
  status: 'Moderate Delay',
  coordinates: null,
  projectType: 'Highway',
  delayFactors: {
    compensationPending: 80,
    legalDispute: 15,
    approvalDelay: 40,
    rehabilitationGap: 90,
  },
  recommendedActions: ['Review the pending claims.'],
  createdDate: '2026-01-02',
  estimatedDelayMonths: null,
  budgetCr: 0,
  ...overrides,
});

test('CSV export quotes fields, neutralizes formulas, and leaves missing risk blank', () => {
  const csv = buildProjectsCsv([
    project({
      name: '=HYPERLINK("https://example.test","open")',
      riskScore: null,
      riskCategory: 'Not Predicted',
      status: 'Not Predicted',
    }),
  ]);
  const row = csv.split('\r\n')[1];

  assert.ok(row.includes('"\'=HYPERLINK(""https://example.test"",""open"")"'));
  assert.ok(row.includes(',"","Not Predicted","Not Predicted"'));
  assert.ok(csv.includes('"Estimated Delay (Months)"'));
});

test('executive report averages only valid saved probabilities and avoids delay estimates', () => {
  const report = buildExecutiveAssessment(
    [
      project(),
      project({
        id: '2',
        riskScore: null,
        riskCategory: 'Not Predicted',
      }),
    ],
    'Tamil Nadu',
    'Chennai',
    new Date('2026-01-01T00:00:00.000Z')
  );

  assert.ok(report.includes('Projects with saved model probabilities: 1'));
  assert.ok(report.includes('Average saved delay probability: 62.50%'));
  assert.ok(report.includes('Projects without a valid saved probability: 1'));
  assert.ok(report.includes('Delay duration is not estimated by the model.'));
});

test('project audit identifies unsupported delay duration and heuristic factors', () => {
  const report = buildProjectAuditText(
    project({ riskScore: null, riskCategory: 'Not Predicted' }),
    new Date('2026-01-01T00:00:00.000Z')
  );

  assert.ok(report.includes('Saved model delay probability: Not predicted'));
  assert.ok(report.includes('Estimated delay duration: Not estimated by the model'));
  assert.ok(report.includes('not model feature attribution'));
  assert.ok(report.includes('Compensation: 80%'));
});
