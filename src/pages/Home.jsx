import { useState } from "react";
import UploadForm from "../components/UploadForm";

export default function Home() {
  const [uploadedPaper, setUploadedPaper] = useState(null);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Upload a Research Paper</h1>
      <UploadForm onUploaded={setUploadedPaper} />
      {uploadedPaper && (
        <p>Uploaded: {uploadedPaper.title} (ID: {uploadedPaper.id})</p>
      )}
    </div>
  );
}