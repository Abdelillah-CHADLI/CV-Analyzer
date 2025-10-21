# CV Analyzer

**AI-powered CV analysis tool** that extracts, analyzes, and provides actionable recommendations to help users improve their resumes. Supports PDF, PNG, and JPG files, with OCR text extraction.

---

## Features
- Extract text from PDF (pdf-parse.js), PNG, and JPG CVs using OCR (Tesseract.js)
- AI-powered analysis and personalized recommendations using **Google Gemini API**
- Clean and structured Markdown output for easy readability
- Responsive web interface built with React and Tailwind CSS
- Drag-and-drop upload and file validation
- Real-time AI feedback for improving CV structure, skills, and content

---

## Project Structure
- `/backend` - Node.js + Express server handling file uploads, OCR, and AI analysis
- `/frontend` - React web application for file upload, analysis display, and user interaction

---

## Tech Stack
- **Backend:** Node.js, Express
- **Frontend:** React, Tailwind CSS
- **AI Analysis:** Google Gemini API
- **OCR:** Tesseract.js

---

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Abdelillah-CHADLI/CV-Analyzer
cd CV-Analyzer
```

2. **Set up the backend:**
```bash
cd backend
npm install
```

3. **Set up the frontend:**
```bash
cd ../frontend
npm install
```

4. **Environment Variables (.env):**
```bash
Create a .env file in the /backend folder with your Gemini API key:

GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

5. **Run the app:**
```bash
# In backend folder
npm start

# In frontend folder
npm start
Open your browser at http://localhost:3000 to use the app.
```


## Status
Beta version. Work in progress:

1-Improve PDF and OCR extraction accuracy

2-Reduce response time

3-Clean up output formatting

4-Potentially support additional file types

## Contributing
Contributions are welcome! Please fork the repository, create a branch, and submit a pull request with your improvements.

## Author
Mohamed Abdelillah Chadli

## License
MIT