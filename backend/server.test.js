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
    assert.match(request.url, /\/v1beta\/models\/gemini-3\.8-flash:generateContent$/);
    assert.equal(request.options.headers["x-goog-api-key"], "test-key");
    const body = JSON.parse(request.options.body);
    assert.equal(body.generationConfig.responseFormat.text.mimeType, "application/json");
    assert.equal(body.generationConfig.responseFormat.text.schema.type, "object");
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
