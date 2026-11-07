import { type CropType } from './crops';

export const CROP_LABELS: Record<CropType, string> = {
  Corn: 'Mais', Calamansi: 'Kalamansi', Okra: 'Okra', Eggplant: 'Talong',
  Chili: 'Sili', 'Sweet Potato': 'Kamote', Pomelo: 'Suha', Rice: 'Rice',
};
export const CROP_COLORS: Record<CropType, string> = {
  Corn: 'gold', Calamansi: 'lime', Okra: 'green', Eggplant: 'violet', Chili: 'red', 'Sweet Potato': 'earth', Pomelo: 'lime', Rice: 'green',
};
export interface Guidance {
  id: string; crop: CropType; name: string; cues: string; care: string; prevention: string;
  source: string; sourceUrl: string; version: string; kind?: 'Disease' | 'Pest'; limitations?: string;
}
const riceSource = 'https://www.philrice.gov.ph/wp-content/uploads/2023/02/Major-diseases-of-the-rice-plant-in-the-Philippines.pdf';
export const CONDITION_REGISTER: Guidance[] = [
  { id: 'rice-blast', crop: 'Rice', name: 'Rice leaf blast', cues: 'Spindle-shaped spots with brown margins and gray centers.', care: 'Review water and fertilizer management. Avoid dense growth.', prevention: 'Choose resistant varieties and manage infected residue after harvest.', source: 'Philippine Rice Research Institute', sourceUrl: riceSource, version: 'pilot-v3.1' },
  { id: 'rice-blight', crop: 'Rice', name: 'Rice bacterial leaf blight', cues: 'Water-soaked stripes along leaf margins that enlarge and yellow.', care: 'Reduce plant injury. Review fertilization and water management, and control weeds.', prevention: 'Use healthy seed and resistant varieties.', source: 'Philippine Rice Research Institute', sourceUrl: riceSource, version: 'pilot-v3.1' },
  { id: 'corn-rust', crop: 'Corn', name: 'Corn common rust', cues: 'Golden to cinnamon-brown pustules on both leaf surfaces, darkening with age.', care: 'Record dated changes and photographs for continued observation.', prevention: 'Consider resistant or tolerant varieties for subsequent planting.', source: 'Pacific Northwest Pest Management Handbooks · March 2026', sourceUrl: 'https://pnwhandbooks.org/plantdisease/host-disease/corn-zea-mays-common-rust', version: 'pilot-v3.1' },
];
export type ScreeningState = 'MATCHED' | 'UNCERTAIN' | 'VISUALLY_NORMAL' | 'UNCLEAR_IMAGE' | 'CROP_MISMATCH' | 'NOT_PLANT' | 'COVERAGE_LIMITED' | 'NOT_SCREENED';
export const STATE_LABELS: Record<ScreeningState, string> = {
  MATCHED: 'Preliminary finding', UNCERTAIN: 'Unable to determine', VISUALLY_NORMAL: 'Visually normal observation',
  UNCLEAR_IMAGE: 'Clearer photo needed', CROP_MISMATCH: 'Crop does not match', NOT_PLANT: 'Plant photo needed',
  COVERAGE_LIMITED: 'Monitoring only', NOT_SCREENED: 'Observation recorded',
};
export interface Screening { state: ScreeningState; observations: string[]; guidance?: Guidance; model?: string; promptVersion?: string; demo?: boolean }
export function resolveScreening(crop: CropType, raw: unknown): Screening {
  if (crop !== 'Rice' && crop !== 'Corn') return { state: 'COVERAGE_LIMITED', observations: [] };
  if (!raw || typeof raw !== 'object') throw new Error('Invalid screening response');
  const value = raw as Record<string, unknown>;
  if (typeof value.state !== 'string' || !Object.hasOwn(STATE_LABELS, value.state)) throw new Error('Invalid screening state');
  const observations = Array.isArray(value.observations) ? value.observations.filter((x): x is string => typeof x === 'string').slice(0, 8).map(x => x.slice(0, 400)) : [];
  const state = value.state as ScreeningState;
  if (state !== 'MATCHED') return { state, observations };
  const guidance = CONDITION_REGISTER.find(x => x.id === value.conditionId && x.crop === crop);
  return guidance ? { state, observations, guidance: { ...guidance } } : { state: 'UNCERTAIN', observations };
}
export type CaseStatus = 'Open' | 'Monitoring' | 'Closed';
export type ObservedChange = 'Not yet assessed' | 'Improved' | 'Unchanged' | 'Worsened' | 'Uncertain' | 'Improving' | 'Worsening' | 'No change';
export interface Observation {
  id: string; date: string; symptoms: string; actions: string; change: ObservedChange; photo?: string; recordedBy?: string;
}
export interface CropCase {
  id: string; crop: CropType; area: string; sampleLabel: string; plantAge: string; recordedBy: string;
  status: CaseStatus; nextFollowUp: string; createdAt: string; screening: Screening; observations: Observation[];
  statusHistory: { status: CaseStatus; date: string; reason: string }[]; sample?: boolean;
  createdById?: string; assignedTo?: string[]; walkthrough?: boolean; revision?: number; screeningId?: string;
}
export function orderedObservations<T extends { date: string }>(observations: T[]): T[] {
  return [...observations].sort((a, b) => a.date.localeCompare(b.date));
}
export function updateStatus(c: CropCase, status: CaseStatus, reason = ''): CropCase {
  if (status === 'Closed' && !reason.trim()) throw new Error('Please give a reason for closing this case.');
  return { ...c, status, statusHistory: [...(c.statusHistory || []), { status, date: new Date().toISOString(), reason: reason.trim() }] };
}
export function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function formatDate(value: string, short = false): string {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', ...(short ? {} : { year: 'numeric' }), timeZone: 'Asia/Manila' }).format(new Date(value.length === 10 ? value + 'T12:00:00+08:00' : value));
}
export function sampleCases(): CropCase[] {
  const day = (offset: number) => { const d = new Date(today() + 'T12:00:00+08:00'); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
  const make = (id: string, crop: CropType, area: string, status: CaseStatus, offset: number, symptoms: string, condition?: string): CropCase => ({
    id, crop, area, sampleLabel: 'Plant 01', plantAge: '', recordedBy: 'Demo owner', status, nextFollowUp: status === 'Closed' ? '' : day(offset), createdAt: day(-5), sample: true,
    screening: condition ? resolveScreening(crop, { state: 'MATCHED', conditionId: condition, observations: [symptoms] }) : resolveScreening(crop, { state: 'VISUALLY_NORMAL', observations: [symptoms] }),
    observations: [{ id: id + '-initial', date: day(-5), symptoms, actions: 'Initial observation recorded.', change: 'Not yet assessed' }], statusHistory: [],
  });
  const rice = make('CS-DEMO-001', 'Rice', 'Rice field · Plot A', 'Monitoring', 0, 'Spindle-shaped brown spots on several lower leaves.', 'rice-blast');
  rice.observations.push({ id: 'rice-followup', date: day(-2), symptoms: 'Spots still visible. No new affected leaves observed.', actions: 'Reviewed water management and recorded the affected plants.', change: 'No change' });
  const corn = make('CS-DEMO-002', 'Corn', 'Vegetable area · Row 02', 'Open', -1, 'Small cinnamon-brown pustules on leaf surfaces.', 'corn-rust');
  const okra = make('CS-DEMO-003', 'Okra', 'Vegetable area · Row 04', 'Monitoring', 2, 'Yellowing on two lower leaves.');
  const chili = make('CS-DEMO-004', 'Chili', 'Vegetable area · Row 06', 'Closed', 0, 'Leaf curling observed.');
  chili.statusHistory.push({ status: 'Closed', date: day(-1), reason: 'Practice observation period completed; this does not establish recovery.' });
  const eggplant = make('CS-DEMO-005', 'Eggplant', 'Vegetable area · Row 03', 'Monitoring', 1, 'Pale patches on lower leaves.');
  eggplant.observations.push({ id: 'eggplant-followup', date: day(-1), symptoms: 'No additional pale patches observed.', actions: 'Photograph planned for the next field check.', change: 'Improving' });
  return [rice, corn, okra, eggplant, chili];
}
