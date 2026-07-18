export default function SummaryView({ summary }) {
  if (!summary) return <p>No summary yet.</p>;

  return (
    <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px", marginTop: "1rem" }}>
      <h3>Summary</h3>
      <p>{summary}</p>
    </div>
  );
}