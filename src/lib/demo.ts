import { CONDITION_REGISTER, today, type CropCase, type Guidance, type Screening } from './monitoring';
import { isSupportedCrop, type CropType } from './crops';

export type DemoRole = 'Worker' | 'Owner' | 'Administrator';
export interface DemoUser { id: string; name: string; role: DemoRole; active: boolean; isDemo?: boolean; assignable?: boolean; email?: string }
export const DEMO_USERS: DemoUser[] = [
  { id: 'worker-1', name: 'Demo worker 1', role: 'Worker', active: true },
  { id: 'worker-2', name: 'Demo worker 2', role: 'Worker', active: true },
  { id: 'owner', name: 'Demo farm owner', role: 'Owner', active: true },
  { id: 'admin', name: 'Demo administrator', role: 'Administrator', active: true },
];
export function canViewCase(user: DemoUser, item: CropCase): boolean {
  return user.active && (user.role !== 'Worker' || item.createdById === user.id || !!item.assignedTo?.includes(user.id));
}
export function canUpdateCase(user: DemoUser, item: CropCase): boolean {
  return user.role !== 'Administrator' && canViewCase(user, item);
}
export type ReviewStatus = 'Pilot reference' | 'Pending review' | 'Reviewed' | 'Needs revision' | 'Source checked';
export interface LibraryEntry extends Guidance { reviewStatus: ReviewStatus; reviewedAt: string; enabled: boolean }
export function starterLibrary(): LibraryEntry[] {
  return CONDITION_REGISTER.map(x => ({ ...x, enabled: true, reviewStatus: 'Pilot reference', reviewedAt: '' }));
}
export function validateLibraryEntry(entry: LibraryEntry): void {
  if (!isSupportedCrop(entry.crop)) throw new Error('Select one of the eight supported crops.');
  if (![entry.name, entry.cues, entry.care, entry.prevention, entry.source, entry.version].every(x => x.trim())) throw new Error('Complete the condition, symptoms, guidance, source, and version fields. Do not fill gaps with generated advice.');
  let source: URL;
  try { source = new URL(entry.sourceUrl); } catch { throw new Error('Provide a complete source link beginning with https:// or http://.'); }
  if (!['https:', 'http:'].includes(source.protocol)) throw new Error('The source link must use https:// or http://.');
  const starter = CONDITION_REGISTER.some(x => x.id === entry.id && x.crop === entry.crop);
  if (entry.reviewStatus === 'Pilot reference' && !starter) throw new Error('Only the three supplied starter entries may use Pilot reference status.');
  if (['Reviewed', 'Source checked'].includes(entry.reviewStatus) && (!entry.reviewedAt || entry.reviewedAt > today())) throw new Error('A reviewed entry requires a review date on or before today.');
  if (entry.enabled && entry.reviewStatus !== 'Reviewed' && entry.reviewStatus !== 'Source checked' && !(starter && entry.reviewStatus === 'Pilot reference')) throw new Error('Complete the content review before enabling this entry.');
}
export type DemoScenario = 'supported' | 'unclear' | 'service-error';
export function simulateScreening(crop: CropType, scenario: DemoScenario, conditionId: string, library: LibraryEntry[]): Screening {
  if (scenario === 'service-error') throw new Error('Demo temporary service error. Your photo and entered details are retained. Retry the same submission to continue.');
  if (crop !== 'Rice' && crop !== 'Corn') return { state: 'COVERAGE_LIMITED', demo: true, observations: [] };
  if (scenario === 'unclear') return { state: 'UNCLEAR_IMAGE', demo: true, observations: ['Demo result: the leaf detail is unclear. Take a closer photo in natural light, keep the leaf in focus, and avoid heavy shadows. No condition-specific guidance is attached.'] };
  const starter = CONDITION_REGISTER.some(x => x.id === conditionId && x.crop === crop);
  const g = starter ? library.find(x => x.id === conditionId && x.crop === crop && x.enabled && (x.reviewStatus === 'Reviewed' || x.reviewStatus === 'Pilot reference')) : undefined;
  return g ? { state: 'MATCHED', demo: true, observations: ['Simulated finding for demonstrating the workflow. The photograph is not analyzed and this result is not a diagnosis.'], guidance: { ...g } } : { state: 'UNCERTAIN', demo: true, observations: ['No enabled starter condition matches this crop and scenario. Save the observation for monitoring.'] };
}
export function daysAgo(days: number): string {
  const date = new Date(today() + 'T12:00:00+08:00'); date.setUTCDate(date.getUTCDate() - days); return date.toISOString().slice(0, 10);
}
export function normalizeDemoCase(item: CropCase): CropCase {
  const firstWorker = ['CS-DEMO-001', 'CS-DEMO-003'].includes(item.id);
  const secondWorker = ['CS-DEMO-002', 'CS-DEMO-005'].includes(item.id);
  const createdById = item.createdById || (firstWorker ? 'worker-1' : secondWorker ? 'worker-2' : 'owner');
  const observations = item.observations.map((o, i) => item.id === 'CS-DEMO-001' && !o.photo ? { ...o, photo: i === 0 ? '/images/demo-rice-first.svg' : '/images/demo-rice-later.svg' } : o);
  return { ...item, createdById, assignedTo: item.assignedTo || [], recordedBy: item.createdById ? item.recordedBy : DEMO_USERS.find(x => x.id === createdById)!.name, screening: { ...item.screening, demo: item.screening.demo ?? !!item.sample }, observations };
}
