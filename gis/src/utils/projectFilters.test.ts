import assert from 'node:assert/strict';
import test from 'node:test';

import type { Project } from '../types';
import {
  filterProjectsByJurisdiction,
  getProjectDistricts,
  getProjectStates,
} from './projectFilters';

const project = (state: string, district: string, id: string): Project => ({
  id,
  name: `Project ${id}`,
  district,
  state,
  landArea: 10,
  affectedFamilies: 1,
  compensationStatus: 'Pending (<25%)',
  legalDispute: false,
  approvalStatus: 'In Administrative Review',
  rehabilitationStatus: 'Not Started',
  riskScore: null,
  riskCategory: 'Not Predicted',
  status: 'Not Predicted',
  coordinates: null,
  projectType: 'Highway',
  delayFactors: {
    compensationPending: 80,
    legalDispute: 15,
    approvalDelay: 40,
    rehabilitationGap: 90,
  },
  recommendedActions: [],
  createdDate: '',
  estimatedDelayMonths: null,
  budgetCr: 0,
});

const projects = [
  project('Tamil Nadu', 'Chennai', '1'),
  project('Tamil Nadu', 'Salem', '2'),
  project('Karnataka', 'Mysuru', '3'),
];

test('jurisdiction options derive from saved projects, sorted and scoped', () => {
  assert.deepEqual(getProjectStates(projects), ['Karnataka', 'Tamil Nadu']);
  assert.deepEqual(getProjectDistricts(projects, 'Tamil Nadu'), [
    'Chennai',
    'Salem',
  ]);
});

test('jurisdiction filtering combines state and district without changing input', () => {
  const filtered = filterProjectsByJurisdiction(
    projects,
    'Tamil Nadu',
    'Salem'
  );

  assert.deepEqual(filtered.map((item) => item.id), ['2']);
  assert.equal(projects.length, 3);
});
