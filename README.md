# CV Analyzer

CV Analyzer is a React and Express application that extracts text from a CV and asks Google Gemini for feedback on its content, presentation, and ATS readiness.

## Features

- Upload a PDF, PNG, or JPG file up to 10 MB by browsing or dragging it into the page.
- Extract text from PDFs with `pdf-parse` and from images with Tesseract OCR (English, Arabic, and French).
- Add a target role or job description for more relevant feedback.
- See a concise dashboard with scores, strengths, and ranked improvements; open detailed section reviews, wording examples, and ATS notes when needed.
- Work through an interactive action checklist, copy the summary, or download the report as a text file.
- Review the extracted text to catch scanning or parsing mistakes.

## Requirements

- Node.js 18 or newer and npm 9 or newer
- A Google Gemini API key

The backend defaults to `gemini-3.8-flash`, which Google lists on the [Gemini API free tier](https://ai.google.dev/gemini-api/docs/pricing) for standard requests. Free usage is subject to your project's rate limits. You can set `GEMINI_MODEL` on the backend if you need to change models later.

## Run locally

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Abdelillah-CHADLI/CV-Analyzer.git
   cd CV-Analyzer
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Create `backend/.env` with your API key:

   ```dotenv
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3001
   ```

3. Start the backend from `backend/`:

   ```bash
   npm start
   ```

4. In a second terminal, start the frontend from `frontend/`:

   ```bash
   npm start
   ```

Open <http://localhost:3000>. The frontend uses <http://localhost:3001> for the API by default. To use another backend URL, set `REACT_APP_API_URL` in the frontend environment before starting or building it.

## API

`POST /api/upload` accepts one multipart form field named `cv`, plus optional `targetRole` and `jobDescription` text fields. Supported MIME types are PDF, PNG, and JPEG; the maximum file size is 10 MB. The response includes `data.extractedText` and a structured `data.report` with scores, priorities, strengths, section reviews, wording examples, ATS notes, and an action plan. Files with less than 50 characters of extracted text are rejected.

`GET /` identifies the API and lists its routes. `GET /api/health` returns the backend status and an `analysisConfigured` flag, which tells you whether `GEMINI_API_KEY` is set without revealing its value.

## Project layout

- `backend/` — Express API, file validation, text extraction, and Gemini request.
- `frontend/` — React upload and results interface. Run `npm run build` here to create a production build.

## Notes

Analysis requires a working Gemini API key and network access. The CV text and any job description are sent to the analysis service. The first request to a hosted backend may take longer if that service has been idle. Review the extracted text before relying on the recommendations, especially for image scans and complex PDF layouts. Checklist progress is kept only in the current page session.

## Deployment checks

- Set `GEMINI_API_KEY` in the backend host's environment. On Render, redeploy after changing it.
- Set `REACT_APP_API_URL` to the backend's HTTPS origin in the frontend build environment; omit the trailing `/api` path.
- Open `/api/health` on the backend. `status: "ok"` confirms the server is running; `analysisConfigured: true` confirms a key is present, and `model` shows which model is configured. This cannot prove the key is valid or has quota.
- If analysis fails, the upload response now includes a short `code` and a specific message for common Gemini key, permission, model, request, and quota errors. Check Render logs for the upstream status and reason without sharing the API key.

## Contributing

Contributions are welcome. Open an issue or submit a pull request with a clear description of the change.
