import { useState } from "react";
import { uploadPaper, summarizePaper, getGraph } from "../api/client";
import SummaryView from "../components/SummaryView";
import KnowledgeGraphViewer from "../components/KnowledgeGraphViewer";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [title, setTitle] = useState(null);
  const [graph, setGraph] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setSummary(null);
    setGraph(null);

    try {
      const uploaded = await uploadPaper(file);
      if (uploaded.error) {
        setError(uploaded.error);
        setLoading(false);
        return;
      }
      setTitle(uploaded.title);

      const summarized = await summarizePaper(uploaded.id);
      setSummary(summarized.summary);

      const graphResult = await getGraph(uploaded.id);
      setGraph(graphResult);
    } catch (err) {
      setError("Something went wrong. Check that the backend server is running.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <h1>Biomedical Paper Summarizer</h1>
      <p>Upload a research paper PDF to get an automatic summary and knowledge graph.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "1rem" }}>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" disabled={loading || !file}>
          {loading ? "Processing..." : "Upload & Analyze"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {title && !error && (
        <p style={{ marginTop: "1rem" }}>
          <strong>{title}</strong> uploaded successfully.
        </p>
      )}

      <SummaryView summary={summary} />
      <KnowledgeGraphViewer graph={graph} />
    </div>
  );
}