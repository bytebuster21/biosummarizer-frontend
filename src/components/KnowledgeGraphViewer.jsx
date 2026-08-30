import React, { useMemo, useState, useRef, useCallback } from "react";
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
};

export default function KnowledgeGraphViewer({ graph, loading }) {
  const fgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState({});
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);

  // Available entity types in this graph
  const availableTypes = useMemo(() => {
    if (!graph || !graph.nodes) return [];
    const set = new Set(graph.nodes.map((n) => n.type));
    return Array.from(set);
  }, [graph]);

  // Filtered graph data
  const filteredData = useMemo(() => {
    if (!graph || !graph.nodes) return { nodes: [], links: [] };

    const activeNodes = graph.nodes.filter((n) => {
      const typeAllowed = typeFilter[n.type] !== false;
      const searchAllowed = !searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase());
      return typeAllowed && searchAllowed;
    });

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));

    const activeLinks = (graph.edges || [])
      .filter((e) => {
        const srcId = typeof e.source === "object" ? e.source.id : e.source;
        const tgtId = typeof e.target === "object" ? e.target.id : e.target;
        return activeNodeIds.has(srcId) && activeNodeIds.has(tgtId);
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
        val: Math.max(4, (n.degree || 1) * 2.5 + (n.frequency || 1)),
      })),
      links: activeLinks,
    };
  }, [graph, typeFilter, searchTerm]);

  // Distribution chart data
  const chartData = useMemo(() => {
    if (!graph || !graph.nodes) return [];
    const counts = {};
    graph.nodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace("_", " "),
      rawType: type,
      count,
      color: TYPE_COLORS[type] || TYPE_COLORS.DEFAULT,
    }));
  }, [graph]);

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
      fgRef.current.zoom(2.5, 600);
    }
  }, []);

  const handleLinkClick = useCallback((link) => {
    setSelectedEdge(link);
    setSelectedNode(null);
  }, []);

  const handleResetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50);
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
        const targetNode = graph.nodes.find((n) => n.id === tgtId);
        if (targetNode) {
          neighbors.push({
            node: targetNode,
            relation: e.relation_type,
            direction: "outgoing",
            evidence: e.evidence || [],
          });
        }
      } else if (tgtId === nid) {
        const sourceNode = graph.nodes.find((n) => n.id === srcId);
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
  }, [selectedNode, graph]);

  if (loading) {
    return (
      <div className="graph-loading-state">
        <span className="spinner-large" />
        <h4>Extracting Semantic Biomedical Relationships...</h4>
        <p>Constructing multi-class entity graph with sentence evidence.</p>
      </div>
    );
  }

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="empty-graph-state">
        <p>No knowledge graph data available yet. Please analyze a paper first.</p>
      </div>
    );
  }

  return (
    <div className="kg-workspace">
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
        </div>

        <div className="kg-actions">
          <button className="kg-btn" onClick={handleResetZoom} title="Fit to Screen">
            ⤢ Reset Zoom
          </button>
          <button
            className={`kg-btn ${showEdgeLabels ? "active" : ""}`}
            onClick={() => setShowEdgeLabels(!showEdgeLabels)}
          >
            🔤 Labels
          </button>
          <button className="kg-btn primary" onClick={handleExportJSON} title="Download Graph JSON">
            ⬇ Export Graph
          </button>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="kg-filter-chips">
        <span className="filter-label">Filter Categories:</span>
        {availableTypes.map((type) => {
          const isOff = typeFilter[type] === false;
          const color = TYPE_COLORS[type] || TYPE_COLORS.DEFAULT;
          return (
            <button
              key={type}
              className={`type-chip ${isOff ? "disabled" : ""}`}
              style={{
                borderColor: color,
                backgroundColor: isOff ? "transparent" : `${color}18`,
                color: isOff ? "#888" : color,
              }}
              onClick={() => toggleTypeFilter(type)}
            >
              <span className="chip-dot" style={{ backgroundColor: color }}></span>
              {type.replace("_", " ")}
            </button>
          );
        })}
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="kg-main-layout">
        <div className="kg-canvas-wrapper">
          <ForceGraph2D
            ref={fgRef}
            graphData={filteredData}
            nodeId="id"
            nodeLabel={(n) => `${n.name} (${n.type}) - Mentions: ${n.frequency || 1}`}
            nodeColor={(node) => TYPE_COLORS[node.type] || TYPE_COLORS.DEFAULT}
            nodeVal="val"
            linkLabel="relation"
            linkColor={(link) => RELATION_COLORS[link.relation] || "#b8c9c6"}
            linkWidth={1.8}
            linkDirectionalArrowLength={5}
            linkDirectionalArrowRelPos={0.85}
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.name;
              const fontSize = Math.max(3.2, 11 / globalScale);
              const nodeColor = TYPE_COLORS[node.type] || TYPE_COLORS.DEFAULT;
              const radius = Math.max(4, Math.min(16, (node.val || 5) * 0.9));

              // Node Circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = nodeColor;
              ctx.shadowColor = nodeColor;
              ctx.shadowBlur = selectedNode?.id === node.id ? 10 : 2;
              ctx.fill();

              // Selection ring
              if (selectedNode?.id === node.id) {
                ctx.lineWidth = 2.5 / globalScale;
                ctx.strokeStyle = "#ffffff";
                ctx.stroke();
              }

              // Text Label
              ctx.shadowBlur = 0;
              ctx.font = `${fontSize}px Inter, sans-serif`;
              ctx.fillStyle = "#1b2d33";
              ctx.fillText(label, node.x + radius + 3, node.y + radius * 0.3);
            }}
          />
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
                  {selectedNode.type}
                </span>
                <h3>{selectedNode.name}</h3>
              </div>
              <button className="inspector-close-btn" onClick={() => setSelectedNode(null)}>
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
              <h4>External Knowledge Portals</h4>
              <p className="section-subtext">Click to query authoritative biomedical registries:</p>
              <div className="external-portal-list">
                {selectedNode.external_links &&
                  Object.entries(selectedNode.external_links).map(([portal, url]) => (
                    <a
                      key={portal}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="portal-link-item"
                    >
                      <span className="portal-name">{portal}</span>
                      <span className="portal-icon">↗</span>
                    </a>
                  ))}
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
                    >
                      <div className="neighbor-rel">
                        <span className="rel-type">{nb.relation}</span>
                        <span className="rel-target">
                          {nb.direction === "outgoing" ? "→" : "←"} {nb.node.name}
                        </span>
                      </div>
                      <span
                        className="neighbor-tag"
                        style={{ color: TYPE_COLORS[nb.node.type] || "#666" }}
                      >
                        {nb.node.type}
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
                <span className="type-tag relation-tag">{selectedEdge.relation}</span>
                <h3>Relationship Details</h3>
              </div>
              <button className="inspector-close-btn" onClick={() => setSelectedEdge(null)}>
                ✕
              </button>
            </div>

            <div className="edge-endpoints-card">
              <div className="endpoint-node">
                <span className="ep-label">Source</span>
                <b>{selectedEdge.source_label || selectedEdge.source}</b>
              </div>
              <div className="rel-arrow-badge">-- {selectedEdge.relation} --&gt;</div>
              <div className="endpoint-node">
                <span className="ep-label">Target</span>
                <b>{selectedEdge.target_label || selectedEdge.target}</b>
              </div>
            </div>

            <div className="inspector-section">
              <h4>Sentence Evidence from Paper</h4>
              {selectedEdge.evidence && selectedEdge.evidence.length > 0 ? (
                selectedEdge.evidence.map((quote, idx) => (
                  <div key={idx} className="edge-evidence-quote">
                    "{quote}"
                  </div>
                ))
              ) : (
                <p className="no-data-text">Extracted via biological pathway and co-occurrence association.</p>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Entity Distribution Bar Chart */}
      <div className="kg-chart-container">
        <div className="chart-header">
          <h4>Biomedical Entity Distribution</h4>
          <span>{graph.nodes.length} total entities identified</span>
        </div>
        <div style={{ height: 180, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="type" tick={{ fontSize: 11 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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