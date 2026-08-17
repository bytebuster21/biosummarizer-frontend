import { useState } from "react";
import { uploadPaper, summarizePaper, getGraph } from "../api/client";
import SummaryView from "../components/SummaryView";
import KnowledgeGraphViewer from "../components/KnowledgeGraphViewer";
import "../styles/bio.css";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [title, setTitle] = useState(null);
  const [graph, setGraph] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setSummary(null);
    setGraph(null);

    try {
      const uploaded = await uploadPaper(file);

      if (uploaded.error) {
        setError(uploaded.error);
        setLoading(false);
        return;
      }

      setTitle(uploaded.title);

      const summarized = await summarizePaper(uploaded.id);
      setSummary(summarized.summary);

      const graphResult = await getGraph(uploaded.id);
      setGraph(graphResult);
    } catch (err) {
      setError("Something went wrong. Check that the backend server is running.");
    }

    setLoading(false);
  };

  return (
    <main className="bio-page">
      <div className="bio-shell">
        <header className="bio-topbar">
          <div className="brand">
            <div className="brand-mark">✦</div>
            <div>
              <div className="brand-name">BioSummarizer</div>
              <div className="brand-subtitle">Biomedical intelligence workspace</div>
            </div>
          </div>
          <div className="status-pill">
            <span className="status-dot" />
            AI Analysis Ready
          </div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">BIOMEDICAL RESEARCH</div>
            <h1>Turn complex papers into <span>clear insights.</span></h1>
            <p>
              Upload a biomedical research paper and generate an intelligent
              summary plus a knowledge graph from the document.
            </p>
          </div>

          <div className="hero-orb">
            <div className="orb-ring orb-ring-one" />
            <div className="orb-ring orb-ring-two" />
            <div className="orb-core">DNA</div>
          </div>
        </section>

        <section className="upload-card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">01 / DOCUMENT</div>
              <h2>Analyze a research paper</h2>
            </div>
            <span className="file-type">PDF only</span>
          </div>

          <form onSubmit={handleSubmit}>
            <label className={`drop-zone ${file ? "has-file" : ""}`}>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
              <div className="upload-icon">↑</div>
              <div className="drop-title">
                {file ? "Paper selected" : "Choose a biomedical PDF"}
              </div>
              <div className="drop-hint">
                {file
                  ? file.name
                  : "Click to browse your files"}
              </div>
            </label>

            <div className="upload-actions">
              <div className="selected-file">
                <span className="pdf-badge">PDF</span>
                <span>{file ? file.name : "No document selected"}</span>
              </div>

              <button
                className="primary-btn"
                type="submit"
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Processing paper...
                  </>
                ) : (
                  <>
                    Upload & Analyze
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div className="alert error-alert">
            <span>!</span>
            <div>
              <strong>Analysis failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {title && !error && (
          <div className="alert success-alert">
            <span>✓</span>
            <div>
              <strong>Document uploaded successfully</strong>
              <p>{title}</p>
            </div>
          </div>
        )}

        <section className="result-grid">
          <div className="result-card">
            <div className="result-card-header">
              <div>
                <div className="eyebrow">02 / SYNTHESIS</div>
                <h2>Research Summary</h2>
              </div>
              <div className="result-number">01</div>
            </div>
            <div className="embedded-result">
              <SummaryView summary={summary} />
            </div>
          </div>

          <div className="result-card graph-card">
            <div className="result-card-header">
              <div>
                <div className="eyebrow">03 / RELATIONSHIPS</div>
                <h2>Knowledge Graph</h2>
              </div>
              <div className="result-number">02</div>
            </div>
            <div className="embedded-result graph-result">
              <KnowledgeGraphViewer graph={graph} />
            </div>
          </div>
        </section>

        <footer className="bio-footer">
          <span>BioSummarizer</span>
          <span>Biomedical paper analysis · Local development</span>
        </footer>
      </div>
    </main>
  );
}