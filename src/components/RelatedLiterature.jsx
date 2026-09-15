import React, { useState, useEffect } from "react";
import { getRelatedPapers, searchPubMed } from "../api/client";

export default function RelatedLiterature({ paperId }) {
  const [papers, setPapers] = useState([]);
  const [queryTerms, setQueryTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (paperId) {
      setLoading(true);
      setError(null);
      getRelatedPapers(paperId)
        .then((res) => {
          setPapers(res.related_papers || []);
          setQueryTerms(res.query_terms || []);
        })
        .catch((err) => {
          console.error("Literature fetch error:", err);
          setError("Unable to query PubMed for related papers.");
        })
        .finally(() => setLoading(false));
    }
  }, [paperId]);

  const handleCustomSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);
    try {
      const res = await searchPubMed(searchQuery);
      setPapers(res.results || []);
    } catch (err) {
      console.error(err);
      setError("PubMed search encountered an issue.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="related-literature-workspace">
      <div className="literature-header-bar">
        <div>
          <h3>Live PubMed Related Literature</h3>
          <p>
            Connected to NCBI E-Utilities API. Discovers peer-reviewed articles matching extracted biomedical entities.
          </p>
        </div>

        <form className="pubmed-search-form" onSubmit={handleCustomSearch}>
          <input
            type="text"
            placeholder="Search PubMed (e.g. Pembrolizumab, KRAS G12D)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" disabled={searching}>
            {searching ? "Searching..." : "Search PubMed ↗"}
          </button>
        </form>
      </div>

      {queryTerms.length > 0 && (
        <div className="matched-terms-banner">
          <span className="terms-label">Matched Entity Keywords:</span>
          <div className="terms-pill-group">
            {queryTerms.map((term, i) => (
              <span key={i} className="term-badge">
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <div className="literature-error-banner">{error}</div>}

      {loading ? (
        <div className="literature-loading-state">
          <span className="spinner-large" />
          <p>Querying NCBI Entrez E-Utilities database...</p>
        </div>
      ) : papers.length > 0 ? (
        <div className="literature-cards-grid">
          {papers.map((paper, idx) => (
            <div key={paper.pmid || idx} className="literature-card">
              <div className="literature-card-top">
                <span className="paper-journal-tag">{paper.journal || "Biomedical Journal"}</span>
                <span className="paper-date-tag">{paper.pub_date || "Recent"}</span>
              </div>

              <h4 className="paper-card-title">
                <a href={paper.pubmed_url} target="_blank" rel="noreferrer">
                  {paper.title} <sup>↗</sup>
                </a>
              </h4>

              <p className="paper-card-authors">{paper.authors}</p>

              <div className="paper-card-footer">
                <div className="paper-ids">
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="pmid-pill"
                  >
                    PMID: {paper.pmid}
                  </a>
                  {paper.doi && (
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="doi-pill"
                    >
                      DOI: {paper.doi}
                    </a>
                  )}
                </div>

                <a
                  href={paper.pubmed_url}
                  target="_blank"
                  rel="noreferrer"
                  className="view-pubmed-btn"
                >
                  Open in PubMed ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-literature-prompt">
          <p>No related papers returned from PubMed for this query.</p>
        </div>
      )}
    </div>
  );
}
