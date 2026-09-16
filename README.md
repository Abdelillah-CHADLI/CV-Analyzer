# CV Analyzer

CV Analyzer is a React and Express application that extracts text from a CV and asks Google Gemini for feedback on its content, presentation, and ATS readiness.

## Features

- Upload a PDF, PNG, or JPG file up to 10 MB by browsing or dragging it into the page.
- Extract text from PDFs with `pdf-parse` and from images with Tesseract OCR (English, Arabic, and French).
- View the extracted text and a structured Gemini analysis with scores, strengths, issues, and a prioritized action plan.
- Read the analysis in a responsive interface built with React and Tailwind CSS.

## Requirements

- Node.js 18 or newer and npm 9 or newer
- A Google Gemini API key

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

`POST /api/upload` accepts one multipart form field named `cv`. Supported MIME types are PDF, PNG, and JPEG; the maximum file size is 10 MB. The response includes the extracted text and AI analysis. Files with less than 50 characters of extracted text are rejected.

`GET /api/health` returns the backend status.

## Project layout

- `backend/` — Express API, file validation, text extraction, and Gemini request.
- `frontend/` — React upload and results interface. Run `npm run build` here to create a production build.

## Notes

Analysis requires a working Gemini API key and network access. The first request to a hosted backend may take longer if that service has been idle. Review the extracted text before relying on the recommendations, especially for image scans and complex PDF layouts.

## Contributing

Contributions are welcome. Open an issue or submit a pull request with a clear description of the change.
