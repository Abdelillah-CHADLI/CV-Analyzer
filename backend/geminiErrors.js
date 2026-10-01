function classifyGeminiError(status, payload) {
  const upstream = payload && typeof payload === "object" ? payload.error || {} : {};
  const reason = Array.isArray(upstream.details)
    ? upstream.details.find((detail) => detail?.reason)?.reason
    : undefined;

  let code = "GEMINI_UNAVAILABLE";
  let message = "The analysis service is temporarily unavailable. Please try again.";
  let httpStatus = 502;

  if (reason === "API_KEY_INVALID" || status === 401) {
    code = "GEMINI_KEY_INVALID";
    message = "The analysis API key is invalid. The site owner needs to update GEMINI_API_KEY on Render.";
    httpStatus = 503;
  } else if (status === 402) {
    code = "GEMINI_BILLING";
    message = "The analysis service has no available credits. The site owner needs to check Gemini billing.";
    httpStatus = 503;
  } else if (status === 403) {
    code = "GEMINI_PERMISSION";
    message = "The analysis API key does not have access to Gemini. The site owner needs to check its permissions.";
    httpStatus = 503;
  } else if (status === 404) {
    code = "GEMINI_MODEL_NOT_FOUND";
    message = "The configured Gemini model is unavailable. The site owner needs to check the model name.";
    httpStatus = 503;
  } else if (status === 429) {
    code = "GEMINI_LIMIT";
    message = "The Gemini request limit or quota has been reached. Please try again later.";
    httpStatus = 429;
  } else if (status === 400) {
    code = "GEMINI_REQUEST_INVALID";
    message = "Gemini rejected the analysis request. The site owner needs to check the API configuration.";
  }

  const error = new Error(message);
  error.code = code;
  error.httpStatus = httpStatus;
  error.upstreamStatus = status;
  error.upstreamReason = reason || upstream.status || "UNKNOWN";
  return error;
}

module.exports = { classifyGeminiError };
