const test = require("node:test");
const assert = require("node:assert/strict");
const { classifyGeminiError } = require("./geminiErrors");

test("identifies an invalid API key even when Gemini returns HTTP 400", () => {
  const error = classifyGeminiError(400, {
    error: { status: "INVALID_ARGUMENT", details: [{ reason: "API_KEY_INVALID" }] },
  });
  assert.equal(error.code, "GEMINI_KEY_INVALID");
  assert.equal(error.httpStatus, 503);
  assert.match(error.message, /GEMINI_API_KEY/);
});

test("distinguishes quota exhaustion from a malformed request", () => {
  const limit = classifyGeminiError(429, { error: { status: "RESOURCE_EXHAUSTED" } });
  const invalid = classifyGeminiError(400, { error: { status: "INVALID_ARGUMENT" } });
  assert.equal(limit.code, "GEMINI_LIMIT");
  assert.equal(limit.httpStatus, 429);
  assert.equal(invalid.code, "GEMINI_REQUEST_INVALID");
  assert.equal(invalid.httpStatus, 502);
});
