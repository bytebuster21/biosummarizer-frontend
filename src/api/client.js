const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function uploadPaper(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/papers/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload paper.");
  return res.json();
}

export async function getSamplePapers() {
  const res = await fetch(`${API_URL}/api/papers/samples`);
  if (!res.ok) throw new Error("Failed to load sample papers.");
  return res.json();
}

export async function loadSamplePaper(sampleId) {
  const res = await fetch(`${API_URL}/api/papers/samples/load/${sampleId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to load selected benchmark paper.");
  return res.json();
}

export async function getPaper(id) {
  const res = await fetch(`${API_URL}/api/papers/${id}`);
  if (!res.ok) throw new Error("Failed to fetch paper details.");
  return res.json();
}

export async function listPapers() {
  const res = await fetch(`${API_URL}/api/papers/`);
  if (!res.ok) throw new Error("Failed to list papers.");
  return res.json();
}

export async function summarizePaper(id) {
  const res = await fetch(`${API_URL}/api/summarize/${id}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to summarize paper.");
  return res.json();
}

export async function getGraph(id) {
  const res = await fetch(`${API_URL}/api/graph/${id}`);
  if (!res.ok) throw new Error("Failed to fetch knowledge graph.");
  return res.json();
}

export async function getRelatedPapers(id) {
  const res = await fetch(`${API_URL}/api/literature/related/${id}`);
  if (!res.ok) throw new Error("Failed to fetch related literature.");
  return res.json();
}

export async function searchPubMed(query) {
  const res = await fetch(`${API_URL}/api/literature/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("PubMed search query failed.");
  return res.json();
}

export async function askPaperQuestion(id, question) {
  const res = await fetch(`${API_URL}/api/papers/${id}/qa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Failed to get answer for paper query.");
  return res.json();
}