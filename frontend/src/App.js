import React, { useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

function App() {
  // State Management
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Handling drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // File validation
  const handleFile = (uploadedFile) => {
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
    ];

    if (!validTypes.includes(uploadedFile.type)) {
      setError("Please upload a PDF, PNG or JPG file");
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(uploadedFile);
    setError("");
    setAnalysis(null);
    setExtractedText("");
  };

  // API Call to backend
  const analyzeCV = async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("cv", file);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Analysis Failed");
      }

      setExtractedText(data.data.extractedText);
      setAnalysis(data.data.aiAnalysis);
    } catch (err) {
      setError(err.message || "Failed to analyze CV!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">CV Analyzer</h1>
          <p className="text-gray-600">
            Upload your CV and get AI-powered recommendations
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div
            className={`border-3 border-dashed rounded-lg p-12 text-center transition-all ${
              dragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 hover:border-indigo-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleChange}
            />

            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {file ? file.name : "Drop your CV here or click to upload"}
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, PNG, JPG (Max 10MB)
              </p>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {file && !error && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center min-w-0">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-green-700 text-sm font-medium truncate max-w-full sm:max-w-xs md:max-w-md">
                  {file.name} uploaded
                </span>
              </div>

              <button
                onClick={analyzeCV}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze CV
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {analysis && (
          <div className="space-y-6">
            {extractedText && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <FileText className="w-6 h-6 text-indigo-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">
                    Extracted Text
                  </h2>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {extractedText}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">
                  AI Recommendations
                </h2>
              </div>
              <div className="prose prose-indigo max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                  {analysis}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
