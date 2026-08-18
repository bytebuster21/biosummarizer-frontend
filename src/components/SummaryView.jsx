import { useMemo, useState } from "react";

const TERM_LINKS = {
  melanoma: "https://www.cancer.gov/types/skin/patient/melanoma-treatment-pdq",
  cancer: "https://www.cancer.gov/about-cancer/understanding/what-is-cancer",
  tumour: "https://www.cancer.gov/publications/dictionaries/cancer-terms/def/tumor",
  tumor: "https://www.cancer.gov/publications/dictionaries/cancer-terms/def/tumor",
  immunotherapy: "https://www.cancer.gov/about-cancer/treatment/types/immunotherapy",
  "clinical trial": "https://clinicaltrials.gov/",
  placebo: "https://www.ncbi.nlm.nih.gov/mesh/?term=placebo",
  biomarker: "https://www.ncbi.nlm.nih.gov/mesh/?term=biomarkers",
  gene: "https://www.genenames.org/",
  protein: "https://www.uniprot.org/",
  metastasis: "https://www.cancer.gov/publications/dictionaries/cancer-terms/def/metastasis",
};

function plainLanguage(text) {
  return text
    .replace(/metastatic/gi, "advanced, spreading")
    .replace(/progression-free survival/gi, "the length of time before the disease got worse")
    .replace(/immunotherapy/gi, "a treatment that helps the immune system fight disease")
    .replace(/biomarkers?/gi, "measurable biological signs")
    .replace(/statistically significant/gi, "unlikely to be due to chance");
}

function HighlightedText({ text, enabled }) {
  const pieces = useMemo(() => {
    const keys = Object.keys(TERM_LINKS).sort((a, b) => b.length - a.length).join("|");
    return text.split(new RegExp(`(${keys})`, "gi"));
  }, [text]);
  return pieces.map((piece, index) => {
    const url = TERM_LINKS[piece.toLowerCase()];
    if (!enabled || !url) return <span key={index}>{piece}</span>;
    return <a className="term-link" key={index} href={url} target="_blank" rel="noreferrer" title={`Learn more about ${piece}`}>{piece}<sup>↗</sup></a>;
  });
}

export default function SummaryView({ summary, loading }) {
  const [mode, setMode] = useState("plain");
  const [highlightTerms, setHighlightTerms] = useState(true);
  if (loading) return <div className="summary-loading"><i className="spinner" /><p>Building a clear summary from the paper</p><span>Identifying study design, results, and key biomedical entities.</span></div>;
  if (!summary) return null;
  const shownSummary = mode === "plain" ? plainLanguage(summary) : summary;
  return <div className="summary-view"><div className="summary-top"><div><h3>Paper summary</h3><p>{mode === "plain" ? "A clearer explanation for any reader" : "Scientific language from the source paper"}</p></div><button className={`keyword-toggle ${highlightTerms ? "enabled" : ""}`} onClick={() => setHighlightTerms(!highlightTerms)}><i /> Keywords</button></div><div className="mode-switch" role="tablist"><button className={mode === "plain" ? "active" : ""} onClick={() => setMode("plain")}>Plain language</button><button className={mode === "technical" ? "active" : ""} onClick={() => setMode("technical")}>Technical language</button></div><p className="summary-text"><HighlightedText text={shownSummary} enabled={highlightTerms} /></p>{highlightTerms && <div className="term-hint"><span>Highlighted terms open trusted sources</span><a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noreferrer">Search PubMed ↗</a></div>}</div>;
}
