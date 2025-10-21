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
            text: `You are an expert CV/Resume reviewer and career advisor. Analyze the following CV and provide detailed, actionable recommendations to improve it.
            Focus on:
            1. Structure & Format
            2. Content Quality
            3. Keywords & ATS
            4. Achievements
            5. Skills Section
            6. Overall Impact
            7. Common Issues
            Provide specific examples and constructive suggestions.\n\nCV TEXT:\n${text}`,
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
