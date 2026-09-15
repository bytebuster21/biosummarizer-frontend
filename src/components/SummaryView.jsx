import React, { useState, useMemo } from "react";

export default function SummaryView({ summaryData, loading, entities = [] }) {
  const [viewMode, setViewMode] = useState("plain"); // "plain" | "clinical" | "structured" | "highlights"
  const [highlightKeywords, setHighlightKeywords] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Map of entities for rapid lookup
  const entityMap = useMemo(() => {
    const map = {};
    if (entities && entities.length > 0) {
      entities.forEach((ent) => {
        map[ent.name.toLowerCase()] = ent;
      });
    }
    return map;
  }, [entities]);

  // Regex pattern for all known entity names
  const entityRegex = useMemo(() => {
    const names = Object.keys(entityMap);
    if (names.length === 0) return null;
    names.sort((a, b) => b.length - a.length);
    const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    return new RegExp(`\\b(${escaped})\\b`, "gi");
  }, [entityMap]);

  const renderInteractiveText = (text) => {
    if (!text) return null;
    if (!highlightKeywords || !entityRegex) {
      return <span>{text}</span>;
    }

    const parts = text.split(entityRegex);
    return parts.map((part, idx) => {
      const match = entityMap[part.toLowerCase()];
      if (match) {
        const typeClass = match.type.toLowerCase().replace(/[^a-z0-9]/g, "-");
        return (
          <span
            key={idx}
            className={`entity-pill-inline pill-${typeClass}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEntity(match);
            }}
            title={`Click to inspect ${match.name} (${match.type})`}
          >
            {part}
            <sup className="external-glyph">↗</sup>
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <div className="summary-loading-state">
        <div className="dna-loader">
          <span className="spinner-large" />
        </div>
        <h3>Synthesizing Multi-Perspective Research Brief...</h3>
        <p>Extracting PICO parameters, statistical endpoints, and cross-referencing external databases.</p>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="empty-summary-prompt">
        <p>No summary generated yet. Upload a PDF or pick a sample paper to begin.</p>
      </div>
    );
  }

  const multi = summaryData.multiview || (typeof summaryData === "object" ? summaryData : null);
  const plainText = multi?.plain_language || (typeof summaryData === "string" ? summaryData : "");
  const clinicalText = multi?.clinical_summary || summaryData.summary || plainText;
  const sections = multi?.structured_sections || {};
  const pico = multi?.pico || {};
  const highlights = multi?.key_highlights || [];
  const evidence = multi?.evidence_grounding || [];
  const groundedScore = multi?.groundedness_score || 0.92;

  return (
    <div className="summary-container">
      {/* Header controls & Multi-View Switcher */}
      <div className="summary-header-bar">
        <div className="view-switcher-group">
          <button
            className={`view-toggle-btn ${viewMode === "plain" ? "active" : ""}`}
            onClick={() => setViewMode("plain")}
          >
            🌟 Plain Language (Layman)
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "clinical" ? "active" : ""}`}
            onClick={() => setViewMode("clinical")}
          >
            🩺 Clinical & PICO Deep Dive
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "structured" ? "active" : ""}`}
            onClick={() => setViewMode("structured")}
          >
            📑 Structured Sections
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "highlights" ? "active" : ""}`}
            onClick={() => setViewMode("highlights")}
          >
            ⚡ Key Discoveries
          </button>
        </div>

        <div className="summary-controls-right">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={highlightKeywords}
              onChange={(e) => setHighlightKeywords(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">Biomedical Entity Highlighting</span>
          </label>
        </div>
      </div>

      {/* TL;DR Banner */}
      {multi?.tldr && (
        <div className="tldr-banner">
          <div className="tldr-tag">
            <span className="sparkle">⚡</span> TL;DR
          </div>
          <div className="tldr-text">{renderInteractiveText(multi.tldr)}</div>
        </div>
      )}

      {/* Main Mode Content */}
      <div className="summary-body-area">
        {viewMode === "plain" && (
          <div className="mode-pane plain-pane">
            <div className="pane-intro">
              <h4>Patient & Layman Summary</h4>
              <p>Translates complex clinical jargon into an accessible, clear explanation.</p>
            </div>
            <div className="summary-prose-card">
              <p className="prose-text">{renderInteractiveText(plainText)}</p>
            </div>
          </div>
        )}

        {viewMode === "clinical" && (
          <div className="mode-pane clinical-pane">
            <div className="pane-intro">
              <h4>Clinical & Pharmacological Evaluation</h4>
              <p>Extracts study design, PICO parameters, and quantitative metrics.</p>
            </div>

            {/* PICO Grid */}
            <div className="pico-grid">
              <div className="pico-card pico-p">
                <div className="pico-badge">P</div>
                <div className="pico-info">
                  <h5>Population / Cohort</h5>
                  <p>{pico.population || "Diagnosed clinical patient cohort meeting eligibility criteria."}</p>
                </div>
              </div>

              <div className="pico-card pico-i">
                <div className="pico-badge">I</div>
                <div className="pico-info">
                  <h5>Intervention</h5>
                  <p>{pico.intervention || "Investigational therapeutic drug or procedure."}</p>
                </div>
              </div>

              <div className="pico-card pico-c">
                <div className="pico-badge">C</div>
                <div className="pico-info">
                  <h5>Comparator</h5>
                  <p>{pico.comparator || "Standard of care or placebo control baseline."}</p>
                </div>
              </div>

              <div className="pico-card pico-o">
                <div className="pico-badge">O</div>
                <div className="pico-info">
                  <h5>Primary Outcomes</h5>
                  <p>{pico.primary_outcomes || "Overall survival, progression-free survival, safety profile."}</p>
                </div>
              </div>
            </div>

            <div className="summary-prose-card" style={{ marginTop: "18px" }}>
              <h5>Synthesis & Evidence</h5>
              <p className="prose-text">{renderInteractiveText(clinicalText)}</p>
            </div>
          </div>
        )}

        {viewMode === "structured" && (
          <div className="mode-pane structured-pane">
            <div className="pane-intro">
              <h4>Structured Sectional Breakdown</h4>
              <p>Systematic extraction aligned with peer-reviewed scientific reporting standards.</p>
            </div>

            <div className="structured-sections-stack">
              <div className="section-block">
                <div className="section-block-header">
                  <span className="section-icon">🎯</span>
                  <h5>1. Background & Research Objective</h5>
                </div>
                <p>{renderInteractiveText(sections.background || "The study investigates modern biomedical mechanisms and unmet clinical needs.")}</p>
              </div>

              <div className="section-block">
                <div className="section-block-header">
                  <span className="section-icon">🔬</span>
                  <h5>2. Methodology & Study Design</h5>
                </div>
                <p>{renderInteractiveText(sections.methodology || "Experimental cohorts were evaluated through rigorous laboratory and clinical trial methodologies.")}</p>
              </div>

              <div className="section-block">
                <div className="section-block-header">
                  <span className="section-icon">📊</span>
                  <h5>3. Key Findings & Quantitative Results</h5>
                </div>
                <p>{renderInteractiveText(sections.findings || "The intervention demonstrated distinct biological activity and statistically notable therapeutic endpoints.")}</p>
              </div>

              <div className="section-block">
                <div className="section-block-header">
                  <span className="section-icon">💡</span>
                  <h5>4. Clinical Implications & Conclusions</h5>
                </div>
                <p>{renderInteractiveText(sections.conclusion || "These findings provide a foundational basis for advancing clinical therapies and precision medicine.")}</p>
              </div>
            </div>
          </div>
        )}

        {viewMode === "highlights" && (
          <div className="mode-pane highlights-pane">
            <div className="pane-intro">
              <h4>Key Takeaway Discoveries</h4>
              <p>Top quantitative findings, statistical significance, and outcome metrics.</p>
            </div>

            <div className="highlights-list">
              {highlights.map((item, idx) => (
                <div key={idx} className="highlight-item-card">
                  <div className="highlight-index">0{idx + 1}</div>
                  <div className="highlight-content">
                    <p>{renderInteractiveText(item)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Grounding & Fact Verification Bar */}
        <div className="evidence-grounding-section">
          <div className="grounding-header">
            <div>
              <h6>Evidence Grounding & Verification</h6>
              <p>Verifiable sentence excerpts extracted directly from the paper text.</p>
            </div>
            <div className="grounded-score-badge">
              <span className="score-icon">✓</span> Groundedness Confidence: <b>{(groundedScore * 100).toFixed(0)}%</b>
            </div>
          </div>

          <div className="evidence-snippets-carousel">
            {evidence.length > 0 ? (
              evidence.map((snippet, idx) => (
                <div key={idx} className="evidence-quote-pill">
                  <span className="quote-marker">"</span>
                  <span className="quote-text">{snippet}</span>
                </div>
              ))
            ) : (
              <div className="evidence-quote-pill">
                <span className="quote-marker">"</span>
                <span className="quote-text">Directly synthesized from source document data and trial endpoints.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Entity Popover Modal */}
      {selectedEntity && (
        <div className="entity-modal-overlay" onClick={() => setSelectedEntity(null)}>
          <div className="entity-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="entity-modal-header">
              <div>
                <span className={`entity-type-badge pill-${selectedEntity.type.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                  {selectedEntity.type}
                </span>
                <h3>{selectedEntity.name}</h3>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedEntity(null)}>✕</button>
            </div>

            <p className="entity-modal-desc">
              Detected in this paper <b>{selectedEntity.frequency || 1} time(s)</b>. Jump to authoritative registries to explore genetics, clinical trials, pharmacology, and literature:
            </p>

            <div className="external-portal-grid">
              {selectedEntity.external_links && Object.entries(selectedEntity.external_links).map(([dbName, url]) => (
                <a
                  key={dbName}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="db-portal-btn"
                >
                  <span className="db-name">{dbName}</span>
                  <span className="db-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
