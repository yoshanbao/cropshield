import { test } from 'node:test';
import assert from 'node:assert/strict';
import { screenPilot, PilotServiceError, type PilotClient } from '../pilotGemini';
const image = Buffer.from('test image');
function fake(run: (attempt: number) => Promise<{ text?: string }>) {
  let calls = 0;
  const client: PilotClient = { models: { generateContent: () => run(++calls) } };
  return { client, sleep: async () => {}, calls: () => calls };
}
function serviceError(status: number, message = 'Unavailable') { return Object.assign(new Error(message), { status }); }

test('V3 service uses a single retry controller with at most three total attempts', async () => {
  const d = fake(async () => { throw serviceError(503); });
  await assert.rejects(() => screenPilot('Rice', 'spots', image, 'image/jpeg', d), (e: unknown) => e instanceof PilotServiceError && e.status === 503);
  assert.equal(d.calls(), 3);
});
test('hard daily quota and permission errors stop without automatic retry', async () => {
  for (const [status, message] of [[429, 'GenerateRequestsPerDay quota exceeded'], [403, 'Permission denied']] as const) {
    const d = fake(async () => { throw serviceError(status, message); });
    await assert.rejects(() => screenPilot('Rice', 'spots', image, 'image/jpeg', d), PilotServiceError);
    assert.equal(d.calls(), 1);
  }
});
test('a successful transient retry returns only crop-matched versioned guidance', async () => {
  const d = fake(async attempt => { if (attempt === 1) throw serviceError(503); return { text: JSON.stringify({ state: 'MATCHED', conditionId: 'rice-blast', observations: ['Spindle-shaped spots.'] }) }; });
  const result = await screenPilot('Rice', 'spots', image, 'image/jpeg', d);
  assert.equal(d.calls(), 2); assert.equal(result.guidance?.id, 'rice-blast'); assert.equal(result.guidance?.version, 'pilot-v3.1'); assert.ok(result.model); assert.ok(result.promptVersion);
});
test('malformed output fails without retry or invented guidance', async () => {
  const d = fake(async () => ({ text: 'not valid json' }));
  await assert.rejects(() => screenPilot('Rice', 'spots', image, 'image/jpeg', d), PilotServiceError);
  assert.equal(d.calls(), 1);
});
test('the SDK receives retries disabled and a bounded timeout', async () => {
  let captured: Record<string, unknown> = {};
  const client: PilotClient = { models: { generateContent: async request => { captured = request; return { text: JSON.stringify({ state: 'UNCERTAIN', observations: [] }) }; } } };
  await screenPilot('Rice', 'spots', image, 'image/jpeg', { client });
  const config = captured.config as { httpOptions: { timeout: number; retryOptions: { attempts: number } } };
  assert.equal(config.httpOptions.retryOptions.attempts, 1);
  assert.equal(config.httpOptions.timeout, 18000);
});

test('a provider that never settles cannot keep a screening request open', async () => {
  const client: PilotClient = { models: { generateContent: () => new Promise(() => {}) } };
  const started = Date.now();
  await assert.rejects(() => screenPilot('Rice', 'spots', image, 'image/jpeg', { client, sleep: async () => {}, requestTimeoutMs: 8, overallDeadlineMs: 40 }), PilotServiceError);
  assert.ok(Date.now() - started < 250);
});
