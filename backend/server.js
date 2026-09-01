// Importing required packages
require("dotenv").config();
console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
console.log("API Key length:", process.env.GEMINI_API_KEY?.length);
console.log("First 10 chars:", process.env.GEMINI_API_KEY?.substring(0, 10));
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const pdfParse = require("pdf-parse").default || require("pdf-parse");

// Creating express application
const app = express();

// Getting port from environment variables or use 3001 if not specified
const PORT = process.env.PORT || 3001;

// Creating storage engine, files will be stored in RAM as buffer objects, assigned it to storage variable
const storage = multer.memoryStorage();

// Setting up file upload limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (reasonable size limit fo CV files)
  },
  // Adding file type filtering
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      // mimetype is file format identifier
      cb(null, true); // accept file
    } else {
      cb(new Error("Invalid file type. Only pdf, png and jpg are allowed")); // reject file
    }
  },
});


// Extracting Text from image files using OCR
async function extractTextFromImage(buffer) {
  try {
    const result = await Tesseract.recognize(buffer, "eng+ara+fra", {
      logger: (info) =>
        console.log("OCR Progress: ", info.status, info.progress),
    });
    return result.data.text;
  } catch (error) {
    throw new Error("OCR extraction failed: " + error.message);
  }
}

// Extracting text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error)
  {
    throw new Error("Error parsing pdf file " + error.message);
  }
}

async function analyzeCVText(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API key");
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        parts: [
          {
            text: `
              You are an expert CV/Resume Reviewer, Recruiter, ATS Specialist, and Career Advisor.

              Your task is to critically analyze the CV provided below and give practical, specific, and actionable recommendations that would improve the candidate's chances of passing ATS screening and getting interviews.

              IMPORTANT RULES:
              - Analyze ONLY the information present in the CV.
              - Do NOT invent experience, education, certifications, skills, achievements, metrics, or technologies that are not mentioned.
              - Clearly distinguish between an actual CV issue and a recommendation for improvement.
              - Do not give generic advice such as "make it better" or "add more details". Explain exactly what should be changed and, when possible, provide an example.
              - Evaluate the CV from both a human recruiter's perspective and an ATS perspective.
              - Consider the candidate's apparent career level, target profession, and experience based on the CV.
              - If something is already strong, explicitly say so instead of recommending unnecessary changes.
              - Prioritize the most important improvements first.
              - Be honest and critical, but constructive.
              - Do not judge the candidate personally. Evaluate only the CV.
              - If information is missing, identify it as missing rather than assuming it exists.

              Analyze the CV using the following criteria:

              1. STRUCTURE & FORMATTING
              Evaluate:
              - Overall organization and section ordering
              - Readability and visual hierarchy
              - Length and information density
              - Consistency of formatting
              - Section headings
              - Dates and chronology
              - Bullet-point structure
              - White space and unnecessary elements
              - Potential ATS parsing problems
              - Whether important information is easy to find

              2. PROFESSIONAL SUMMARY / PROFILE
              Evaluate:
              - Clarity of the candidate's professional identity
              - Relevance to their apparent target role
              - Specificity and impact
              - Use of generic or empty statements
              - Whether the summary communicates value quickly

              If there is no summary, determine whether one would be beneficial.

              3. EXPERIENCE
              For each relevant experience:
              - Evaluate the description of responsibilities
              - Identify vague or weak bullet points
              - Identify excessive focus on duties instead of achievements
              - Identify missing context, scope, technologies, or results
              - Identify opportunities to quantify impact
              - Recommend stronger wording

              Where possible, transform weak statements into stronger examples using ONLY information already available in the CV. Do not fabricate metrics.

              4. ACHIEVEMENTS & IMPACT
              Determine whether the CV demonstrates measurable impact.

              Look for:
              - Numbers
              - Percentages
              - Revenue
              - Cost savings
              - Performance improvements
              - Time saved
              - Users/customers served
              - Projects delivered
              - Team size
              - Scale
              - Rankings or awards
              - Other measurable outcomes

              Identify where achievements could be made more concrete.

              5. SKILLS
              Evaluate:
              - Technical and professional skills
              - Relevance to the candidate's apparent target roles
              - Organization and categorization
              - Redundant skills
              - Weak or overly generic skills
              - Missing skills that are strongly implied by the candidate's experience

              Do NOT recommend adding a skill unless there is evidence in the CV that the candidate has it.

              6. ATS & KEYWORDS
              Evaluate:
              - Important keywords already present
              - Missing or weak keywords
              - Keyword relevance
              - Job-title alignment
              - Technical terminology
              - Potential ATS parsing issues
              - Use of abbreviations versus full terminology

              If a target job description is NOT provided, do not claim that specific keywords are definitely required. Instead, identify keywords that would generally be relevant based on the candidate's apparent profession.

              7. EDUCATION & CERTIFICATIONS
              Evaluate:
              - Relevance
              - Ordering
              - Clarity
              - Dates
              - Degree/institution presentation
              - Certifications and their relevance

              8. PROJECTS
              If projects are present, evaluate:
              - Project descriptions
              - Technologies used
              - Candidate's contribution
              - Complexity
              - Results
              - Business or technical impact

              Recommend how projects could better demonstrate practical ability.

              9. COMMON CV PROBLEMS
              Identify issues such as:
              - Spelling or grammar problems
              - Repetition
              - Buzzwords
              - Unnecessary information
              - Weak wording
              - Inconsistent terminology
              - Unexplained gaps or ambiguities
              - Unprofessional phrasing
              - Excessive length
              - Missing important information

              10. OVERALL IMPACT
              Give an overall assessment of how effectively the CV communicates the candidate's value.

              Provide:
              - Overall score: X/100
              - ATS readiness score: X/100
              - Content quality score: X/100
              - Professional presentation score: X/100
              - Impact/achievement score: X/100

              Then classify the CV as:
              - Excellent
              - Strong
              - Average
              - Needs Improvement
              - Weak

              OUTPUT FORMAT:

              Return the analysis using exactly this structure:

              ## 1. Executive Summary
              Give a concise assessment of the CV in 3-5 sentences.

              ## 2. Scorecard
              Provide the requested scores and a short explanation for each.

              ## 3. Strengths
              List the strongest aspects of the CV. Only mention genuine strengths supported by the CV.

              ## 4. Critical Issues
              List the most important problems that should be fixed immediately.
              Rank them by priority:
              - Critical
              - High
              - Medium
              - Low

              For every issue, explain:
              - Problem
              - Why it matters
              - How to fix it

              ## 5. Section-by-Section Analysis
              Analyze:
              - Summary
              - Experience
              - Education
              - Skills
              - Projects
              - Certifications
              - Other sections

              For each section:
              - What is good
              - What is weak
              - What should change

              ## 6. Experience Improvements
              Identify weak bullet points and provide improved versions.

              Use this format:

              BEFORE:
              [original text]

              PROBLEM:
              [what is wrong]

              IMPROVED:
              [stronger version using only information available in the CV]

              If a bullet cannot be safely rewritten without inventing information, explain what information is missing.

              ## 7. ATS Analysis
              Provide:
              - ATS strengths
              - ATS problems
              - Existing relevant keywords
              - Potentially missing keywords
              - Formatting/parsing concerns

              ## 8. Missing Information
              Identify important information that appears to be missing from the CV.

              Do not assume the candidate has this information. Simply explain what could strengthen the CV if available.

              ## 9. Prioritized Action Plan
              Create a practical checklist divided into:

              ### Do First
              The highest-impact changes.

              ### Do Next
              Important improvements after the critical issues.

              ### Nice to Have
              Lower-priority improvements.

              ## 10. Final Verdict
              Give:
              - Overall score
              - ATS score
              - Top 3 changes that would have the biggest impact
              - One short paragraph summarizing the CV's current competitiveness.

              CV TEXT:
              ${text}
              `,
          },
        ],
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status} : ${err}`);
  }
  const result = await response.json();
  const aiText =
    result.candidates?.[0]?.content?.parts?.[0]?.text || "No response text";
  return aiText;
}

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localohost:3001",
        /\.netlify\.app$/,
      ];

      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === "string") {
          return origin === allowed;
        }
        return allowed.test(origin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// File upload endpoint
app.post("/api/upload", upload.single("cv"), async (req, res) => {
  try {
    // Checking if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }
    console.log("File received:");
    console.log("Name: ", req.file.originalname);
    console.log("Size: ", req.file.size, " bytes");
    console.log("Type: ", req.file.mimetype);

    let extractedText = "";

    // Extracting text based on file type
    if (req.file.mimetype === "application/pdf") {
      console.log("Extracting text from PDF");
      extractedText = await extractTextFromPDF(req.file.buffer);
    } else if (req.file.mimetype.startsWith("image/")) {
      console.log("Extracting text from image using OCR");
      extractedText = await extractTextFromImage(req.file.buffer);
    } else {
      return res.status(400).json({
        success: false,
        error: "Unsupported file type",
      });
    }

    // Ensure we got meaningful text (at least 50 characters)
    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: "Could not extract meaningful text from file!",
      });
    }

    console.log("Text extracted successfully");
    console.log("Text length: ", extractedText.length, " characters");
    console.log("Preview: ", extractedText.substring(0, 100) + " ... ");
    console.log("Analyzing extracted text with Gemini AI...");
    const aiAnalysis = await analyzeCVText(extractedText);
    console.log("AI analysis done.");

    // Send success response
    res.json({
      success: true,
      message: "File processed successfully",
      data: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        extractedText: extractedText,
        textLength: extractedText.length,
        aiAnalysis: aiAnalysis,
      },
    });
  } catch (error) {
    console.error("Upload error: ", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process file",
    });
  }
});

// Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "CV Analyzer API is running",
    timestamp: new Date().toISOString(),
  });
});

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "Test Endpoint",
      description: "This is a test route",
    },
  });
});

// Error test route (.status(500) for server error, 404 not found, 400 bad request(client error), 200 success)
app.get("/api/error", (req, res) => {
  res.status(500).json({
    success: false,
    error: "This is a test error",
  });
});

// Multer Error Handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Multer specific errors
    if (error.code == "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File size exceeds 10MB limit",
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  } else if (error) {
    // Other errors
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
