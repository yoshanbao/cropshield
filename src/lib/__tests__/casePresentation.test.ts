import test from 'node:test';
import assert from 'node:assert/strict';
import {followUpReminder, screeningInputKey, changeLabel} from '../casePresentation';

test('follow-up reminders distinguish closed, missing, overdue, today, and upcoming dates', () => {
  const date = '2026-11-07';
  assert.equal(followUpReminder({status:'Open',nextFollowUp:''},date).kind,'unscheduled');
  assert.equal(followUpReminder({status:'Monitoring',nextFollowUp:'2026-11-06'},date).kind,'overdue');
  assert.equal(followUpReminder({status:'Monitoring',nextFollowUp:date},date).kind,'today');
  assert.equal(followUpReminder({status:'Open',nextFollowUp:'2026-11-08'},date).kind,'upcoming');
  assert.equal(followUpReminder({status:'Closed',nextFollowUp:'2026-11-06'},date).kind,'closed');
});
test('restored results stay tied to the photo, crop, symptoms, mode, and demo scenario', () => {
  const input={crop:'Rice',symptoms:'Spots',photo:'/api/images/one',mode:'live'};
  const key=screeningInputKey(input);
  for(const changed of [{crop:'Corn'},{symptoms:'Curling'},{photo:'/api/images/two'},{mode:'demo'}])assert.notEqual(screeningInputKey({...input,...changed}),key);
  assert.equal(screeningInputKey({...input,scenario:'unclear',demoKind:'Pest'}),key);
  const demo={...input,mode:'demo',scenario:'supported',demoKind:'Disease'};
  assert.notEqual(screeningInputKey(demo),screeningInputKey({...demo,demoKind:'Pest'}));
  assert.notEqual(screeningInputKey(demo),screeningInputKey({...demo,scenario:'unclear'}));
  assert.equal(screeningInputKey({...input,symptoms:' Spots '}),key);
});
test('legacy reported changes use the same plain labels as new observations',()=>{
  assert.equal(changeLabel('No change'),'Unchanged');assert.equal(changeLabel('Improving'),'Improved');assert.equal(changeLabel('Worsening'),'Worsened');
});
