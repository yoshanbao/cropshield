import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_USERS, canViewCase, canUpdateCase, simulateScreening, starterLibrary, validateLibraryEntry } from '../demo';
import { type CropCase } from '../monitoring';
const record = { createdById: 'worker-1', assignedTo: ['worker-2'] } as CropCase;
test('worker demo access is limited to own or assigned cases; owners oversee farm cases', () => {
  assert.equal(canViewCase(DEMO_USERS[0], record), true);
  assert.equal(canUpdateCase(DEMO_USERS[1], record), true);
  assert.equal(canViewCase(DEMO_USERS[0], { ...record, createdById: 'owner', assignedTo: [] }), false);
  assert.equal(canViewCase(DEMO_USERS[2], record), true);
  assert.equal(canUpdateCase({ ...DEMO_USERS[0], active: false }, record), false);
});
test('simulated scenarios are labeled and failed submissions can retry', () => {
  const entries = starterLibrary();
  assert.equal(simulateScreening('Rice', 'supported', 'rice-blast', entries).guidance?.id, 'rice-blast');
  assert.equal(simulateScreening('Rice', 'supported', 'rice-blight', entries).guidance?.id, 'rice-blight');
  assert.equal(simulateScreening('Rice', 'unclear', '', entries).state, 'UNCLEAR_IMAGE');
  assert.throws(() => simulateScreening('Rice', 'service-error', 'rice-blast', entries), /retained/i);
  assert.equal(simulateScreening('Rice', 'supported', 'rice-blast', entries).demo, true);
  assert.equal(simulateScreening('Okra', 'supported', 'rice-blast', entries).state, 'COVERAGE_LIMITED');
});
test('disabled or crop-mismatched guidance is never attached; saved guidance stays a snapshot', () => {
  const entries = starterLibrary();
  assert.equal(simulateScreening('Corn', 'supported', 'rice-blast', entries).guidance, undefined);
  const result = simulateScreening('Rice', 'supported', 'rice-blast', entries);
  entries[0].care = 'Edited later';
  assert.notEqual(result.guidance?.care, entries[0].care);
  entries[0].enabled = false;
  assert.equal(simulateScreening('Rice', 'supported', 'rice-blast', entries).guidance, undefined);
});
test('new enabled library entries need reviewed content, version, date, and a valid source', () => {
  const entry = { ...starterLibrary()[0], id: 'new', reviewStatus: 'Pending review' as const, enabled: true };
  assert.throws(() => validateLibraryEntry(entry), /review/i);
  assert.throws(() => validateLibraryEntry({ ...entry, enabled: false, sourceUrl: 'javascript:bad' }), /source/i);
  assert.doesNotThrow(() => validateLibraryEntry({ ...entry, enabled: false }));
});
