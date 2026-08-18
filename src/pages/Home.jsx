import { useState } from "react";
import { getGraph, summarizePaper, uploadPaper } from "../api/client";
import SummaryView from "../components/SummaryView";
import KnowledgeGraphViewer from "../components/KnowledgeGraphViewer";

export default function Home() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [graph, setGraph] = useState(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const selectFile = (files) => { const selected = files?.[0]; if (selected) { setFile(selected); setSummary(null); setGraph(null); setError(""); } };
  const summarize = async (event) => {
    event.preventDefault(); if (!file) return;
    setLoading(true); setError(""); setSummary(null); setGraph(null);
    try {
      const uploaded = await uploadPaper(file);
      if (uploaded.error) throw new Error(uploaded.error);
      setTitle(uploaded.title || file.name.replace(/\.pdf$/i, ""));
      const [summaryResult, graphResult] = await Promise.all([summarizePaper(uploaded.id), getGraph(uploaded.id)]);
      if (summaryResult.error) throw new Error(summaryResult.error);
      setSummary(summaryResult.summary); setGraph(graphResult);
    } catch (err) { setError(err.message || "We could not analyze that paper. Confirm the backend is running and try again."); }
    finally { setLoading(false); }
  };

  return <main className="bio-app">
    <header className="home-nav"><a className="brand" href="#top"><span className="brand-orbit">✦</span><span>Bio<span>Lens</span></span></a><div className="nav-note"><i /> Research intelligence, made readable</div></header>
    <section className="hero" id="top"><div className="eyebrow">BIOMEDICAL PAPER SUMMARIZER</div><h1>Understand every paper.<br /><span>From evidence to insight.</span></h1><p>Upload a research paper to generate a clear summary, highlight the key biomedical terms, and explore the relationships behind the science.</p></section>
    <section className="upload-card"><div className="upload-heading"><div><div className="step">01 · ADD A PAPER</div><h2>Start with a research paper</h2><p>We support biomedical articles, preprints, and clinical trial reports.</p></div><span className="supported">PDF · up to 25 MB</span></div><form onSubmit={summarize}><label className={`drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files); }}><input type="file" accept="application/pdf,.pdf" onChange={(event) => selectFile(event.target.files)} /><span className="upload-glyph">↑</span><strong>{file ? "Paper ready to analyze" : "Drop your paper here"}</strong><small>{file ? file.name : "or click to browse your files"}</small></label><div className="upload-footer"><span className="file-label">{file ? <><b>PDF</b>{file.name}</> : "No paper selected"}</span><button className="summarize-button" disabled={!file || loading}>{loading ? <><i className="spinner" /> Reading and mapping the paper…</> : <>Summarize paper <span>→</span></>}</button></div></form></section>
    {error && <div className="notice error"><b>Analysis failed</b><span>{error}</span></div>}
    {title && !error && <div className="notice success"><b>✓ Paper analyzed</b><span>{title}</span></div>}
    {(loading || summary) && <section className="results"><div className="results-heading"><div><div className="step">02 · YOUR RESEARCH BRIEF</div><h2>{title || "Generating your research brief"}</h2></div><span className="verified"><i /> Grounded in uploaded paper</span></div><div className="results-grid"><div className="result-card summary-card"><SummaryView summary={summary} loading={loading} /></div><div className="result-card graph-card"><div className="graph-intro"><div><h3>Knowledge graph</h3><p>Explore the diseases, chemicals, genes, and concepts found in this paper.</p></div><span className="graph-icon">⌘</span></div>{loading ? <Loading label="Extracting scientific entities…" /> : <KnowledgeGraphViewer graph={graph} />}</div></div></section>}
    <section className="feature-strip"><div><span>01</span><b>Plain language</b><p>Translate complex results into a patient-friendly explanation.</p></div><div><span>02</span><b>Technical detail</b><p>Keep the study design, outcomes, and scientific terminology intact.</p></div><div><span>03</span><b>Connected concepts</b><p>Open trusted external sources directly from highlighted terms.</p></div></section>
  </main>;
}
function Loading({ label }) { return <div className="loading"><i className="spinner" />{label}</div>; }
