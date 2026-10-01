import React, { useRef, useState } from "react";
import {
  ArrowRight, Check, CheckCircle2, ChevronDown, Circle, ClipboardCheck,
  Download, FileText, Lightbulb, Loader2, Search, ShieldCheck, Sparkles,
  Target, UploadCloud, X, XCircle,
} from "lucide-react";

const MAX_SIZE = 10 * 1024 * 1024;
const MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const TABS = ["Overview", "Action plan", "Detailed review"];
const SCORE_LABELS = [
  ["ats", "ATS readiness"], ["content", "Content quality"],
  ["presentation", "Presentation"], ["impact", "Impact"],
];

const list = (value) => Array.isArray(value) ? value : [];
const score = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
  ? Math.max(0, Math.min(100, Math.round(Number(value)))) : null;
const fileSize = (bytes) => bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function ScoreBar({ label, value }) {
  const amount = score(value);
  return <div className="score-row">
    <div className="score-row-label"><span>{label}</span><strong>{amount === null ? "—" : `${amount}/100`}</strong></div>
    <div className="score-track"><div className="score-fill" style={{ width: `${amount || 0}%` }} /></div>
  </div>;
}

function SectionTitle({ eyebrow, title, description }) {
  return <div className="section-title">
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {description && <p>{description}</p>}
  </div>;
}

function App() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [completed, setCompleted] = useState({});
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  function selectFile(nextFile) {
    if (!nextFile) return;
    if (!MIME_TYPES.includes(nextFile.type)) {
      setError("Choose a PDF, PNG, or JPG file.");
      return;
    }
    if (nextFile.size > MAX_SIZE) {
      setError("The file must be 10 MB or smaller.");
      return;
    }
    if (loading) cancelAnalysis();
    setFile(nextFile);
    setReport(null);
    setExtractedText("");
    setCompleted({});
    setError("");
  }

  function clearFile() {
    if (loading) cancelAnalysis();
    setFile(null);
    setReport(null);
    setExtractedText("");
    setCompleted({});
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyze() {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setReport(null);
    const controller = new AbortController();
    abortRef.current = controller;
    const form = new FormData();
    form.append("cv", file);
    form.append("targetRole", role.trim());
    form.append("jobDescription", jobDescription.trim());
    try {
      const apiUrl = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/api/upload`, { method: "POST", body: form, signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !data?.data?.report) throw new Error(data.error || "Analysis failed. Please try again.");
      setReport(data.data.report);
      setExtractedText(data.data.extractedText || "");
      setActiveTab("Overview");
      setCompleted({});
      window.setTimeout(() => resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 80);
    } catch (failure) {
      if (failure.name !== "AbortError") setError(failure.message || "Could not analyze the CV. Please try again.");
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }

  function cancelAnalysis() {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }

  function exportReport() {
    if (!report) return;
    const lines = [
      "CV ANALYSIS", file?.name || "", "", report.overview?.summary || "", "",
      `Overall score: ${score(report.overview?.scores?.overall) ?? "N/A"}/100`, "",
      "TOP PRIORITIES", ...list(report.priorities).map((item) => `- ${item.title}: ${item.fix}`), "",
      "ACTION PLAN", ...["first", "next", "later"].flatMap((group) =>
        [`${group.toUpperCase()}:`, ...list(report.actionPlan?.[group]).map((item) => `- ${item}`)]), "",
      "STRENGTHS", ...list(report.strengths).map((item) => `- ${item}`), "",
      "SECTION REVIEW", ...list(report.sections).flatMap((item) =>
        [item.name || "Section", `Works: ${item.good || "—"}`, `Improve: ${item.improve || "—"}`, ""]),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cv-analysis.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(report?.overview?.summary || "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      setError("Could not copy the summary. Try downloading the report instead.");
    }
  }

  const scores = report?.overview?.scores || {};
  const plan = report?.actionPlan || {};
  const planGroups = [["first", "Do first"], ["next", "Do next"], ["later", "Nice to have"]];
  const totalTasks = planGroups.reduce((total, [key]) => total + list(plan[key]).length, 0);
  const doneCount = Object.values(completed).filter(Boolean).length;

  return <div className="app-shell">
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#top"><span className="brand-mark"><FileText size={20} /></span><span>CV<span className="brand-accent">Analyzer</span></span></a>
        <span className="header-note"><Sparkles size={14} /> Thoughtful feedback for your next move</span>
      </div>
    </header>

    <main id="top" className="container main-content">
      <section className="intro-grid" aria-labelledby="page-title">
        <div className="intro-copy">
          <div className="pill"><span className="pill-dot" /> YOUR CAREER, CLEARER</div>
          <h1 id="page-title">Make your CV<br /><em>work harder.</em></h1>
          <p>Get a focused review of what works, what needs attention, and what to change next. Built for quick decisions and deeper reading when you need it.</p>
          <div className="intro-points"><span><Target size={17} /> Role-aware feedback</span><span><ClipboardCheck size={17} /> Clear next steps</span></div>
        </div>
        <div className="process-card" aria-label="How it works">
          <div className="process-header"><span className="eyebrow">THE PROCESS</span><span className="process-icon"><Sparkles size={17} /></span></div>
          <div className="process-step"><span>01</span><div><strong>Share your CV</strong><p>Upload a PDF or image, up to 10 MB.</p></div></div>
          <div className="process-step"><span>02</span><div><strong>Add context</strong><p>Tell us your target role or paste a job description.</p></div></div>
          <div className="process-step"><span>03</span><div><strong>Make a plan</strong><p>Review your scores, priorities, and practical edits.</p></div></div>
        </div>
      </section>

      <section className="workspace-card" aria-labelledby="upload-title">
        <div className="workspace-heading"><div><span className="eyebrow">START HERE</span><h2 id="upload-title">Analyze your CV</h2><p>A little context makes the recommendations more useful.</p></div><span className="step-count">01 / 02</span></div>
        <div className="form-grid">
          <div>
            <input ref={inputRef} id="cv-file" type="file" accept=".pdf,.png,.jpg,.jpeg" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
            <div className={`drop-zone ${dragging ? "is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]); }}>
              <div className="drop-icon"><UploadCloud size={26} /></div>
              {file ? <><strong className="selected-file">{file.name}</strong><span>{fileSize(file.size)} · Ready to analyze</span><button type="button" className="text-button" onClick={clearFile}>Remove file <X size={14} /></button></> : <><strong>Drop your CV here</strong><span>or choose a file from your device</span><label htmlFor="cv-file" className="browse-button">Browse files <ArrowRight size={15} /></label></>}
              <small>PDF, PNG, JPG · Maximum 10 MB</small>
            </div>
          </div>
          <div className="context-fields">
            <label htmlFor="target-role">Target role <span>Optional</span></label>
            <input id="target-role" value={role} onChange={(event) => setRole(event.target.value)} maxLength={120} placeholder="e.g. Product Designer" />
            <label htmlFor="job-description">Job description <span>Optional</span></label>
            <textarea id="job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} maxLength={8000} rows={5} placeholder="Paste the role requirements for more relevant feedback..." />
            <p className="field-hint"><ShieldCheck size={15} /> Your CV and any job description are sent to the analysis service.</p>
          </div>
        </div>
        {error && <div className="error-message" role="alert"><XCircle size={18} />{error}</div>}
        <div className="form-footer"><p>You'll get a concise overview first, with details when you want them.</p><div className="form-actions">{loading && <button type="button" className="cancel-button" onClick={cancelAnalysis}>Cancel</button>}<button type="button" className="primary-button" onClick={analyze} disabled={!file || loading || !!error}>{loading ? <><Loader2 size={17} className="spin" /> Analyzing...</> : <>Analyze CV <ArrowRight size={17} /></>}</button></div></div>
      </section>

      {report && <section className="results" ref={resultsRef} aria-labelledby="results-title">
        <div className="results-heading"><div><span className="eyebrow">YOUR REVIEW</span><h2 id="results-title">A clearer path forward</h2><p>{file?.name}</p></div><div className="result-actions"><button type="button" className="secondary-button" onClick={copySummary}>{copied ? <Check size={16} /> : <ClipboardCheck size={16} />}{copied ? "Copied" : "Copy summary"}</button><button type="button" className="secondary-button" onClick={exportReport}><Download size={16} /> Download report</button></div></div>
        <div className="tab-list" role="tablist" aria-label="Analysis sections">{TABS.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>

        {activeTab === "Overview" && <div className="overview-layout" role="tabpanel">
          <div className="overview-main">
            <article className="verdict-card"><div className="verdict-top"><span className="eyebrow">AT A GLANCE</span><span className="verdict-tag">{report.overview?.verdict || "CV review"}</span></div><div className="verdict-body"><div className="big-score"><strong>{score(scores.overall) ?? "—"}</strong><span>/ 100</span></div><div><h3>Your CV, summarized</h3><p>{report.overview?.summary || "Your review is ready. Explore the sections below."}</p></div></div></article>
            <div className="content-card"><SectionTitle eyebrow="FOCUS AREAS" title="What to improve first" description="The changes most likely to make a difference." />{list(report.priorities).length ? <div className="priority-list">{list(report.priorities).map((item, index) => <article className="priority-item" key={`${item.title}-${index}`}><div className="priority-number">{String(index + 1).padStart(2, "0")}</div><div><div className="priority-head"><h3>{item.title}</h3><span className={`severity severity-${String(item.severity || "medium").toLowerCase()}`}>{item.severity || "Focus"}</span></div><p>{item.reason}</p><div className="fix-line"><Lightbulb size={16} /><span>{item.fix}</span></div></div></article>)}</div> : <p className="empty-note">No specific issues were returned for this CV.</p>}</div>
          </div>
          <aside className="overview-side"><div className="content-card score-card"><SectionTitle eyebrow="SCORECARD" title="The breakdown" />{SCORE_LABELS.map(([key, label]) => <ScoreBar key={key} label={label} value={scores[key]} />)}<p className="score-disclaimer">Scores are AI estimates to guide review, not hiring predictions.</p></div><div className="content-card strengths-card"><SectionTitle eyebrow="ALREADY WORKING" title="Your strengths" />{list(report.strengths).length ? <ul className="strength-list">{list(report.strengths).map((item, index) => <li key={index}><CheckCircle2 size={18} /><span>{item}</span></li>)}</ul> : <p className="empty-note">No specific strengths were returned.</p>}</div><button type="button" className="next-card" onClick={() => setActiveTab("Action plan")}><span><strong>Ready to improve it?</strong><small>Turn the feedback into a checklist.</small></span><ArrowRight size={20} /></button></aside>
        </div>}

        {activeTab === "Action plan" && <div className="plan-layout" role="tabpanel"><div className="content-card plan-card"><SectionTitle eyebrow="YOUR NEXT STEPS" title="A plan you can work through" description="Check off improvements as you make them. Progress stays on this page until you leave or analyze another CV." /><div className="plan-progress"><div className="plan-progress-label"><strong>{doneCount} of {totalTasks} complete</strong><span>{totalTasks ? Math.round(doneCount / totalTasks * 100) : 0}%</span></div><div className="score-track"><div className="score-fill" style={{ width: `${totalTasks ? doneCount / totalTasks * 100 : 0}%` }} /></div></div>{planGroups.map(([key, heading]) => list(plan[key]).length > 0 && <div className="plan-group" key={key}><h3>{heading}</h3>{list(plan[key]).map((item, index) => { const id = `${key}-${index}`; return <button type="button" key={id} className={`task-row ${completed[id] ? "done" : ""}`} onClick={() => setCompleted((current) => ({ ...current, [id]: !current[id] }))}>{completed[id] ? <CheckCircle2 size={20} /> : <Circle size={20} />}<span>{item}</span></button>; })}</div>)}{!totalTasks && <p className="empty-note">No action items were returned.</p>}</div><div className="plan-aside"><div className="content-card"><span className="eyebrow">A USEFUL REMINDER</span><h3>Keep it truthful.</h3><p>Use these suggestions only when they match your real experience. Add numbers and keywords when you can support them.</p></div></div></div>}

        {activeTab === "Detailed review" && <div className="details-layout" role="tabpanel"><div className="content-card"><SectionTitle eyebrow="SECTION BY SECTION" title="Look closer" description="Open the areas that matter most to you." />{list(report.sections).map((item, index) => <details className="detail-accordion" key={index}><summary><span>{item.name || `Section ${index + 1}`}</span><ChevronDown size={18} /></summary><div className="accordion-body"><div><strong>What works</strong><p>{item.good || "No specific strength noted."}</p></div><div><strong>What to improve</strong><p>{item.improve || "No specific change noted."}</p></div></div></details>)}{!list(report.sections).length && <p className="empty-note">No section review was returned.</p>}</div>
          <div className="content-card"><SectionTitle eyebrow="PRACTICAL EDITS" title="Better wording" description="Examples based on text found in your CV." />{list(report.rewrites).length ? list(report.rewrites).map((item, index) => <div className="rewrite-card" key={index}><span>BEFORE</span><p>{item.before}</p><span>TRY THIS</span><p className="rewrite-after">{item.after}</p>{item.note && <small>{item.note}</small>}</div>) : <p className="empty-note">No safe wording changes were identified.</p>}</div>
          <div className="content-card"><SectionTitle eyebrow="ATS REVIEW" title="Keywords & parsing" />{[["Already present", report.ats?.existingKeywords], ["Consider if accurate", report.ats?.suggestedKeywords]].map(([label, values]) => <div className="keyword-group" key={label}><h3>{label}</h3><div className="keyword-list">{list(values).length ? list(values).map((value, index) => <span key={index}>{value}</span>) : <p className="empty-note">None identified.</p>}</div></div>)}{list(report.ats?.concerns).length > 0 && <div className="ats-concerns"><h3>Parsing concerns</h3><ul>{list(report.ats.concerns).map((item, index) => <li key={index}>{item}</li>)}</ul></div>}</div>
          {extractedText && <details className="content-card extracted-card"><summary><span><Search size={19} /> Extracted text</span><ChevronDown size={18} /></summary><p>Check that the text was read correctly before applying the feedback.</p><pre>{extractedText}</pre></details>}
        </div>}
      </section>}
    </main>
    <footer className="site-footer"><div className="container"><span>CV Analyzer</span><span>Feedback is a starting point. You decide what goes on your CV.</span></div></footer>
  </div>;
}

export default App;
