import {formatDate, today, type CropCase, type ObservedChange} from './monitoring';

export function followUpReminder(item: Pick<CropCase, 'status' | 'nextFollowUp'>, date = today()) {
  if (item.status === 'Closed') return {kind: 'closed', label: 'Case closed', detail: 'No follow-up needed'};
  if (!item.nextFollowUp) return {kind: 'unscheduled', label: 'No follow-up scheduled', detail: 'Choose a date in the case plan'};
  const detail = `Next follow-up: ${formatDate(item.nextFollowUp)}`;
  if (item.nextFollowUp < date) return {kind: 'overdue', label: 'Overdue', detail};
  if (item.nextFollowUp === date) return {kind: 'today', label: 'Due today', detail};
  return {kind: 'upcoming', label: 'Upcoming', detail};
}

export function changeLabel(change: ObservedChange) {
  return change === 'Improving' ? 'Improved' : change === 'Worsening' ? 'Worsened' : change === 'No change' ? 'Unchanged' : change;
}

export interface ScreeningInput {
  crop: string; symptoms: string; photo: string; mode?: string; scenario?: string; demoKind?: string;
}
export function screeningInputKey(input: ScreeningInput) {
  const demo = input.mode === 'demo';
  return JSON.stringify([input.crop, input.symptoms.trim(), input.photo, demo ? 'demo' : 'live', demo ? input.scenario || 'supported' : '', demo ? input.demoKind || 'Disease' : '']);
}
