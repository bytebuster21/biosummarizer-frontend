import { useEffect, useState } from "react";
import { getPaper, summarizePaper, getGraph } from "../api/client";
import SummaryView from "../components/SummaryView";
import KnowledgeGraphViewer from "../components/KnowledgeGraphViewer";

export default function PaperDetail({ paperId }) {
  const [paper, setPaper] = useState(null);
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    if (paperId) getPaper(paperId).then(setPaper);
  }, [paperId]);

  const handleSummarize = async () => {
    const result = await summarizePaper(paperId);
    setPaper((prev) => ({ ...prev, summary: result.summary }));
  };

  const handleGenerateGraph = async () => {
    const result = await getGraph(paperId);
    setGraph(result);
  };

  if (!paper) return <p>Loading...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{paper.title}</h1>
      <button onClick={handleSummarize}>Generate Summary</button>
      <button onClick={handleGenerateGraph}>Generate Knowledge Graph</button>
      <SummaryView summary={paper.summary} />
      <KnowledgeGraphViewer graph={graph} />
    </div>
  );
}