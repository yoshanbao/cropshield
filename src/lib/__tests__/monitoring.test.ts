import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CROP_TYPES } from '../crops';
import { resolveScreening, updateStatus, orderedObservations, type CropCase } from '../monitoring';

test('pilot has exactly the eight document crops', () => {
  assert.deepEqual([...CROP_TYPES].sort(), ['Corn', 'Calamansi', 'Okra', 'Eggplant', 'Chili', 'Sweet Potato', 'Pomelo', 'Rice'].sort());
});
test('condition register never maps a condition to a different crop', () => {
  assert.equal(resolveScreening('Corn', { state: 'MATCHED', conditionId: 'rice-blast', observations: ['spots'] }).state, 'UNCERTAIN');
  assert.equal(resolveScreening('Rice', { state: 'MATCHED', conditionId: 'rice-blast', observations: ['spots'] }).guidance?.id, 'rice-blast');
  assert.equal(resolveScreening('Okra', { state: 'MATCHED', conditionId: 'rice-blast' }).state, 'COVERAGE_LIMITED');
});
test('unknown and normal observations receive no invented disease guidance', () => {
  for (const state of ['UNCERTAIN', 'VISUALLY_NORMAL', 'UNCLEAR_IMAGE']) {
    assert.equal(resolveScreening('Rice', { state, conditionId: 'rice-blast' }).guidance, undefined);
  }
  assert.equal(resolveScreening('Rice', { state: 'MATCHED', conditionId: 'invented' }).state, 'UNCERTAIN');
});
test('closing needs a reason, reopening preserves earlier evidence', () => {
  const c = { id: 'test', status: 'Open', observations: [{ id: 'o', date: '2026-11-01' }] } as CropCase;
  assert.throws(() => updateStatus(c, 'Closed', ''), /reason/i);
  const closed = updateStatus(c, 'Closed', 'End of observation period');
  const reopened = updateStatus(closed, 'Monitoring');
  assert.equal(reopened.statusHistory.length, 2);
  assert.deepEqual(reopened.observations, c.observations);
  assert.equal(reopened.statusHistory[0].reason, 'End of observation period');
});
test('backdated observations sort by observation date without mutating evidence', () => {
  const list = [{ id: 'a', date: '2026-11-06' }, { id: 'b', date: '2026-11-01' }, { id: 'c', date: '2026-11-04' }];
  assert.deepEqual(orderedObservations(list).map(x => x.id), ['b', 'c', 'a']);
  assert.equal(list[0].id, 'a');
});
