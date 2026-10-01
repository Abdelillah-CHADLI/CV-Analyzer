const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeCVText } = require("./server");

test("uses the current free-tier model and JSON response format", async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key";
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        overview: { summary: "Clear CV", scores: { overall: 80 } },
        priorities: [],
        actionPlan: { first: [], next: [], later: [] },
      }) }] } }] }),
    };
  };

  try {
    await analyzeCVText("A sample CV with enough text to test the analysis request.", "Designer", "");
    assert.match(request.url, /\/v1beta\/models\/gemini-3\.5-flash:generateContent$/);
    assert.equal(request.options.headers["x-goog-api-key"], "test-key");
    const body = JSON.parse(request.options.body);
    assert.equal(body.generationConfig.responseFormat.text.mimeType, "APPLICATION_JSON");
    assert.equal(body.generationConfig.responseFormat.text.schema.type, "object");
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});

test("uses the free-tier fallback when the primary model is overloaded", async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key";
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    if (urls.length === 1) {
      return {
        ok: false,
        status: 503,
        text: async () => JSON.stringify({ error: { status: "UNAVAILABLE", message: "High demand" } }),
      };
    }
    return {
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        overview: { summary: "Clear CV", scores: { overall: 80 } },
        priorities: [],
        actionPlan: { first: [], next: [], later: [] },
      }) }] } }] }),
    };
  };
  try {
    const report = await analyzeCVText("Synthetic CV text for testing.", "", "");
    assert.equal(report.overview.summary, "Clear CV");
    assert.match(urls[0], /gemini-3\.5-flash:generateContent$/);
    assert.match(urls[1], /gemini-3\.5-flash-lite:generateContent$/);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});

test("redacts the API key from Gemini request diagnostics", async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "private-test-key";
  global.fetch = async () => ({
    ok: false,
    status: 400,
    text: async () => JSON.stringify({ error: { message: "Invalid request using private-test-key" } }),
  });
  try {
    await assert.rejects(
      analyzeCVText("Synthetic CV text for testing.", "", ""),
      (error) => error.code === "GEMINI_REQUEST_INVALID" &&
        error.diagnostic.includes("[redacted]") &&
        !error.diagnostic.includes("private-test-key")
    );
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
