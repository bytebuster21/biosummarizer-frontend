export default function KnowledgeGraphViewer({ graph }) {
  if (!graph || !graph.nodes) return <p>No graph data yet.</p>;

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3>Knowledge Graph</h3>
      <ul>
        {graph.nodes.map((node) => (
          <li key={node.id}>
            {node.label} ({node.type})
          </li>
        ))}
      </ul>
      {/* Replace this list with a real graph viz library later,
          e.g. react-force-graph or vis-network */}
    </div>
  );
}