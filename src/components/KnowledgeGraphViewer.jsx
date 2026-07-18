import { useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TYPE_COLORS = {
  DISEASE: "#e63946",
  CHEMICAL: "#457b9d",
};

export default function KnowledgeGraphViewer({ graph }) {
  const graphData = useMemo(() => {
    if (!graph || !graph.nodes) return { nodes: [], links: [] };

    return {
      nodes: graph.nodes.map((n) => ({
        id: n.id,
        name: n.label,
        type: n.type,
      })),
      links: (graph.edges || []).map((e) => ({
        source: e.source,
        target: e.target,
        relation: e.relation_type,
      })),
    };
  }, [graph]);

  const typeCounts = useMemo(() => {
    if (!graph || !graph.nodes) return [];
    const counts = {};
    graph.nodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [graph]);

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return <p>No graph data yet.</p>;
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>Knowledge Graph</h3>
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", height: "400px" }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node) => TYPE_COLORS[node.type] || "#999"}
          linkLabel="relation"
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle = TYPE_COLORS[node.type] || "#999";
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.fillStyle = "#000";
            ctx.fillText(label, node.x + 8, node.y + 3);
          }}
          linkColor={() => "#ccc"}
          linkDirectionalArrowLength={4}
        />
      </div>

      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", fontSize: "0.9rem" }}>
        <span><span style={{ color: TYPE_COLORS.DISEASE }}>●</span> Disease</span>
        <span><span style={{ color: TYPE_COLORS.CHEMICAL }}>●</span> Chemical / Drug</span>
      </div>

      <h4 style={{ marginTop: "2rem" }}>Entity Type Distribution</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={typeCounts}>
          <XAxis dataKey="type" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#457b9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}