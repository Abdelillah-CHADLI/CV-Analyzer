import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  XCircle,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
  BarChart3,
  ChevronDown,
  File,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (uploadedFile) => {
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
    ];

    if (!validTypes.includes(uploadedFile.type)) {
      setError("Please upload a PDF, PNG, or JPG file.");
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    setFile(uploadedFile);
    setError("");
    setAnalysis(null);
    setExtractedText("");
  };

  const removeFile = () => {
    setFile(null);
    setError("");
    setAnalysis(null);
    setExtractedText("");
  };

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
        throw new Error(data.error || "Analysis failed");
      }

      setExtractedText(data.data.extractedText);
      setAnalysis(data.data.aiAnalysis);
    } catch (err) {
      setError(err.message || "Failed to analyze CV. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Split markdown into sections based on headings (## or ###)
  const splitIntoSections = (markdown) => {
    if (!markdown) return [];
    const lines = markdown.split("\n");
    const sections = [];
    let current = { title: null, content: [] };

    lines.forEach((line) => {
      const headingMatch = line.match(/^#{2,3}\s+(.+)/);
      if (headingMatch) {
        if (current.content.length > 0) {
          sections.push({ ...current, content: current.content.join("\n") });
        }
        current = { title: headingMatch[1].trim(), content: [] };
      } else {
        current.content.push(line);
      }
    });

    if (current.content.length > 0) {
      sections.push({ ...current, content: current.content.join("\n") });
    }

    return sections;
  };

  const analysisSections = analysis ? splitIntoSections(analysis) : [];

  return (
    <div className="min-h-screen bg-surface-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-50/60 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-50/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-xs font-semibold mb-6 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Analysis
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4 leading-tight">
            Upgrade your CV
            <br />
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-violet-500 bg-clip-text text-transparent">
              with smart feedback
            </span>
          </h1>

          <p className="text-stone-500 text-lg max-w-md mx-auto leading-relaxed">
            Upload your resume and receive tailored, AI-driven recommendations
            to stand out to recruiters.
          </p>
        </header>

        {/* Features row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {[
            { icon: Zap, label: "Instant analysis", sub: "Seconds" },
            { icon: BarChart3, label: "ATS scoring", sub: "Optimized" },
            { icon: Shield, label: "Private & secure", sub: "Encrypted" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 py-4 px-2 bg-white/70 backdrop-blur-sm border border-stone-100 rounded-xl text-center"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-brand-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-stone-800">{label}</span>
              <span className="text-[10px] sm:text-xs text-stone-400 font-medium">{sub}</span>
            </div>
          ))}
        </div>

        {/* Upload Card */}
        <div
          className={`card p-6 sm:p-8 animate-slide-up ${!analysis ? "shadow-elevated" : ""}`}
          style={{ animationDelay: "0.2s" }}
        >
          {/* Dropzone */}
          <div
            className={`upload-zone ${
              dragActive ? "upload-zone-active" : "upload-zone-idle"
            } cursor-pointer`}
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
            <label htmlFor="file-upload" className="cursor-pointer block p-8 sm:p-12 text-center">
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                    <File className="w-7 h-7 text-brand-500" />
                  </div>
                  <div className="text-center max-w-full">
                    <p className="font-semibold text-stone-800 text-sm truncate max-w-[260px]">
                      {file.name}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 border border-stone-100 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-slow" />
                    <span className="text-xs text-stone-500 font-medium">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                    <Upload className="w-7 h-7 text-stone-400" />
                  </div>
                  <p className="text-stone-700 font-semibold mb-1">
                    Drop your CV here, or{" "}
                    <span className="text-brand-600 underline underline-offset-2">
                      browse
                    </span>
                  </p>
                  <p className="text-stone-400 text-sm">
                    PDF, PNG, or JPG &middot; Max 10MB
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 animate-slide-down">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Analyze Button */}
          {file && !error && (
            <div className="mt-5 animate-slide-up">
              <button
                onClick={analyzeCV}
                disabled={loading}
                className="btn-primary w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing your CV...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze CV
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {analysis && (
          <div className="mt-8 space-y-6 animate-slide-up">
            {/* Extracted Text */}
            {extractedText && (
              <details className="card group">
                <summary className="flex items-center gap-3 p-5 sm:p-6 cursor-pointer select-none list-none">
                  <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-stone-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <h2 className="font-display text-base font-bold text-stone-800">
                      Extracted Text
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Content parsed from your document
                    </p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-stone-300 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                  <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 max-h-56 overflow-y-auto">
                    <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
                      {extractedText}
                    </p>
                  </div>
                </div>
              </details>
            )}

            {/* AI Analysis */}
            <div className="card-elevated p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-md shadow-brand-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-stone-800">
                    AI Recommendations
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Personalized insights for your resume
                  </p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                {analysisSections.length > 0 ? (
                  <div className="space-y-8">
                    {analysisSections.map((section, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="hidden sm:flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-white font-display text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20">
                            {idx + 1}
                          </div>
                          {idx < analysisSections.length - 1 && (
                            <div className="w-px flex-1 bg-gradient-to-b from-brand-200 to-transparent my-2" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {section.title && (
                            <h3 className="font-display text-base font-bold text-stone-800 flex items-center gap-2 mb-2">
                              <ChevronDown className="w-4 h-4 text-brand-500 sm:hidden" />
                              {section.title}
                            </h3>
                          )}
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            >
                              {section.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                    {analysis}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-xs text-stone-300 font-medium">
            CV Analyzer &middot; Your data stays private
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
