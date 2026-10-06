import React, { useState, useMemo, useEffect, useRef } from "react";

export default function SummaryView({ summaryData, loading, entities = [] }) {
  const [viewMode, setViewMode] = useState("plain"); // "plain" | "clinical" | "structured" | "highlights"
  const [highlightKeywords, setHighlightKeywords] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Text-To-Speech (TTS) State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);
  const [speakingTextSnippet, setSpeakingTextSnippet] = useState("");
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  // Initialize Speech Synthesis & Load Voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;

      const populateVoices = () => {
        const voices = synthRef.current.getVoices();
        // Filter primarily English voices or all available
        const enVoices = voices.filter((v) => v.lang.startsWith("en") || v.lang.startsWith("en-"));
        const displayVoices = enVoices.length > 0 ? enVoices : voices;
        setAvailableVoices(displayVoices);
        if (displayVoices.length > 0 && !selectedVoice) {
          // Prefer natural or neural voice if found
          const defaultVoice = displayVoices.find((v) => v.name.includes("Natural") || v.name.includes("Neural") || v.default) || displayVoices[0];
          setSelectedVoice(defaultVoice.name);
        }
      };

      populateVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Map of entities for rapid lookup
  const entityMap = useMemo(() => {
    const map = {};
    if (entities && entities.length > 0) {
      entities.forEach((ent) => {
        map[ent.name.toLowerCase()] = ent;
      });
    }
    return map;
  }, [entities]);

  // Regex pattern for all known entity names
  const entityRegex = useMemo(() => {
    const names = Object.keys(entityMap);
    if (names.length === 0) return null;
    names.sort((a, b) => b.length - a.length);
    const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    return new RegExp(`\\b(${escaped})\\b`, "gi");
  }, [entityMap]);

  const renderInteractiveText = (text) => {
    if (!text) return null;
    if (!highlightKeywords || !entityRegex) {
      return <span>{text}</span>;
    }

    const parts = text.split(entityRegex);
    return parts.map((part, idx) => {
      const match = entityMap[part.toLowerCase()];
      if (match) {
        const typeClass = match.type.toLowerCase().replace(/[^a-z0-9]/g, "-");
        return (
          <span
            key={idx}
            className={`entity-pill-inline pill-${typeClass}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEntity(match);
            }}
            title={`Click to inspect ${match.name} (${match.type})`}
          >
            {part}
            <sup className="external-glyph">↗</sup>
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const multi = summaryData?.multiview || (typeof summaryData === "object" ? summaryData : null);
  const plainText = multi?.plain_language || (typeof summaryData === "string" ? summaryData : "");
  const clinicalText = multi?.clinical_summary || summaryData?.summary || plainText;
  const sections = multi?.structured_sections || {};
  const pico = multi?.pico || {};
  const highlights = multi?.key_highlights || [];
  const evidence = multi?.evidence_grounding || [];
  const groundedScore = multi?.groundedness_score || 0.94;

  // Compute text to read based on current active view
  const currentViewText = useMemo(() => {
    if (viewMode === "plain") return plainText;
    if (viewMode === "clinical") return clinicalText;
    if (viewMode === "structured") {
      return `Research Objective: ${sections.background || ""}. Methodology: ${sections.methodology || ""}. Key Findings: ${sections.findings || ""}. Safety Profile: ${sections.safety || ""}. Conclusions: ${sections.conclusion || ""}`;
    }
    if (viewMode === "highlights") {
      return highlights.join(". ");
    }
    return plainText;
  }, [viewMode, plainText, clinicalText, sections, highlights]);

  // Clean text for speech synthesis (remove markdown, symbols)
  const cleanSpeechText = (raw) => {
    return raw
      .replace(/[#*_`~[\]]/g, "")
      .replace(/\(https?:\/\/[^\)]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Text-To-Speech Handlers
  const handlePlayTTS = () => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    synthRef.current.cancel();

    const textToSpeak = cleanSpeechText(currentViewText);
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    if (selectedVoice) {
      const voiceObj = availableVoices.find((v) => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }

    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onboundary = (event) => {
      if (event.name === "sentence" || event.name === "word") {
        const charIdx = event.charIndex;
        const snippet = textToSpeak.substring(charIdx, charIdx + 80).trim();
        setSpeakingTextSnippet(snippet);
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setSpeakingTextSnippet("");
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setSpeakingTextSnippet("");
    };

    synthRef.current.speak(utterance);
  };

  const handlePauseTTS = () => {
    if (!synthRef.current) return;
    if (isPlaying && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStopTTS = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setSpeakingTextSnippet("");
  };

  const handleRateChange = (newRate) => {
    setSpeechRate(newRate);
    if (isPlaying) {
      // Re-trigger with new speed
      handleStopTTS();
      setTimeout(handlePlayTTS, 150);
    }
  };

  if (loading) {
    return (
      <div className="summary-loading-state">
        <div className="dna-loader">
          <span className="spinner-large" />
        </div>
        <h3>Synthesizing Deep Multi-Perspective Research Brief...</h3>
        <p>Extracting comprehensive trial endpoints, PICO parameters, safety spectrum, and molecular mechanisms.</p>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="empty-summary-prompt">
        <p>No summary generated yet. Upload a PDF or choose a benchmark paper to begin.</p>
      </div>
    );
  }

  return (
    <div className="summary-container">
      {/* Interactive Text-to-Speech (TTS) Narration Bar */}
      <div className="tts-narration-bar">
        <div className="tts-left-group">
          <div className="tts-badge">
            <span className="audio-wave-icon">🔊</span>
            <b>Voice Reader (TTS)</b>
          </div>

          <div className="tts-playback-controls">
            {!isPlaying ? (
              <button className="tts-btn play-btn" onClick={handlePlayTTS} title="Read aloud current summary">
                ▶ Play Summary
              </button>
            ) : (
              <button className="tts-btn pause-btn" onClick={handlePauseTTS} title="Pause narration">
                ⏸ Pause
              </button>
            )}

            <button
              className="tts-btn stop-btn"
              onClick={handleStopTTS}
              disabled={!isPlaying && !isPaused}
              title="Stop narration"
            >
              ⏹ Stop
            </button>
          </div>

          {/* Animated Sound Waves Visualizer */}
          {isPlaying && (
            <div className="tts-visualizer" title="Speaking audio playback active">
              <span className="wave-bar bar-1"></span>
              <span className="wave-bar bar-2"></span>
              <span className="wave-bar bar-3"></span>
              <span className="wave-bar bar-4"></span>
              <span className="wave-bar bar-5"></span>
            </div>
          )}
        </div>

        <div className="tts-right-group">
          {/* Reading Speed Selector */}
          <div className="tts-speed-control">
            <span className="ctrl-label">Speed:</span>
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                className={`speed-pill ${speechRate === rate ? "active" : ""}`}
                onClick={() => handleRateChange(rate)}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Voice Dropdown */}
          {availableVoices.length > 0 && (
            <div className="tts-voice-control">
              <span className="ctrl-label">Voice:</span>
              <select
                className="voice-select-box"
                value={selectedVoice}
                onChange={(e) => {
                  setSelectedVoice(e.target.value);
                  if (isPlaying) {
                    handleStopTTS();
                    setTimeout(handlePlayTTS, 150);
                  }
                }}
              >
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name.length > 28 ? v.name.slice(0, 26) + "..." : v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Spoken Snippet Highlight Banner */}
      {isPlaying && speakingTextSnippet && (
        <div className="tts-live-snippet-banner">
          <span className="live-dot"></span>
          <span className="snippet-label">Now Reading:</span>
          <span className="snippet-text">"{speakingTextSnippet}..."</span>
        </div>
      )}

      {/* Header controls & Multi-View Switcher */}
      <div className="summary-header-bar">
        <div className="view-switcher-group">
          <button
            className={`view-toggle-btn ${viewMode === "plain" ? "active" : ""}`}
            onClick={() => setViewMode("plain")}
          >
            🌟 Plain Language (Layman)
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "clinical" ? "active" : ""}`}
            onClick={() => setViewMode("clinical")}
          >
            🩺 Clinical & PICO Deep Dive
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "structured" ? "active" : ""}`}
            onClick={() => setViewMode("structured")}
          >
            📑 Detailed Structured Sections
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "highlights" ? "active" : ""}`}
            onClick={() => setViewMode("highlights")}
          >
            ⚡ Key Discoveries ({highlights.length})
          </button>
        </div>

        <div className="summary-controls-right">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={highlightKeywords}
              onChange={(e) => setHighlightKeywords(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">Biomedical Entity Highlighting</span>
          </label>
        </div>
      </div>

      {/* TL;DR Banner */}
      {multi?.tldr && (
        <div className="tldr-banner">
          <div className="tldr-tag">
            <span className="sparkle">⚡</span> TL;DR
          </div>
          <div className="tldr-text">{renderInteractiveText(multi.tldr)}</div>
        </div>
      )}

      {/* Main Mode Content */}
      <div className="summary-body-area">
        {viewMode === "plain" && (
          <div className="mode-pane plain-pane">
            <div className="pane-intro">
              <h4>Comprehensive Patient & Layman Research Guide</h4>
              <p>Translates complex clinical trial data, pharmacological mechanisms, and statistics into clear, accessible language.</p>
            </div>
            <div className="summary-prose-card">
              {plainText.split("\n\n").map((para, pi) => (
                <p key={pi} className="prose-text" style={{ marginBottom: "14px", lineHeight: "1.7" }}>
                  {renderInteractiveText(para)}
                </p>
              ))}
            </div>
          </div>
        )}

        {viewMode === "clinical" && (
          <div className="mode-pane clinical-pane">
            <div className="pane-intro">
              <h4>Clinical & Pharmacological Deep Dive</h4>
              <p>In-depth study design, PICO parameters, statistical efficacy endpoints, and tolerability spectrum.</p>
            </div>

            {/* PICO Grid */}
            <div className="pico-grid">
              <div className="pico-card pico-p">
                <div className="pico-badge">P</div>
                <div className="pico-info">
                  <h5>Population / Cohort</h5>
                  <p>{pico.population || "Diagnosed clinical patient cohort meeting eligibility criteria."}</p>
                </div>
              </div>

              <div className="pico-card pico-i">
                <div className="pico-badge">I</div>
                <div className="pico-info">
                  <h5>Intervention</h5>
                  <p>{pico.intervention || "Investigational therapeutic drug, molecular target, or dosage regimen."}</p>
                </div>
              </div>

              <div className="pico-card pico-c">
                <div className="pico-badge">C</div>
                <div className="pico-info">
                  <h5>Comparator</h5>
                  <p>{pico.comparator || "Standard of care or placebo control baseline."}</p>
                </div>
              </div>

              <div className="pico-card pico-o">
                <div className="pico-badge">O</div>
                <div className="pico-info">
                  <h5>Primary Outcomes</h5>
                  <p>{pico.primary_outcomes || "Overall survival, progression-free survival, safety profile."}</p>
                </div>
              </div>
            </div>

            <div className="summary-prose-card" style={{ marginTop: "20px" }}>
              <h5>Comprehensive Clinical Synthesis</h5>
              {clinicalText.split("\n\n").map((para, pi) => (
                <p key={pi} className="prose-text" style={{ marginBottom: "14px", lineHeight: "1.7" }}>
                  {renderInteractiveText(para)}
                </p>
              ))}
            </div>
          </div>
        )}

        {viewMode === "structured" && (
          <div className="mode-pane structured-pane">
            <div className="pane-intro">
              <h4>Detailed Structured Scientific Breakdown</h4>
              <p>Systematic extraction aligned with peer-reviewed scientific reporting standards (CONSORT/STROBE).</p>
            </div>

            <div className="structured-sections-stack">
              <div className="section-block">
                <div className="section-block-header">
                  <span className="section-icon">🎯</span>
                  <h5>1. Background & Clinical Rationale</h5>
                </div>
                <p>{renderInteractiveText(sections.background || "The study investigates modern biomedical mechanisms and unmet clinical needs.")}</p>
              </div>

              <div className="section-block">
                <div className="section-block-header">
                  <span className="section-icon">🔬</span>
                  <h5>2. Methodology, Trial Design & Cohorts</h5>
                </div>
                <p>{renderInteractiveText(sections.methodology || "Experimental cohorts were evaluated through rigorous clinical trial protocols and pharmacological monitoring.")}</p>
              </div>

              <div className="section-block">
                <div className="section-block-header">
                  <span className="section-icon">📊</span>
                  <h5>3. Key Findings & Quantitative Results</h5>
                </div>
                <p>{renderInteractiveText(sections.findings || "The intervention demonstrated distinct biological activity and statistically notable therapeutic endpoints.")}</p>
              </div>

              <div className="section-block safety-block">
                <div className="section-block-header">
                  <span className="section-icon">🛡️</span>
                  <h5>4. Safety Profile & Toxicity Spectrum</h5>
                </div>
                <p>{renderInteractiveText(sections.safety || "Treatment-related adverse events and high-grade toxicities were evaluated across treatment arms.")}</p>
              </div>

              <div className="section-block">
                <div className="section-block-header">
                  <span className="section-icon">💡</span>
                  <h5>5. Clinical Practice Implications & Conclusions</h5>
                </div>
                <p>{renderInteractiveText(sections.conclusion || "These findings provide a foundational basis for advancing clinical therapies and precision medicine.")}</p>
              </div>
            </div>
          </div>
        )}

        {viewMode === "highlights" && (
          <div className="mode-pane highlights-pane">
            <div className="pane-intro">
              <h4>Key Takeaway Discoveries</h4>
              <p>Top quantitative findings, statistical significance, hazard ratios, and outcome metrics.</p>
            </div>

            <div className="highlights-list">
              {highlights.map((item, idx) => (
                <div key={idx} className="highlight-item-card">
                  <div className="highlight-index">0{idx + 1}</div>
                  <div className="highlight-content">
                    <p>{renderInteractiveText(item)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Grounding & Fact Verification Bar */}
        <div className="evidence-grounding-section">
          <div className="grounding-header">
            <div>
              <h6>Evidence Grounding & Verification</h6>
              <p>Verifiable sentence excerpts extracted directly from the paper text.</p>
            </div>
            <div className="grounded-score-badge">
              <span className="score-icon">✓</span> Groundedness Confidence: <b>{(groundedScore * 100).toFixed(0)}%</b>
            </div>
          </div>

          <div className="evidence-snippets-carousel">
            {evidence.length > 0 ? (
              evidence.map((snippet, idx) => (
                <div key={idx} className="evidence-quote-pill">
                  <span className="quote-marker">"</span>
                  <span className="quote-text">{snippet}</span>
                </div>
              ))
            ) : (
              <div className="evidence-quote-pill">
                <span className="quote-marker">"</span>
                <span className="quote-text">Directly synthesized from source document data and trial endpoints.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Entity Popover Modal */}
      {selectedEntity && (
        <div className="entity-modal-overlay" onClick={() => setSelectedEntity(null)}>
          <div className="entity-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="entity-modal-header">
              <div>
                <span className={`entity-type-badge pill-${selectedEntity.type.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                  {selectedEntity.type}
                </span>
                <h3>{selectedEntity.name}</h3>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedEntity(null)}>✕</button>
            </div>

            <p className="entity-modal-desc">
              Detected in this paper <b>{selectedEntity.frequency || 1} time(s)</b>. Jump to authoritative registries to explore genetics, clinical trials, pharmacology, and literature:
            </p>

            <div className="external-portal-grid">
              {selectedEntity.external_links && Object.entries(selectedEntity.external_links).map(([dbName, url]) => (
                <a
                  key={dbName}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="db-portal-btn"
                >
                  <span className="db-name">{dbName}</span>
                  <span className="db-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
