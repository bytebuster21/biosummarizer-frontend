import React, { useState } from "react";
import { askPaperQuestion } from "../api/client";

const SUGGESTED_PROMPTS = [
  "What was the primary clinical endpoint?",
  "What was the sample size and cohort criteria?",
  "What were the key statistical findings and hazard ratios?",
  "What adverse events or toxicities were reported?",
  "Which specific gene mutations or biomarkers were studied?",
];

export default function PaperQA({ paperId, paperTitle }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hello! I am your AI Biomedical Research Assistant for "${paperTitle || "this paper"}". Ask me any question regarding study design, clinical endpoints, patient cohorts, or biomolecular mechanisms.`,
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (q) => {
    const questionText = q || inputQuestion;
    if (!questionText.trim() || loading || !paperId) return;

    const userMsg = { role: "user", text: questionText };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setLoading(true);

    try {
      const res = await askPaperQuestion(paperId, questionText);
      const botMsg = {
        role: "assistant",
        text: res.answer || "No response generated.",
        highlight: res.highlight_sentence,
        citations: res.citations || [],
        confidence: res.confidence,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I encountered an error retrieving answers from the paper text. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qa-workspace">
      <div className="qa-header">
        <div>
          <h3>Interactive Document Q&A</h3>
          <p>Semantic retrieval and grounded reasoning over the full paper text.</p>
        </div>
        <div className="qa-badge">Grounded in Source Text</div>
      </div>

      {/* Suggested Prompts */}
      <div className="qa-suggested-prompts">
        <span className="prompt-label">Quick Prompts:</span>
        <div className="prompt-chips-wrapper">
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              className="prompt-chip-btn"
              onClick={() => handleSubmit(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="qa-chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.role}`}>
            <div className="bubble-avatar">{msg.role === "user" ? "👤" : "🧬"}</div>
            <div className="bubble-body">
              <div className="bubble-text">{msg.text}</div>

              {msg.highlight && (
                <div className="bubble-evidence-highlight">
                  <span className="evidence-icon">🎯</span>
                  <div>
                    <b>Key Grounded Passage:</b>
                    <p>"{msg.highlight}"</p>
                  </div>
                </div>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <details className="bubble-citations">
                  <summary>View {msg.citations.length} Grounded Context Citations</summary>
                  <div className="citations-content">
                    {msg.citations.map((c, ci) => (
                      <div key={ci} className="citation-quote">
                        "{c}"
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {msg.confidence !== undefined && (
                <div className="bubble-confidence">
                  Attribution Confidence: <b>{(msg.confidence * 100).toFixed(0)}%</b>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble assistant">
            <div className="bubble-avatar">🧬</div>
            <div className="bubble-body">
              <div className="chat-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        className="qa-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          type="text"
          placeholder="Ask a question about this paper (e.g. What were the grade 3 toxicities?)..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !inputQuestion.trim()}>
          {loading ? "Searching..." : "Ask Paper →"}
        </button>
      </form>
    </div>
  );
}
