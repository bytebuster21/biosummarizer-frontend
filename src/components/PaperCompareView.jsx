import React, { useState, useEffect } from "react";
import { listPapers, comparePapers, compareUploadedPapers, getSamplePapers, loadSamplePaper } from "../api/client";

export default function PaperCompareView({ currentPaperId, onSelectPaper }) {
  const [papersList, setPapersList] = useState([]);
  const [selectedP1, setSelectedP1] = useState(currentPaperId || "");
  const [selectedP2, setSelectedP2] = useState("");
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [compareMode, setCompareMode] = useState("select"); // "select" | "upload"
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);

  // Load available papers list
  useEffect(() => {
    listPapers()
      .then((papers) => {
        setPapersList(papers);
        if (papers.length > 0) {
          if (!selectedP1) setSelectedP1(papers[0].id);
          if (papers.length > 1 && !selectedP2) setSelectedP2(papers[1].id);
        }
      })
      .catch((e) => console.error("Could not load papers list:", e));
  }, [currentPaperId]);

  const handleRunComparison = async () => {
    if (!selectedP1 || !selectedP2) {
      setError("Please select both Paper 1 and Paper 2 to compare.");
      return;
    }
    if (selectedP1 === selectedP2) {
      setError("Please choose two different papers for comparison.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await comparePapers(selectedP1, selectedP2);
      if (res.error) throw new Error(res.error);
      setComparisonResult(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to compare selected papers.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAndCompare = async () => {
    if (!file1 || !file2) {
      setError("Please select both PDF files to upload and compare.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await compareUploadedPapers(file1, file2);
      if (res.error) throw new Error(res.error);
      setComparisonResult(res);
      // Refresh library list
      listPapers().then(setPapersList);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload and compare papers.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBenchmarkPair = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load sample-1 and sample-3 (both melanoma benchmark trials: Pembrolizumab vs Ipilimumab and Neoantigen mRNA vaccine)
      const p1 = await loadSamplePaper("sample-1");
      const p2 = await loadSamplePaper("sample-3");
      setSelectedP1(p1.id);
      setSelectedP2(p2.id);

      const res = await comparePapers(p1.id, p2.id);
      setComparisonResult(res);
      listPapers().then(setPapersList);
    } catch (err) {
      console.error(err);
      setError("Failed to load benchmark comparison pair.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compare-workspace">
      {/* Top Controls Header */}
      <div className="compare-header-box">
        <div className="compare-title-row">
          <div>
            <h3>Head-to-Head Research Paper Comparison</h3>
            <p>Side-by-side comparative clinical evaluation, PICO alignment, statistical efficacy differentials, and entity divergence.</p>
          </div>
          <button className="benchmark-pair-btn" onClick={handleLoadBenchmarkPair} disabled={loading}>
            ⚡ Load Benchmark Pair (KEYNOTE-006 vs KEYNOTE-942)
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="compare-mode-switch">
          <button
            className={`mode-btn ${compareMode === "select" ? "active" : ""}`}
            onClick={() => setCompareMode("select")}
          >
            📚 Select from Library ({papersList.length} papers)
          </button>
          <button
            className={`mode-btn ${compareMode === "upload" ? "active" : ""}`}
            onClick={() => setCompareMode("upload")}
          >
            📂 Upload 2 New PDF Papers
          </button>
        </div>

        {/* Selection Form */}
        {compareMode === "select" && (
          <div className="compare-select-grid">
            <div className="paper-picker-box">
              <label>Paper 1 (Primary Study):</label>
              <select
                value={selectedP1}
                onChange={(e) => setSelectedP1(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Choose Paper 1 --</option>
                {papersList.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} - {p.title.length > 60 ? p.title.slice(0, 58) + "..." : p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="compare-vs-badge">VS</div>

            <div className="paper-picker-box">
              <label>Paper 2 (Comparator Study):</label>
              <select
                value={selectedP2}
                onChange={(e) => setSelectedP2(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Choose Paper 2 --</option>
                {papersList.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} - {p.title.length > 60 ? p.title.slice(0, 58) + "..." : p.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="run-compare-btn"
              onClick={handleRunComparison}
              disabled={loading || !selectedP1 || !selectedP2 || selectedP1 === selectedP2}
            >
              {loading ? "Analyzing..." : "Compare Papers ➔"}
            </button>
          </div>
        )}

        {/* Upload Form */}
        {compareMode === "upload" && (
          <div className="compare-upload-grid">
            <div className="dual-upload-card">
              <span className="upload-pill-tag">Paper 1</span>
              <input
                type="file"
                id="comp-file1"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile1(e.target.files?.[0] || null)}
              />
              <label htmlFor="comp-file1" className="dual-file-label">
                📄 {file1 ? file1.name : "Select or Drop PDF #1"}
              </label>
            </div>

            <div className="compare-vs-badge">VS</div>

            <div className="dual-upload-card">
              <span className="upload-pill-tag">Paper 2</span>
              <input
                type="file"
                id="comp-file2"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile2(e.target.files?.[0] || null)}
              />
              <label htmlFor="comp-file2" className="dual-file-label">
                📄 {file2 ? file2.name : "Select or Drop PDF #2"}
              </label>
            </div>

            <button
              className="run-compare-btn"
              onClick={handleUploadAndCompare}
              disabled={loading || !file1 || !file2}
            >
              {loading ? "Uploading & Analyzing..." : "Upload & Compare ➔"}
            </button>
          </div>
        )}

        {error && (
          <div className="compare-error-alert">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>

      {/* Comparison Loading State */}
      {loading && (
        <div className="compare-loading-state">
          <span className="spinner-large" />
          <h4>Synthesizing Comparative Evaluation...</h4>
          <p>Aligning PICO parameters, computing statistical differentials, and cross-referencing shared molecular targets.</p>
        </div>
      )}

      {/* Comparison Results Dashboard */}
      {comparisonResult && !loading && (
        <div className="comparison-results-area">
          {/* Executive Verdict Banner */}
          <div className="verdict-banner-card">
            <div className="verdict-tag">
              <span className="sparkle">⚖️</span> COMPARATIVE VERDICT
            </div>
            <h4>{comparisonResult.verdict}</h4>
            <p className="verdict-synthesis">{comparisonResult.comparative_summary}</p>
          </div>

          {/* Paper Titles Side-by-Side Cards */}
          <div className="compared-papers-header-grid">
            <div className="paper-comp-badge-card card-p1">
              <span className="card-flag">STUDY 1</span>
              <h4>{comparisonResult.paper1_title}</h4>
            </div>
            <div className="paper-comp-badge-card card-p2">
              <span className="card-flag">STUDY 2</span>
              <h4>{comparisonResult.paper2_title}</h4>
            </div>
          </div>

          {/* PICO Comparison Matrix */}
          {comparisonResult.pico_comparison && (
            <div className="comp-matrix-section">
              <div className="section-title-row">
                <h4>PICO Framework Alignment</h4>
                <p>Side-by-side contrast of study population, interventions, controls, and primary endpoints.</p>
              </div>

              <div className="pico-comparison-table-wrap">
                <table className="pico-comp-table">
                  <thead>
                    <tr>
                      <th style={{ width: "16%" }}>Dimension</th>
                      <th style={{ width: "42%" }}>Study 1</th>
                      <th style={{ width: "42%" }}>Study 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(comparisonResult.pico_comparison).map(([dim, val]) => (
                      <tr key={dim}>
                        <td className="dimension-col">
                          <b>{dim.toUpperCase()}</b>
                          <span className="dim-subtext">
                            {dim === "population" ? "Patient Cohort" : dim === "intervention" ? "Regimen" : dim === "comparator" ? "Control Arm" : "Endpoints"}
                          </span>
                        </td>
                        <td className="paper1-cell">{val.paper1}</td>
                        <td className="paper2-cell">{val.paper2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quantitative Efficacy & Statistical Outcomes Table */}
          {comparisonResult.efficacy_comparison && comparisonResult.efficacy_comparison.length > 0 && (
            <div className="comp-efficacy-section">
              <div className="section-title-row">
                <h4>Quantitative Efficacy & Statistical Findings</h4>
                <p>Head-to-head metric comparison, hazard ratios, and clinical significance.</p>
              </div>

              <div className="efficacy-cards-grid">
                {comparisonResult.efficacy_comparison.map((eff, idx) => (
                  <div key={idx} className="eff-card">
                    <h5>{eff.metric}</h5>
                    <div className="eff-values-row">
                      <div className="eff-val-box val-p1">
                        <span className="eff-owner">Study 1:</span>
                        <p>{eff.paper1_val}</p>
                      </div>
                      <div className="eff-val-box val-p2">
                        <span className="eff-owner">Study 2:</span>
                        <p>{eff.paper2_val}</p>
                      </div>
                    </div>
                    {eff.analysis && <p className="eff-analysis-text">{eff.analysis}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety & Toxicity Comparison */}
          {comparisonResult.safety_comparison && (
            <div className="comp-safety-section">
              <div className="section-title-row">
                <h4>Safety & Toxicity Spectrum</h4>
                <p>Adverse events, high-grade toxicities, and tolerability differential.</p>
              </div>

              <div className="safety-comp-grid">
                <div className="safety-card">
                  <span className="safety-label">Study 1 Adverse Profile</span>
                  <p>{comparisonResult.safety_comparison.paper1_toxicity}</p>
                </div>
                <div className="safety-card">
                  <span className="safety-label">Study 2 Adverse Profile</span>
                  <p>{comparisonResult.safety_comparison.paper2_toxicity}</p>
                </div>
                <div className="safety-verdict-card">
                  <span className="safety-label">Tolerability Assessment</span>
                  <p>{comparisonResult.safety_comparison.tolerability_verdict}</p>
                </div>
              </div>
            </div>
          )}

          {/* Shared vs Unique Biological Entities (Venn Overlap) */}
          {comparisonResult.entity_overlap && (
            <div className="comp-entity-overlap-section">
              <div className="section-title-row">
                <h4>Biomedical Entity Overlap & Biological Divergence</h4>
                <p>Mapping shared biological targets, oncogenes, and distinct therapeutic approaches.</p>
              </div>

              <div className="overlap-three-col-grid">
                <div className="overlap-col col-unique1">
                  <h5>Unique to Study 1 ({comparisonResult.entity_overlap.unique_paper1?.length || 0})</h5>
                  <div className="entity-chip-stack">
                    {comparisonResult.entity_overlap.unique_paper1?.map((ent, i) => (
                      <span key={i} className="overlap-chip chip-p1">
                        {ent.name}
                      </span>
                    )) || <span className="no-items">None identified</span>}
                  </div>
                </div>

                <div className="overlap-col col-shared">
                  <h5>Shared Biology / Cross-Trial Nodes ({comparisonResult.entity_overlap.shared?.length || 0})</h5>
                  <div className="entity-chip-stack">
                    {comparisonResult.entity_overlap.shared?.map((ent, i) => (
                      <span key={i} className="overlap-chip chip-shared">
                        ★ {ent.name}
                      </span>
                    )) || <span className="no-items">None identified</span>}
                  </div>
                </div>

                <div className="overlap-col col-unique2">
                  <h5>Unique to Study 2 ({comparisonResult.entity_overlap.unique_paper2?.length || 0})</h5>
                  <div className="entity-chip-stack">
                    {comparisonResult.entity_overlap.unique_paper2?.map((ent, i) => (
                      <span key={i} className="overlap-chip chip-p2">
                        {ent.name}
                      </span>
                    )) || <span className="no-items">None identified</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rational Synergy Potential & Takeaways */}
          <div className="comp-synergy-takeaways-grid">
            {comparisonResult.synergy_potential && (
              <div className="synergy-card">
                <div className="synergy-header">
                  <span className="synergy-icon">🧬</span>
                  <h4>Rational Combination & Synergy Potential</h4>
                </div>
                <p>{comparisonResult.synergy_potential}</p>
              </div>
            )}

            {comparisonResult.takeaways && comparisonResult.takeaways.length > 0 && (
              <div className="takeaways-card">
                <h4>Key Comparative Takeaways</h4>
                <ul>
                  {comparisonResult.takeaways.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
