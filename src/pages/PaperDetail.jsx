import { useEffect, useState } from "react";
import { getPaper, summarizePaper, getGraph } from "../api/client";
import SummaryView from "../components/SummaryView";
import KnowledgeGraphViewer from "../components/KnowledgeGraphViewer";
import "../styles/bio.css";

export default function PaperDetail({ paperId }) {
  const [paper, setPaper] = useState(null);
  const [graph, setGraph] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (paperId) {
      getPaper(paperId)
        .then(setPaper)
        .catch(() => setError("Unable to load this paper."));
    }
  }, [paperId]);

  const handleSummarize = async () => {
    setSummarizing(true);
    setError(null);

    try {
      const result = await summarizePaper(paperId);
      setPaper((prev) => ({ ...prev, summary: result.summary }));
    } catch {
      setError("Unable to generate the summary.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleGenerateGraph = async () => {
    setGraphLoading(true);
    setError(null);

    try {
      const result = await getGraph(paperId);
      setGraph(result);
    } catch {
      setError("Unable to generate the knowledge graph.");
    } finally {
      setGraphLoading(false);
    }
  };

  if (!paper) {
    return (
      <main className="bio-page">
        <div className="loading-page">
          <span className="spinner" />
          Loading paper...
        </div>
      </main>
    );
  }

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
            Paper detail
          </div>
        </header>

        <section className="detail-hero">
          <div>
            <div className="eyebrow">RESEARCH PAPER · #{paperId}</div>
            <h1>{paper.title}</h1>
            <p>Generate structured insights and relationships from this document.</p>
          </div>
        </section>

        {error && (
          <div className="alert error-alert">
            <span>!</span>
            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="detail-actions">
          <button className="primary-btn" onClick={handleSummarize} disabled={summarizing}>
            {summarizing ? <><span className="spinner" /> Generating...</> : <>Generate Summary <span>→</span></>}
          </button>

          <button className="secondary-btn" onClick={handleGenerateGraph} disabled={graphLoading}>
            {graphLoading ? <><span className="spinner" /> Building graph...</> : <>Generate Knowledge Graph <span>⌁</span></>}
          </button>
        </div>

        <section className="result-grid detail-results">
          <div className="result-card">
            <div className="result-card-header">
              <div>
                <div className="eyebrow">SYNTHESIS</div>
                <h2>Research Summary</h2>
              </div>
              <div className="result-number">01</div>
            </div>
            <div className="embedded-result">
              <SummaryView summary={paper.summary} />
            </div>
          </div>

          <div className="result-card graph-card">
            <div className="result-card-header">
              <div>
                <div className="eyebrow">RELATIONSHIPS</div>
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
          <span>Paper detail · Local development</span>
        </footer>
      </div>
    </main>
  );
}