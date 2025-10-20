// Importing required packages
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const PDFparser = require("pdf2json");
require("dotenv").config();

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
      cb(new Error("Inavlid file type. Only pdf, png and jpg are allowed")); // reject file
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
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFparser();
    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(new Error("PDF extraction failed: " + errData.parseError));
    });
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        let text = "";
        pdfData.Pages.forEach((page) => {
          page.Texts.forEach((textItem) => {
            textItem.R.forEach((r) => {
              text += decodeURIComponent(r.T) + " ";
            });
          });
          text += "\n";
        });
        resolve(text.trim());
      } catch (error) {
        reject(new Error("Failed to parse PDF content: " + error.message));
      }
    });
    pdfParser.parseBuffer(buffer);
  });
}

// Middleware
app.use(cors());
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
    console.log("File recieved:");
    console.log("Name: ", req.file.originalname);
    console.log("Size: ", req.file.size, " bytes");
    console.log("Type: ", req.file.mimetype);

    let extractedText = "";

    // Extracting text based on file type
    if (req.file.mimetype == "application/pdf") {
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
