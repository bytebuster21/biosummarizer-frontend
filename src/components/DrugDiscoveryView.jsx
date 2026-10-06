import React, { useState, useEffect } from "react";
import { getDrugDiscovery } from "../api/client";

export default function DrugDiscoveryView({ paperId, paperTitle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("timeline"); // "timeline" | "approved" | "pipeline" | "targets" | "resistance"

  useEffect(() => {
    if (paperId) {
      setLoading(true);
      setError(null);
      getDrugDiscovery(paperId)
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Drug discovery fetch failed:", err);
          setError("Failed to load drug discovery data for this paper's disease indication.");
          setLoading(false);
        });
    }
  }, [paperId]);

  if (loading) {
    return (
      <div className="drug-discovery-loading">
        <span className="spinner-large" />
        <h4>Synthesizing Drug Discovery & Therapeutic Landscape...</h4>
        <p>Analyzing indication pathophysiology, historical FDA milestones, target biology, and investigational pipeline.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="empty-state-card">
        <p>{error || "No drug discovery data available for this document."}</p>
      </div>
    );
  }

  const {
    disease_name,
    disease_overview,
    timeline = [],
    approved_therapies = [],
    pipeline_modalities = [],
    targets_and_pathways = [],
    resistance_mechanisms = "",
    external_registries = {},
  } = data;

  return (
    <div className="drug-discovery-workspace">
      {/* Disease Header Card */}
      <div className="dd-hero-card">
        <div className="dd-badge-row">
          <span className="dd-badge">💊 TARGET INDICATION DRUG DISCOVERY</span>
          <span className="dd-tag">{approved_therapies.length} Approved Therapies</span>
          <span className="dd-tag">{pipeline_modalities.length} Emerging Modalities</span>
        </div>
        <h2>{disease_name}</h2>
        <p className="dd-overview-text">{disease_overview}</p>

        {/* Live Database Deep Links Bar */}
        <div className="dd-registries-row">
          <span className="registries-label">Registry Queries:</span>
          {Object.entries(external_registries).map(([name, url]) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="dd-registry-pill"
              title={`Query ${name} for ${disease_name}`}
            >
              <span>🔗 {name}</span>
              <span className="ext-glyph">↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="dd-nav-bar">
        <button
          className={`dd-nav-btn ${activeSubTab === "timeline" ? "active" : ""}`}
          onClick={() => setActiveSubTab("timeline")}
        >
          📜 Breakthrough Timeline ({timeline.length})
        </button>
        <button
          className={`dd-nav-btn ${activeSubTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveSubTab("approved")}
        >
          ✅ Approved Therapeutics ({approved_therapies.length})
        </button>
        <button
          className={`dd-nav-btn ${activeSubTab === "pipeline" ? "active" : ""}`}
          onClick={() => setActiveSubTab("pipeline")}
        >
          🚀 Next-Gen Pipeline ({pipeline_modalities.length})
        </button>
        <button
          className={`dd-nav-btn ${activeSubTab === "targets" ? "active" : ""}`}
          onClick={() => setActiveSubTab("targets")}
        >
          🎯 Targets & Pathways ({targets_and_pathways.length})
        </button>
        <button
          className={`dd-nav-btn ${activeSubTab === "resistance" ? "active" : ""}`}
          onClick={() => setActiveSubTab("resistance")}
        >
          🛡️ Resistance Mechanisms
        </button>
      </div>

      {/* Sub Tab Content */}
      <div className="dd-tab-content">
        {/* Timeline View */}
        {activeSubTab === "timeline" && (
          <div className="dd-timeline-view">
            <div className="dd-view-intro">
              <h4>Historical Milestones in Drug Discovery</h4>
              <p>Chronological evolution of therapeutic breakthroughs for {disease_name}.</p>
            </div>

            <div className="dd-timeline-stepper">
              {timeline.map((item, idx) => (
                <div key={idx} className="dd-timeline-node">
                  <div className="timeline-rail">
                    <span className="timeline-dot" />
                    {idx < timeline.length - 1 && <span className="timeline-line" />}
                  </div>
                  <div className="timeline-card">
                    <div className="timeline-header">
                      <span className="timeline-year">{item.year}</span>
                      <h5>{item.drug}</h5>
                      <span className="timeline-mechanism">{item.mechanism}</span>
                    </div>
                    <p className="timeline-milestone">{item.milestone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Therapeutics View */}
        {activeSubTab === "approved" && (
          <div className="dd-approved-view">
            <div className="dd-view-intro">
              <h4>FDA & EMA Approved Therapeutics</h4>
              <p>Standard-of-care agents and targeted therapies indicated for {disease_name}.</p>
            </div>

            <div className="approved-drugs-grid">
              {approved_therapies.map((drug, idx) => (
                <div key={idx} className="approved-drug-card">
                  <div className="drug-card-top">
                    <div>
                      <h5>{drug.name}</h5>
                      <span className="drug-brand">{drug.brand ? `(${drug.brand})` : ""}</span>
                    </div>
                    <span className="drug-year">{drug.approval}</span>
                  </div>

                  <div className="drug-meta-row">
                    <span className="drug-class-tag">{drug.class}</span>
                    <span className="drug-target-tag">Target: {drug.target}</span>
                  </div>

                  <p className="drug-moa-text">
                    <b>Mechanism of Action:</b> {drug.moa}
                  </p>

                  <div className="drug-action-links">
                    <a
                      href={`https://go.drugbank.com/unearth/q?searcher=drugs&query=${encodeURIComponent(drug.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="drug-db-link"
                    >
                      DrugBank Profile ↗
                    </a>
                    <a
                      href={`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(drug.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="drug-db-link"
                    >
                      PubChem Compound ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next-Gen Pipeline View */}
        {activeSubTab === "pipeline" && (
          <div className="dd-pipeline-view">
            <div className="dd-view-intro">
              <h4>Active Clinical Pipeline & Next-Generation Modalities</h4>
              <p>Investigational agents, novel mechanisms, and ongoing Phase 1/2/3 clinical development.</p>
            </div>

            <div className="pipeline-cards-list">
              {pipeline_modalities.map((item, idx) => (
                <div key={idx} className="pipeline-card">
                  <div className="pipeline-header">
                    <div>
                      <span className="pipeline-stage-badge">{item.stage}</span>
                      <h5>{item.modality}</h5>
                    </div>
                    <span className="pipeline-example">Lead Agent: <b>{item.example}</b></span>
                  </div>
                  <p className="pipeline-details">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Targets & Pathways View */}
        {activeSubTab === "targets" && (
          <div className="dd-targets-view">
            <div className="dd-view-intro">
              <h4>Druggable Targets & Intracellular Signaling Cascades</h4>
              <p>Key oncogenes, kinases, receptors, and regulatory checkpoints involved in pathogenesis.</p>
            </div>

            <div className="targets-grid">
              {targets_and_pathways.map((tp, idx) => (
                <div key={idx} className="target-card">
                  <div className="target-card-header">
                    <h5>{tp.target}</h5>
                    <span className="target-type-badge">{tp.type}</span>
                  </div>
                  <div className="target-pathway-info">
                    <span className="pathway-label">Signaling Axis:</span>
                    <p>{tp.pathway}</p>
                  </div>
                  <div className="target-actions">
                    <a
                      href={`https://www.ncbi.nlm.nih.gov/gene/?term=${encodeURIComponent(tp.target.split(' ')[0])}`}
                      target="_blank"
                      rel="noreferrer"
                      className="target-query-btn"
                    >
                      NCBI Gene Entry ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resistance Mechanisms View */}
        {activeSubTab === "resistance" && (
          <div className="dd-resistance-view">
            <div className="dd-view-intro">
              <h4>Mechanisms of Therapeutic Resistance & Next-Gen Strategies</h4>
              <p>Biological bypasses, acquired secondary mutations, and combination strategies.</p>
            </div>

            <div className="resistance-card">
              <div className="resistance-icon">🛡️</div>
              <div className="resistance-body">
                <h5>Overcoming Acquired & Primary Resistance in {disease_name}</h5>
                <p className="resistance-prose">{resistance_mechanisms}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
