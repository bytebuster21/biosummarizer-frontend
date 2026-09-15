import React from "react";

export default function Navbar({ onExportClick, hasData, activeTab, setActiveTab }) {
  return (
    <header className="bio-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-badge">✦</div>
          <div>
            <div className="brand-title">Bio<span>Lens</span> <span className="version-pill">v2.0</span></div>
            <div className="brand-tagline">Biomedical Intelligence & Knowledge Graph Suite</div>
          </div>
        </div>

        <nav className="navbar-links">
          {hasData && (
            <div className="nav-tabs">
              <button
                className={`nav-tab-btn ${activeTab === "summary" ? "active" : ""}`}
                onClick={() => setActiveTab("summary")}
              >
                📑 Brief & Synthesis
              </button>
              <button
                className={`nav-tab-btn ${activeTab === "graph" ? "active" : ""}`}
                onClick={() => setActiveTab("graph")}
              >
                🕸️ Knowledge Graph
              </button>
              <button
                className={`nav-tab-btn ${activeTab === "literature" ? "active" : ""}`}
                onClick={() => setActiveTab("literature")}
              >
                📚 Related Literature
              </button>
              <button
                className={`nav-tab-btn ${activeTab === "qa" ? "active" : ""}`}
                onClick={() => setActiveTab("qa")}
              >
                💬 Ask Paper (Q&A)
              </button>
            </div>
          )}
        </nav>

        <div className="navbar-actions">
          {hasData && (
            <button className="export-action-btn" onClick={onExportClick}>
              <span>⬇</span> Export Brief
            </button>
          )}
          <div className="status-live-indicator">
            <span className="pulse-dot"></span>
            PubMed & NCBI Connected
          </div>
        </div>
      </div>
    </header>
  );
}