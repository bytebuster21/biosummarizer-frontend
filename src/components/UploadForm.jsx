import { useState } from "react";
import { uploadPaper } from "../api/client";

export default function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const result = await uploadPaper(file);
    setLoading(false);
    if (onUploaded) onUploaded(result);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Upload Paper"}
      </button>
    </form>
  );
}