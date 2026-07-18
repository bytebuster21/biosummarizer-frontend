import { useEffect, useState } from "react";
import { listPapers } from "../api/client";

export default function Dashboard() {
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    listPapers().then(setPapers);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>All Papers</h1>
      <ul>
        {papers.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </div>
  );
}