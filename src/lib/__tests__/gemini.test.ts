/**
 * Unit tests for the Gemini screening retry/classification logic.
 *
 * These use an INJECTED fake client (the `createClient` seam on
 * screenCropImage) and NEVER make a live Gemini call. Run with:
 *   npx tsx --test src/lib/__tests__/gemini.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  screenCropImage,
  GeminiTransientError,
  GeminiQuotaExhaustedError,
  GeminiInvalidOutputError,
  type GenerateContentClient,
} from "../gemini";

// ---- Fixtures ----------------------------------------------------------

// A valid model JSON payload that passes runtime validation.
const VALID_JSON = JSON.stringify({
  isPlantImage: true,
  cropAssessment: "consistent",
  possibleCondition: "Early Blight",
  confidence: 0.82,
  visualObservations: ["dark concentric rings on lower leaves"],
  imageQualityIssues: [],
  urgencyLevel: "MEDIUM",
  needsExpertReview: false,
  limitations: ["preliminary screening only"],
});

/** Mimics the SDK's ApiError: an Error with numeric `status` + JSON message. */
class FakeApiError extends Error {
  status: number;
  constructor(status: number, body: unknown) {
    super(JSON.stringify(body));
    this.name = "ApiError";
    this.status = status;
  }
}

const dailyQuotaBody = {
  error: {
    code: 429,
    status: "RESOURCE_EXHAUSTED",
    message:
      "You exceeded your current quota. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20",
    details: [
      {
        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
        violations: [
          {
            quotaMetric:
              "generativelanguage.googleapis.com/generate_content_free_tier_requests",
            quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
            quotaDimensions: { model: "gemini-3.5-flash", location: "global" },
          },
        ],
      },
      {
        "@type": "type.googleapis.com/google.rpc.RetryInfo",
        retryDelay: "55s",
      },
    ],
  },
};

const perMinuteRateBody = {
  error: {
    code: 429,
    status: "RESOURCE_EXHAUSTED",
    message:
      "Quota exceeded for quota metric 'Generate requests per minute' limit 'GenerateRequestsPerMinutePerProject'",
    details: [
      {
        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
        violations: [
          {
            quotaMetric: "generativelanguage.googleapis.com/generate_requests",
            quotaId: "GenerateRequestsPerMinutePerProject",
          },
        ],
      },
      { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "1s" },
    ],
  },
};

const overloadBody = {
  error: {
    code: 503,
    status: "UNAVAILABLE",
    message: "This model is currently experiencing high demand.",
  },
};

const authBody = {
  error: {
    code: 401,
    status: "UNAUTHENTICATED",
    message: "API key not valid. Please pass a valid API key.",
  },
};

/** Build a client whose generateContent runs the given per-call handler. */
function clientThatDoes(
  handler: (model: string, callIndex: number) => Promise<{ text?: string }>,
): { client: GenerateContentClient; calls: () => string[] } {
  const seen: string[] = [];
  const client: GenerateContentClient = {
    models: {
      generateContent: async (req: { model: string }) => {
        const idx = seen.length;
        seen.push(req.model);
        return handler(req.model, idx);
      },
    },
  };
  return { client, calls: () => seen };
}

const baseParams = {
  apiKey: "test-key-not-real",
  cropType: "Tomato",
  symptoms: "spots",
  base64Image: "AAAA",
  mimeType: "image/jpeg" as const,
};

// ---- Tests -------------------------------------------------------------

test("daily quota exhaustion -> GeminiQuotaExhaustedError, no retry on model", async () => {
  const { client, calls } = clientThatDoes(async () => {
    throw new FakeApiError(429, dailyQuotaBody);
  });
  await assert.rejects(
    () => screenCropImage(baseParams, () => client),
    (err) => err instanceof GeminiQuotaExhaustedError,
  );
  // 3 models, but each is tried ONCE (no retry on daily quota).
  assert.equal(calls().length, 3, "each model tried exactly once");
});

test("daily quota message never leaks raw provider details", async () => {
  const { client } = clientThatDoes(async () => {
    throw new FakeApiError(429, dailyQuotaBody);
  });
  try {
    await screenCropImage(baseParams, () => client);
    assert.fail("should have thrown");
  } catch (err) {
    const msg = (err as Error).message;
    assert.ok(!msg.includes("quotaMetric"), "no raw quota metric in message");
    assert.ok(!msg.includes("generativelanguage"), "no provider host in message");
  }
});

test("temporary per-minute 429 is retried then falls through -> transient", async () => {
  const { client, calls } = clientThatDoes(async () => {
    throw new FakeApiError(429, perMinuteRateBody);
  });
  await assert.rejects(
    () => screenCropImage(baseParams, () => client),
    (err) => err instanceof GeminiTransientError,
  );
  // 3 models x 2 attempts each = 6 calls (retryable rate limit).
  assert.equal(calls().length, 6, "each model retried once");
});

test("per-minute 429 that clears on retry -> success", async () => {
  let n = 0;
  const { client } = clientThatDoes(async () => {
    n += 1;
    if (n === 1) throw new FakeApiError(429, perMinuteRateBody);
    return { text: VALID_JSON };
  });
  const out = await screenCropImage(baseParams, () => client);
  assert.equal(out.result.possibleCondition, "Early Blight");
  assert.equal(out.model, "gemini-3.5-flash");
});

test("503 overload retried across models -> transient", async () => {
  const { client, calls } = clientThatDoes(async () => {
    throw new FakeApiError(503, overloadBody);
  });
  await assert.rejects(
    () => screenCropImage(baseParams, () => client),
    (err) => err instanceof GeminiTransientError,
  );
  assert.equal(calls().length, 6, "3 models x 2 attempts on overload");
});

test("authentication error is NOT retried, moves to next model -> transient", async () => {
  const { client, calls } = clientThatDoes(async () => {
    throw new FakeApiError(401, authBody);
  });
  await assert.rejects(
    () => screenCropImage(baseParams, () => client),
    (err) => err instanceof GeminiTransientError,
  );
  // No retries on auth: each of 3 models tried exactly once.
  assert.equal(calls().length, 3, "auth error tried each model once, no retry");
});

test("deadline exhaustion: slow timeouts stop within the overall budget", async () => {
  // Every call hangs until aborted (simulates our per-call timeout firing).
  const { client } = clientThatDoes(() => {
    return new Promise<{ text?: string }>((_resolve, reject) => {
      // Reject quickly with a timeout-shaped error so we exercise the
      // TIMEOUT classification + backoff path without waiting 20s per call.
      setTimeout(() => {
        const e = new Error("The operation was aborted due to timeout");
        e.name = "AbortError";
        reject(e);
      }, 5);
    });
  });
  const started = Date.now();
  await assert.rejects(
    () => screenCropImage(baseParams, () => client),
    (err) => err instanceof GeminiTransientError,
  );
  const elapsed = Date.now() - started;
  // Must complete FAR under the 35s overall deadline (fast timeouts + capped
  // backoff), proving the loop is bounded and predictable.
  assert.ok(elapsed < 15_000, `elapsed ${elapsed}ms should be well under deadline`);
});

test("invalid model output -> GeminiInvalidOutputError, no retry", async () => {
  const { client, calls } = clientThatDoes(async () => {
    return { text: "this is not json" };
  });
  await assert.rejects(
    () => screenCropImage(baseParams, () => client),
    (err) => err instanceof GeminiInvalidOutputError,
  );
  assert.equal(calls().length, 1, "malformed output fails immediately");
});
