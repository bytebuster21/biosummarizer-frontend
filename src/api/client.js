const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function uploadPaper(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/papers/upload`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function getPaper(id) {
  const res = await fetch(`${API_URL}/api/papers/${id}`);
  return res.json();
}

export async function listPapers() {
  const res = await fetch(`${API_URL}/api/papers/`);
  return res.json();
}

export async function summarizePaper(id) {
  const res = await fetch(`${API_URL}/api/summarize/${id}`, { method: "POST" });
  return res.json();
}

export async function getGraph(id) {
  const res = await fetch(`${API_URL}/api/graph/${id}`);
  return res.json();
}