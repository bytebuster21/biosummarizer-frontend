import { useEffect, useState } from "react";
import { listPapers } from "../api/client";
import "../styles/bio.css";

export default function Dashboard() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPapers()
      .then(setPapers)
      .finally(() => setLoading(false));
  }, []);

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
            Library
          </div>
        </header>

        <section className="dashboard-heading">
          <div>
            <div className="eyebrow">RESEARCH LIBRARY</div>
            <h1>All Papers</h1>
            <p>Your uploaded biomedical research documents in one place.</p>
          </div>

          <div className="library-stat">
            <strong>{papers.length}</strong>
            <span>papers</span>
          </div>
        </section>

        <section className="paper-list-card">
          <div className="list-header">
            <span>DOCUMENT</span>
            <span>ID</span>
          </div>

          {loading ? (
            <div className="empty-state">
              <span className="spinner dark-spinner" />
              Loading your research library...
            </div>
          ) : papers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⌁</div>
              <strong>No papers yet</strong>
              <p>Upload your first biomedical paper to start building your library.</p>
            </div>
          ) : (
            <div className="paper-list">
              {papers.map((p, index) => (
                <div className="paper-row" key={p.id}>
                  <div className="paper-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="paper-info">
                    <div className="paper-title">{p.title}</div>
                    <div className="paper-meta">Biomedical research paper</div>
                  </div>
                  <div className="paper-id">#{p.id}</div>
                  <div className="row-arrow">→</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="bio-footer">
          <span>BioSummarizer</span>
          <span>Research library · Local development</span>
        </footer>
      </div>
    </main>
  );
}