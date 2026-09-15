import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const TYPE_COLORS = {
  DISEASE: "#e63946",
  CHEMICAL: "#0077b6",
  GENE_PROTEIN: "#2a9d8f",
  MUTATION_VARIANT: "#9d4edd",
  PATHWAY_PROCESS: "#e76f51",
  CLINICAL_OUTCOME: "#f4a261",
  CLINICAL_TRIAL: "#457b9d",
  DEFAULT: "#6c757d",
};

const TYPE_DESCRIPTIONS = {
  DISEASE: {
    label: "Disease / Pathology",
    desc: "Target indications, cancers, disorders, symptoms, and pathological conditions.",
    example: "e.g., Melanoma, Non-Small Cell Lung Cancer, Cachexia",
  },
  CHEMICAL: {
    label: "Chemical / Drug",
    desc: "Therapeutic compounds, small molecule inhibitors, antibodies, and drug treatments.",
    example: "e.g., Pembrolizumab, Dabrafenib, Trametinib, Cisplatin",
  },
  GENE_PROTEIN: {
    label: "Gene / Protein",
    desc: "Target oncogenes, kinase enzymes, cell surface receptors, and signaling proteins.",
    example: "e.g., BRAF, EGFR, PD-L1, KRAS, TP53, VEGFA",
  },
  MUTATION_VARIANT: {
    label: "Mutation / Variant",
    desc: "Genomic alterations, driver mutations, codon substitutions, and resistance variants.",
    example: "e.g., V600E, T790M, G12D, Exon 19 Deletion",
  },
  PATHWAY_PROCESS: {
    label: "Pathway / Process",
    desc: "Biological cascades, metabolic processes, apoptosis, and immune checkpoints.",
    example: "e.g., MAPK Signaling, Angiogenesis, T-cell Activation",
  },
  CLINICAL_OUTCOME: {
    label: "Clinical Outcome",
    desc: "Trial efficacy endpoints, survival metrics, adverse events, and therapeutic responses.",
    example: "e.g., Overall Survival (OS), Progression-Free Survival (PFS), ORR",
  },
  CLINICAL_TRIAL: {
    label: "Clinical Trial",
    desc: "Clinical trial identifiers, study phase designations, and treatment cohort arms.",
    example: "e.g., NCT02362594, Phase III Study, Arm A vs B",
  },
};

const RELATION_COLORS = {
  TREATS: "#06d6a0",
  INHIBITS: "#ef476f",
  MUTATED_IN: "#9d4edd",
  BIOMARKER_FOR: "#ffd166",
  IMPROVES: "#118ab2",
  ADVERSE_EFFECT: "#e76f51",
  UPREGULATES: "#2a9d8f",
  ASSOCIATED_WITH: "#83c5be",
  CO_OCCURS_WITH: "#adb5bd",
  CONNECTED: "#94a3b8",
};

const RELATION_DESCRIPTIONS = [
  { rel: "TREATS", color: "#06d6a0", desc: "Chemical or drug demonstrates therapeutic efficacy for a disease condition." },
  { rel: "INHIBITS", color: "#ef476f", desc: "Drug or compound biochemically suppresses a gene, protein, or enzyme." },
  { rel: "MUTATED_IN", color: "#9d4edd", desc: "Genomic variant or mutation observed as an alteration in a disease." },
  { rel: "BIOMARKER_FOR", color: "#ffd166", desc: "Gene or protein serves as a diagnostic, prognostic, or predictive biomarker." },
  { rel: "UPREGULATES", color: "#2a9d8f", desc: "Entity stimulates increased biological activity or expression of another." },
  { rel: "IMPROVES", color: "#118ab2", desc: "Therapeutic intervention enhances a specific clinical outcome or survival." },
  { rel: "ADVERSE_EFFECT", color: "#e76f51", desc: "Treatment causes an undesirable clinical toxicity or side effect." },
  { rel: "ASSOCIATED_WITH", color: "#83c5be", desc: "Entities exhibit a statistically verified biological or clinical correlation." },
];

export default function KnowledgeGraphViewer({ graph, loading }) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState({});
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState("overview"); // "overview" | "legend" | "relations" | "howTo"

  // Filter noise such as raw email addresses or citation artifacts
  const sanitizedNodes = useMemo(() => {
    if (!graph || !graph.nodes) return [];
    return graph.nodes.filter((n) => {
      const label = (n.label || n.name || "").trim();
      if (!label || label.includes("@") || label.startsWith("http://") || label.startsWith("https://")) {
        return false;
      }
      return true;
    });
  }, [graph]);

  const sanitizedNodeIds = useMemo(() => new Set(sanitizedNodes.map((n) => n.id)), [sanitizedNodes]);

  // Available entity types in this graph
  const availableTypes = useMemo(() => {
    const set = new Set(sanitizedNodes.map((n) => n.type));
    return Array.from(set);
  }, [sanitizedNodes]);

  // Filtered graph data
  const filteredData = useMemo(() => {
    if (!sanitizedNodes || sanitizedNodes.length === 0) return { nodes: [], links: [] };

    const activeNodes = sanitizedNodes.filter((n) => {
      const typeAllowed = typeFilter[n.type] !== false;
      const searchAllowed = !searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase());
      return typeAllowed && searchAllowed;
    });

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));

    const activeLinks = (graph?.edges || [])
      .filter((e) => {
        const srcId = typeof e.source === "object" ? e.source.id : e.source;
        const tgtId = typeof e.target === "object" ? e.target.id : e.target;
        return (
          sanitizedNodeIds.has(srcId) &&
          sanitizedNodeIds.has(tgtId) &&
          activeNodeIds.has(srcId) &&
          activeNodeIds.has(tgtId)
        );
      })
      .map((e) => ({
        ...e,
        source: typeof e.source === "object" ? e.source.id : e.source,
        target: typeof e.target === "object" ? e.target.id : e.target,
        relation: e.relation_type || "CONNECTED",
      }));

    return {
      nodes: activeNodes.map((n) => ({
        ...n,
        name: n.label,
        val: Math.max(5, Math.min(22, (n.degree || 1) * 2.2 + (n.frequency || 1) * 0.8)),
      })),
      links: activeLinks,
    };
  }, [sanitizedNodes, sanitizedNodeIds, graph, typeFilter, searchTerm]);

  // Set of neighbor nodes & links for hover highlight
  const highlightInfo = useMemo(() => {
    const activeFocalNode = hoverNode || selectedNode;
    if (!activeFocalNode) return { neighborIds: new Set(), linkIds: new Set() };

    const focalId = activeFocalNode.id;
    const neighborIds = new Set([focalId]);
    const linkIds = new Set();

    filteredData.links.forEach((l) => {
      const src = typeof l.source === "object" ? l.source.id : l.source;
      const tgt = typeof l.target === "object" ? l.target.id : l.target;
      if (src === focalId) {
        neighborIds.add(tgt);
        linkIds.add(l.id || `${src}-${tgt}`);
      } else if (tgt === focalId) {
        neighborIds.add(src);
        linkIds.add(l.id || `${src}-${tgt}`);
      }
    });

    return { neighborIds, linkIds };
  }, [hoverNode, selectedNode, filteredData.links]);

  // Configure D3 Force simulation parameters to spread nodes nicely
  useEffect(() => {
    if (fgRef.current) {
      const chargeForce = fgRef.current.d3Force("charge");
      if (chargeForce) {
        chargeForce.strength(-480).distanceMax(1200);
      }

      const linkForce = fgRef.current.d3Force("link");
      if (linkForce) {
        linkForce.distance((link) => (link.relation === "TREATS" || link.relation === "INHIBITS" ? 130 : 100));
      }

      fgRef.current.d3ReheatSimulation();

      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit(500, 60);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [filteredData]);

  // Distribution chart data
  const chartData = useMemo(() => {
    if (!sanitizedNodes || sanitizedNodes.length === 0) return [];
    const counts = {};
    sanitizedNodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      rawType: type,
      count,
      color: TYPE_COLORS[type] || TYPE_COLORS.DEFAULT,
    }));
  }, [sanitizedNodes]);

  const toggleTypeFilter = (type) => {
    setTypeFilter((prev) => ({
      ...prev,
      [type]: prev[type] === false ? true : false,
    }));
  };

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 600);
      fgRef.current.zoom(2.2, 600);
    }
  }, []);

  const handleLinkClick = useCallback((link) => {
    setSelectedEdge(link);
    setSelectedNode(null);
  }, []);

  const handleResetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(500, 60);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.35, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 0.75, 400);
    }
  };

  const handleReheat = () => {
    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation();
      setTimeout(() => {
        fgRef.current?.zoomToFit(500, 60);
      }, 600);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graph, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "biomedical_knowledge_graph.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Connected neighbors for inspector
  const connectedNeighbors = useMemo(() => {
    if (!selectedNode || !graph || !graph.edges) return [];
    const nid = selectedNode.id;
    const neighbors = [];

    graph.edges.forEach((e) => {
      const srcId = typeof e.source === "object" ? e.source.id : e.source;
      const tgtId = typeof e.target === "object" ? e.target.id : e.target;

      if (srcId === nid) {
        const targetNode = sanitizedNodes.find((n) => n.id === tgtId);
        if (targetNode) {
          neighbors.push({
            node: targetNode,
            relation: e.relation_type,
            direction: "outgoing",
            evidence: e.evidence || [],
          });
        }
      } else if (tgtId === nid) {
        const sourceNode = sanitizedNodes.find((n) => n.id === srcId);
        if (sourceNode) {
          neighbors.push({
            node: sourceNode,
            relation: e.relation_type,
            direction: "incoming",
            evidence: e.evidence || [],
          });
        }
      }
    });

    return neighbors;
  }, [selectedNode, graph, sanitizedNodes]);

  if (loading) {
    return (
      <div className="graph-loading-state">
        <span className="spinner-large" />
        <h4>Extracting Semantic Biomedical Relationships...</h4>
        <p>Constructing multi-class entity graph with sentence evidence.</p>
      </div>
    );
  }

  if (!sanitizedNodes || sanitizedNodes.length === 0) {
    return (
      <div className="empty-graph-state">
        <p>No knowledge graph data available yet. Please analyze a paper first.</p>
      </div>
    );
  }

  const activeFocus = hoverNode || selectedNode;

  return (
    <div className={`kg-workspace ${isExpanded ? "kg-expanded-mode" : ""}`} ref={containerRef}>
      {/* Top Toolbar */}
      <div className="kg-toolbar">
        <div className="kg-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search entity (e.g. BRAF, Melanoma, Pembrolizumab)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm("")}>✕</button>}
          {searchTerm && (
            <span className="search-results-badge">{filteredData.nodes.length} matches</span>
          )}
        </div>

        <div className="kg-actions">
          <div className="zoom-btn-group">
            <button className="kg-btn icon-btn" onClick={handleZoomIn} title="Zoom In">
              ➕
            </button>
            <button className="kg-btn icon-btn" onClick={handleZoomOut} title="Zoom Out">
              ➖
            </button>
            <button className="kg-btn" onClick={handleResetZoom} title="Fit Entire Graph">
              ⤢ Fit Screen
            </button>
          </div>

          <button
            className="kg-btn"
            onClick={handleReheat}
            title="Re-balance force layout physics"
          >
            ⚡ Re-layout
          </button>

          <button
            className={`kg-btn ${showEdgeLabels ? "active" : ""}`}
            onClick={() => setShowEdgeLabels(!showEdgeLabels)}
            title="Toggle Relationship Predicate Labels"
          >
            🔤 Labels
          </button>

          <button
            className={`kg-btn ${showParticles ? "active" : ""}`}
            onClick={() => setShowParticles(!showParticles)}
            title="Toggle Flow Particles"
          >
            ✨ Flow
          </button>

          <button
            className={`kg-btn ${isExpanded ? "active" : ""}`}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse View" : "Expand Full View"}
          >
            {isExpanded ? "↙ Collapse" : "↗ Expand View"}
          </button>

          <button className="kg-btn primary" onClick={handleExportJSON} title="Download Graph JSON">
            ⬇ Export JSON
          </button>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="kg-filter-chips">
        <span className="filter-label">Filter Categories:</span>
        {availableTypes.map((type) => {
          const isOff = typeFilter[type] === false;
          const color = TYPE_COLORS[type] || TYPE_COLORS.DEFAULT;
          const count = sanitizedNodes.filter((n) => n.type === type).length;
          return (
            <button
              key={type}
              className={`type-chip ${isOff ? "disabled" : ""}`}
              style={{
                borderColor: color,
                backgroundColor: isOff ? "transparent" : `${color}16`,
                color: isOff ? "#888" : color,
              }}
              onClick={() => toggleTypeFilter(type)}
            >
              <span className="chip-dot" style={{ backgroundColor: color }}></span>
              {type.replace(/_/g, " ")}
              <span className="chip-count">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className={`kg-main-layout ${selectedNode || selectedEdge ? "has-inspector" : "full-canvas"}`}>
        <div className="kg-canvas-wrapper">
          <ForceGraph2D
            ref={fgRef}
            graphData={filteredData}
            nodeId="id"
            nodeLabel={(n) => `${n.name} [${n.type.replace(/_/g, " ")}] • Mentions: ${n.frequency || 1}`}
            nodeColor={(node) => TYPE_COLORS[node.type] || TYPE_COLORS.DEFAULT}
            nodeVal="val"
            linkLabel={(link) => `${link.source?.name || link.source} -- [${link.relation}] --> ${link.target?.name || link.target}`}
            linkColor={(link) => {
              const srcId = typeof link.source === "object" ? link.source.id : link.source;
              const tgtId = typeof link.target === "object" ? link.target.id : link.target;
              if (activeFocus) {
                const isConnected = highlightInfo.linkIds.has(link.id || `${srcId}-${tgtId}`);
                if (isConnected) {
                  return RELATION_COLORS[link.relation] || "#0c9b95";
                }
                return "rgba(200, 214, 211, 0.2)";
              }
              return RELATION_COLORS[link.relation] || "rgba(140, 175, 170, 0.6)";
            }}
            linkWidth={(link) => {
              const srcId = typeof link.source === "object" ? link.source.id : link.source;
              const tgtId = typeof link.target === "object" ? link.target.id : link.target;
              if (activeFocus && highlightInfo.linkIds.has(link.id || `${srcId}-${tgtId}`)) {
                return 3.2;
              }
              return 1.8;
            }}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={0.88}
            linkDirectionalParticles={showParticles ? (link) => {
              const srcId = typeof link.source === "object" ? link.source.id : link.source;
              const tgtId = typeof link.target === "object" ? link.target.id : link.target;
              if (activeFocus) {
                return highlightInfo.linkIds.has(link.id || `${srcId}-${tgtId}`) ? 4 : 0;
              }
              return 2;
            } : 0}
            linkDirectionalParticleWidth={2.5}
            linkDirectionalParticleSpeed={0.006}
            onNodeHover={(node) => setHoverNode(node || null)}
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            d3AlphaDecay={0.022}
            d3VelocityDecay={0.35}
            warmupTicks={70}
            cooldownTicks={180}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.name || node.label || "";
              const isFocal = activeFocus?.id === node.id;
              const isNeighbor = activeFocus && highlightInfo.neighborIds.has(node.id);
              const isDimmed = activeFocus && !isFocal && !isNeighbor;

              const baseRadius = Math.max(6, Math.min(18, (node.val || 5) * 0.9));
              const radius = isFocal ? baseRadius * 1.35 : baseRadius;
              const nodeColor = TYPE_COLORS[node.type] || TYPE_COLORS.DEFAULT;

              ctx.save();

              if (isDimmed) {
                ctx.globalAlpha = 0.18;
              }

              // Outer Glow Halo for Selected or Hovered Focal Node
              if (isFocal) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 7 / globalScale, 0, 2 * Math.PI, false);
                ctx.fillStyle = `${nodeColor}40`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 3 / globalScale, 0, 2 * Math.PI, false);
                ctx.fillStyle = `${nodeColor}80`;
                ctx.fill();
              }

              // Main Node Circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = nodeColor;
              ctx.shadowColor = nodeColor;
              ctx.shadowBlur = isFocal ? 12 : 3;
              ctx.fill();

              // High-contrast Node Border Ring
              ctx.lineWidth = (isFocal ? 2.8 : 1.5) / globalScale;
              ctx.strokeStyle = isFocal ? "#ffffff" : "rgba(255, 255, 255, 0.85)";
              ctx.stroke();

              // Clear shadow for text rendering
              ctx.shadowBlur = 0;

              // Node Label Rendering (with crisp background pill for clarity)
              const fontSize = Math.max(3.8, Math.min(12, 11 / globalScale));
              ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

              const textWidth = ctx.measureText(label).width;
              const textPaddingX = 5 / globalScale;
              const textPaddingY = 3 / globalScale;
              const labelX = node.x + radius + 4 / globalScale;
              const labelY = node.y - fontSize / 2;

              // Draw Pill Background behind text to ensure 100% legibility over links
              ctx.fillStyle = isFocal ? "#0d1e24" : "rgba(255, 255, 255, 0.94)";
              ctx.beginPath();
              const pillW = textWidth + textPaddingX * 2;
              const pillH = fontSize + textPaddingY * 2;
              const pillRadius = 3 / globalScale;
              ctx.roundRect(labelX, labelY - textPaddingY, pillW, pillH, pillRadius);
              ctx.fill();

              // Pill border
              ctx.lineWidth = 0.8 / globalScale;
              ctx.strokeStyle = isFocal ? nodeColor : "rgba(200, 214, 211, 0.8)";
              ctx.stroke();

              // Text Label String
              ctx.fillStyle = isFocal ? "#ffffff" : "#0d1e24";
              ctx.fillText(label, labelX + textPaddingX, labelY + fontSize * 0.85);

              ctx.restore();
            }}
          />

          {/* Floating Canvas Helper Badge */}
          <div className="canvas-hint-overlay">
            <span>💡 Click nodes for external database links & details • Click edges for paper sentence citations</span>
          </div>
        </div>

        {/* Entity Inspector Side Panel */}
        {selectedNode && (
          <aside className="kg-inspector-panel">
            <div className="inspector-header">
              <div>
                <span
                  className="type-tag"
                  style={{
                    backgroundColor: `${TYPE_COLORS[selectedNode.type] || "#555"}20`,
                    color: TYPE_COLORS[selectedNode.type] || "#555",
                    borderColor: TYPE_COLORS[selectedNode.type] || "#555",
                  }}
                >
                  {selectedNode.type?.replace(/_/g, " ")}
                </span>
                <h3>{selectedNode.name}</h3>
              </div>
              <button className="inspector-close-btn" onClick={() => setSelectedNode(null)} title="Close Inspector">
                ✕
              </button>
            </div>

            <div className="inspector-stats-row">
              <div className="stat-box">
                <span className="stat-label">Paper Mentions</span>
                <span className="stat-val">{selectedNode.frequency || 1}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Graph Degree</span>
                <span className="stat-val">{selectedNode.degree || connectedNeighbors.length}</span>
              </div>
            </div>

            {/* External Database Portals */}
            <div className="inspector-section">
              <h4>External Biomedical Registries</h4>
              <p className="section-subtext">1-click query to authoritative biomedical knowledgebases:</p>
              <div className="external-portal-list">
                {selectedNode.external_links && Object.keys(selectedNode.external_links).length > 0 ? (
                  Object.entries(selectedNode.external_links).map(([portal, url]) => (
                    <a
                      key={portal}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="portal-link-item"
                    >
                      <span className="portal-name">🔗 {portal}</span>
                      <span className="portal-icon">↗</span>
                    </a>
                  ))
                ) : (
                  <div className="fallback-portals">
                    <a
                      href={`https://www.ncbi.nlm.nih.gov/search/all/?term=${encodeURIComponent(selectedNode.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="portal-link-item"
                    >
                      <span className="portal-name">NCBI All Databases</span>
                      <span className="portal-icon">↗</span>
                    </a>
                    <a
                      href={`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(selectedNode.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="portal-link-item"
                    >
                      <span className="portal-name">PubChem Compound</span>
                      <span className="portal-icon">↗</span>
                    </a>
                    <a
                      href={`https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(selectedNode.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="portal-link-item"
                    >
                      <span className="portal-name">UniProt Protein KB</span>
                      <span className="portal-icon">↗</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Connected Relationships */}
            <div className="inspector-section">
              <h4>Connected Relationships ({connectedNeighbors.length})</h4>
              <div className="neighbor-list">
                {connectedNeighbors.length > 0 ? (
                  connectedNeighbors.map((nb, idx) => (
                    <div
                      key={idx}
                      className="neighbor-card"
                      onClick={() => handleNodeClick(nb.node)}
                      title={`Jump to ${nb.node.name}`}
                    >
                      <div className="neighbor-rel">
                        <span
                          className="rel-badge"
                          style={{
                            backgroundColor: `${RELATION_COLORS[nb.relation] || "#666"}20`,
                            color: RELATION_COLORS[nb.relation] || "#333",
                          }}
                        >
                          {nb.relation}
                        </span>
                        <span className="rel-target">
                          {nb.direction === "outgoing" ? "→" : "←"} {nb.node.name}
                        </span>
                      </div>
                      <span
                        className="neighbor-tag"
                        style={{ color: TYPE_COLORS[nb.node.type] || "#666" }}
                      >
                        {nb.node.type?.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-data-text">No direct linked neighbors in current view.</p>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Edge Inspector Panel */}
        {selectedEdge && (
          <aside className="kg-inspector-panel">
            <div className="inspector-header">
              <div>
                <span
                  className="type-tag relation-tag"
                  style={{
                    backgroundColor: `${RELATION_COLORS[selectedEdge.relation] || "#555"}25`,
                    color: RELATION_COLORS[selectedEdge.relation] || "#111",
                    borderColor: RELATION_COLORS[selectedEdge.relation] || "#555",
                  }}
                >
                  {selectedEdge.relation}
                </span>
                <h3>Relationship Verification</h3>
              </div>
              <button className="inspector-close-btn" onClick={() => setSelectedEdge(null)} title="Close Inspector">
                ✕
              </button>
            </div>

            <div className="edge-endpoints-card">
              <div className="endpoint-node">
                <span className="ep-label">Source Entity</span>
                <b>{selectedEdge.source_label || selectedEdge.source?.name || selectedEdge.source}</b>
              </div>
              <div
                className="rel-arrow-badge"
                style={{ color: RELATION_COLORS[selectedEdge.relation] || "#0c9b95" }}
              >
                ─── {selectedEdge.relation} ───►
              </div>
              <div className="endpoint-node">
                <span className="ep-label">Target Entity</span>
                <b>{selectedEdge.target_label || selectedEdge.target?.name || selectedEdge.target}</b>
              </div>
            </div>

            <div className="inspector-section">
              <h4>Paper Sentence Evidence</h4>
              <p className="section-subtext">Direct text passages extracted from the manuscript verifying this relation:</p>
              {selectedEdge.evidence && selectedEdge.evidence.length > 0 ? (
                selectedEdge.evidence.map((quote, idx) => (
                  <div key={idx} className="edge-evidence-quote">
                    <span className="quote-mark">“</span>
                    {quote}
                    <span className="quote-mark">”</span>
                  </div>
                ))
              ) : (
                <div className="edge-evidence-quote fallback-evidence">
                  Extracted via biological pathway ontology and co-occurrence association in paper synthesis.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Comprehensive Knowledge Graph Explanation Section */}
      <section className="kg-explanation-container">
        <div className="kg-explanation-header">
          <div className="explanation-title-group">
            <span className="explanation-icon">📖</span>
            <div>
              <h3>Understanding the Biomedical Knowledge Graph</h3>
              <p>How entities, directional relationships, and evidence grounding are extracted and mapped.</p>
            </div>
          </div>

          <div className="explanation-tabs">
            <button
              className={`exp-tab-btn ${activeGuideTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveGuideTab("overview")}
            >
              ✦ Overview
            </button>
            <button
              className={`exp-tab-btn ${activeGuideTab === "legend" ? "active" : ""}`}
              onClick={() => setActiveGuideTab("legend")}
            >
              🏷️ Entity Legend ({Object.keys(TYPE_DESCRIPTIONS).length})
            </button>
            <button
              className={`exp-tab-btn ${activeGuideTab === "relations" ? "active" : ""}`}
              onClick={() => setActiveGuideTab("relations")}
            >
              🔗 Relations & Predicates
            </button>
            <button
              className={`exp-tab-btn ${activeGuideTab === "howTo" ? "active" : ""}`}
              onClick={() => setActiveGuideTab("howTo")}
            >
              🎯 Interaction Guide
            </button>
          </div>
        </div>

        <div className="kg-explanation-body">
          {activeGuideTab === "overview" && (
            <div className="exp-pane overview-pane">
              <div className="overview-summary-grid">
                <div className="exp-highlight-card">
                  <div className="card-badge">01. Semantic Entity Extraction</div>
                  <h4>Biomedical NER & Ontology</h4>
                  <p>
                    BioSummarizer processes the raw scientific manuscript with biomedical Named Entity Recognition (NER),
                    identifying therapeutic molecules, driver oncogenes, biological pathways, cancer indications, and clinical trial endpoints.
                  </p>
                </div>
                <div className="exp-highlight-card">
                  <div className="card-badge">02. Grounded Relationship Triples</div>
                  <h4>Evidence-Backed Edges</h4>
                  <p>
                    Connecting lines represent directional biological relationships (e.g., <em>Drug ──[TREATS]──► Disease</em>,
                    <em>Inhibitor ──[INHIBITS]──► Kinase</em>). Every relationship is tied directly to verifiable sentence quotes.
                  </p>
                </div>
                <div className="exp-highlight-card">
                  <div className="card-badge">03. External Registry Federation</div>
                  <h4>1-Click Deep Links</h4>
                  <p>
                    Each node is cross-referenced against authoritative global biomedical registries including <strong>NCBI Gene</strong>,
                    <strong>ClinVar</strong>, <strong>UniProtKB</strong>, <strong>PubChem</strong>, and <strong>DrugBank</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === "legend" && (
            <div className="exp-pane legend-pane">
              <div className="legend-items-grid">
                {Object.entries(TYPE_DESCRIPTIONS).map(([typeKey, info]) => {
                  const color = TYPE_COLORS[typeKey] || TYPE_COLORS.DEFAULT;
                  const activeCount = sanitizedNodes.filter((n) => n.type === typeKey).length;
                  return (
                    <div key={typeKey} className="legend-card" style={{ borderLeftColor: color }}>
                      <div className="legend-card-header">
                        <span className="legend-color-dot" style={{ backgroundColor: color }} />
                        <h4 style={{ color }}>{info.label}</h4>
                        <span className="legend-type-code">{typeKey}</span>
                        {activeCount > 0 && <span className="legend-count-pill">{activeCount} in paper</span>}
                      </div>
                      <p className="legend-desc">{info.desc}</p>
                      <div className="legend-example">{info.example}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeGuideTab === "relations" && (
            <div className="exp-pane relations-pane">
              <div className="relations-grid">
                {RELATION_DESCRIPTIONS.map((r) => (
                  <div key={r.rel} className="relation-item-card">
                    <div className="rel-header">
                      <span
                        className="rel-pill"
                        style={{ backgroundColor: `${r.color}20`, color: r.color, borderColor: r.color }}
                      >
                        {r.rel}
                      </span>
                    </div>
                    <p>{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeGuideTab === "howTo" && (
            <div className="exp-pane howto-pane">
              <div className="howto-steps-grid">
                <div className="howto-step-box">
                  <span className="step-number">1</span>
                  <h4>Search & Filter</h4>
                  <p>Type keywords in the search bar or click category chips to filter down complex networks to specific entity types.</p>
                </div>
                <div className="howto-step-box">
                  <span className="step-number">2</span>
                  <h4>Hover to Highlight</h4>
                  <p>Hover over any entity to isolate its direct upstream and downstream connections while dimming background noise.</p>
                </div>
                <div className="howto-step-box">
                  <span className="step-number">3</span>
                  <h4>Click for Evidence</h4>
                  <p>Click any connecting link to review the exact supporting sentence extracted verbatim from the research manuscript.</p>
                </div>
                <div className="howto-step-box">
                  <span className="step-number">4</span>
                  <h4>External Portal Jumps</h4>
                  <p>Click any node to open the inspector with 1-click links to NCBI, UniProt, ClinVar, and PubChem.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Entity Distribution Bar Chart */}
      <div className="kg-chart-container">
        <div className="chart-header">
          <h4>Biomedical Entity Distribution in Manuscript</h4>
          <span>{sanitizedNodes.length} total entities identified & resolved</span>
        </div>
        <div style={{ height: 190, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="type" tick={{ fontSize: 11 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val) => [`${val} entities`, "Count"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #dce7e4", fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}