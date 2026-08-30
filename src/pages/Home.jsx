import React, { useState, useEffect } from "react";
import {
  uploadPaper,
  getSamplePapers,
  loadSamplePaper,
  summarizePaper,
  getGraph,
  getPaper,
} from "../api/client";
import Navbar from "../components/Navbar";
import SummaryView from "../components/SummaryView";
import KnowledgeGraphViewer from "../components/KnowledgeGraphViewer";
import RelatedLiterature from "../components/RelatedLiterature";
import PaperQA from "../components/PaperQA";
import ExportModal from "../components/ExportModal";

export default function Home() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [samplePapers, setSamplePapers] = useState([]);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [entities, setEntities] = useState([]);
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "graph" | "literature" | "qa" | "text"
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  // Load sample papers list on mount
  useEffect(() => {
    getSamplePapers()
      .then(setSamplePapers)
      .catch((e) => console.error("Could not load sample benchmark papers:", e));
  }, []);

  const processPaperAnalysis = async (paperId) => {
    setLoading(true);
    setError("");
    try {
      // Parallel fetch summary and graph
      const [sumRes, grpRes, paperDetail] = await Promise.all([
        summarizePaper(paperId),
        getGraph(paperId),
        getPaper(paperId),
      ]);

      setCurrentPaper(paperDetail);
      setSummaryData(sumRes);
      setGraphData(grpRes);
      setEntities(grpRes.entities || grpRes.nodes || []);
      setActiveTab("summary");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to analyze paper. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setError("");
    try {
      const uploaded = await uploadPaper(selectedFile);
      if (uploaded.error) throw new Error(uploaded.error);
      await processPaperAnalysis(uploaded.id);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not upload and parse the PDF document.");
      setLoading(false);
    }
  };

  const handleSelectSample = async (sampleId) => {
    setLoading(true);
    setError("");
    try {
      const loaded = await loadSamplePaper(sampleId);
      if (loaded.error) throw new Error(loaded.error);
      await processPaperAnalysis(loaded.id);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load sample paper.");
      setLoading(false);
    }
  };

  const hasData = Boolean(currentPaper && (summaryData || graphData));

  return (
    <div className="biolens-root">
      <Navbar
        hasData={hasData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportClick={() => setShowExportModal(true)}
      />

      <main className="biolens-main-content">
        {/* Top Hero Section */}
        <section className="biolens-hero">
          <div className="hero-badge">
            <span className="badge-sparkle">✦</span> AI-Powered Biomedical Evidence Synthesis & KG Hub
          </div>
          <h1>
            From Biomedical Literature to <span className="gradient-text">Structured Discovery.</span>
          </h1>
          <p className="hero-subtext">
            Upload biomedical papers or choose a benchmark clinical trial to generate multi-perspective summaries,
            interactive semantic knowledge graphs, evidence grounding, and 1-click jumps to NCBI, ClinVar, UniProt, and PubChem.
          </p>

          {/* Benchmark Preset Papers Bar */}
          {samplePapers && samplePapers.length > 0 && (
            <div className="sample-presets-bar">
              <span className="presets-label">⚡ Try Benchmark Papers:</span>
              <div className="preset-buttons">
                {samplePapers.map((s) => (
                  <button
                    key={s.id}
                    className="preset-pill-btn"
                    onClick={() => handleSelectSample(s.id)}
                    disabled={loading}
                  >
                    <span className="preset-cat">{s.category}</span>
                    <span className="preset-title">{s.title.slice(0, 48)}...</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Upload Card */}
        <section className="upload-section-card">
          <div
            className={`drop-zone-box ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
          >
            <input
              type="file"
              id="file-input"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="file-input" className="drop-zone-inner">
              <div className="upload-icon-circle">📄</div>
              <h3>{file ? file.name : "Drop your biomedical research paper (PDF) here"}</h3>
              <p>{file ? "Paper uploaded. Processing..." : "or click to browse from your computer (Max 25MB)"}</p>
              <div className="supported-formats">Supports Clinical Trials, Preprints, Review Papers & PubMed Articles</div>
            </label>
          </div>

          {error && (
            <div className="error-alert-banner">
              <span className="alert-icon">⚠️</span>
              <div>
                <strong>Analysis Notice:</strong> {error}
              </div>
            </div>
          )}
        </section>

        {/* Analysis Results Workspace */}
        {(loading || hasData) && (
          <section className="workspace-section">
            <div className="workspace-header">
              <div className="paper-title-meta">
                <span className="meta-tag">RESEARCH SYNTHESIS</span>
                <h2>{currentPaper?.title || "Analyzing Document..."}</h2>
              </div>

              {/* Tab Navigation */}
              <div className="workspace-tab-bar">
                <button
                  className={`ws-tab-btn ${activeTab === "summary" ? "active" : ""}`}
                  onClick={() => setActiveTab("summary")}
                >
                  📑 Research Brief
                </button>
                <button
                  className={`ws-tab-btn ${activeTab === "graph" ? "active" : ""}`}
                  onClick={() => setActiveTab("graph")}
                >
                  🕸️ Knowledge Graph
                </button>
                <button
                  className={`ws-tab-btn ${activeTab === "literature" ? "active" : ""}`}
                  onClick={() => setActiveTab("literature")}
                >
                  📚 Related Literature
                </button>
                <button
                  className={`ws-tab-btn ${activeTab === "qa" ? "active" : ""}`}
                  onClick={() => setActiveTab("qa")}
                >
                  💬 Ask the Paper (Q&A)
                </button>
                <button
                  className={`ws-tab-btn ${activeTab === "text" ? "active" : ""}`}
                  onClick={() => setActiveTab("text")}
                >
                  📄 Source Text
                </button>
              </div>
            </div>

            {/* Tab Panes */}
            <div className="workspace-content-pane">
              {activeTab === "summary" && (
                <SummaryView
                  summaryData={summaryData}
                  loading={loading}
                  entities={entities}
                />
              )}

              {activeTab === "graph" && (
                <KnowledgeGraphViewer
                  graph={graphData}
                  loading={loading}
                />
              )}

              {activeTab === "literature" && (
                <RelatedLiterature paperId={currentPaper?.id} />
              )}

              {activeTab === "qa" && (
                <PaperQA
                  paperId={currentPaper?.id}
                  paperTitle={currentPaper?.title}
                />
              )}

              {activeTab === "text" && (
                <div className="source-text-view">
                  <div className="source-text-header">
                    <h4>Original Extracted Paper Text</h4>
                    <span>{currentPaper?.original_text?.length || 0} characters</span>
                  </div>
                  <pre className="raw-text-box">{currentPaper?.original_text}</pre>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Feature Highlights Footer Strip */}
        <section className="feature-grid-strip">
          <div className="feature-item">
            <span className="feature-num">01</span>
            <h4>Tri-View Multi-Perspective Synthesis</h4>
            <p>Switch between Patient Layman language, Clinical & PICO deep-dive, and structured academic sections.</p>
          </div>
          <div className="feature-item">
            <span className="feature-num">02</span>
            <h4>Universal Database Resolver</h4>
            <p>1-click deep links for genes, mutations, drugs, and diseases to NCBI, ClinVar, UniProt, PubChem, and DrugBank.</p>
          </div>
          <div className="feature-item">
            <span className="feature-num">03</span>
            <h4>Live PubMed Discovery & Grounded Q&A</h4>
            <p>Query related literature via NCBI E-Utilities API and ask questions with verifiable sentence citations.</p>
          </div>
        </section>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          paper={currentPaper}
          summaryData={summaryData}
          graph={graphData}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
