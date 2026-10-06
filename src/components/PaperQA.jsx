import React, { useState, useRef, useEffect } from "react";
import { askPaperQuestion } from "../api/client";

const SUGGESTED_PROMPTS = [
  "What was the primary clinical endpoint?",
  "What were the key statistical findings and hazard ratios?",
  "What adverse events or grade 3/4 toxicities were reported?",
  "What was the sample size and patient cohort criteria?",
  "What did the authors conclude and what are the implications?",
  "Which specific gene mutations, biomarkers, or mechanisms were evaluated?",
  "Summarize the main contribution and clinical significance.",
];

export default function PaperQA({ paperId, paperTitle }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hello! I am your AI Biomedical Research Assistant for "${paperTitle || "this paper"}". Powered by hybrid Retrieval-Augmented Generation (RAG) & LLM reasoning, I can answer any question regarding clinical endpoints, statistical metrics, cohort criteria, molecular mechanisms, safety profiles, or future practice implications.`,
      model: "BioLens RAG Engine",
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
        model: res.model_used || "BioLens RAG Engine",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I encountered an error retrieving answers from the paper text. Please check the backend connection and try again.",
          model: "Error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: `Chat reset. Ask me any new question about "${paperTitle || "this paper"}".`,
        model: "BioLens RAG Engine",
      },
    ]);
  };

  return (
    <div className="qa-workspace">
      <div className="qa-header">
        <div>
          <h3>Interactive Document Q&A</h3>
          <p>Semantic passage retrieval (RAG) and grounded multi-turn biomedical reasoning.</p>
        </div>
        <div className="qa-header-actions">
          <div className="qa-badge">
            <span className="live-sparkle">✦</span> RAG & LLM Grounded
          </div>
          <button className="clear-chat-btn" onClick={handleClearChat} title="Clear chat history">
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="qa-suggested-prompts">
        <span className="prompt-label">Quick Inquiries:</span>
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
              {msg.role === "assistant" && msg.model && (
                <div className="bubble-model-tag">
                  <span>⚡ {msg.model}</span>
                </div>
              )}

              <div className="bubble-text">
                {msg.text.split("\n\n").map((para, pi) => (
                  <p key={pi} style={{ marginBottom: pi < msg.text.split("\n\n").length - 1 ? "10px" : "0" }}>
                    {para}
                  </p>
                ))}
              </div>

              {msg.highlight && (
                <div className="bubble-evidence-highlight">
                  <span className="evidence-icon">🎯</span>
                  <div>
                    <b>Key Grounded Evidence Passage:</b>
                    <p>"{msg.highlight}"</p>
                  </div>
                </div>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <details className="bubble-citations">
                  <summary>View {msg.citations.length} Verified Context Citations</summary>
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
              <div className="typing-text">Retrieving semantic passages & synthesizing answer...</div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
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
          placeholder="Ask any question about this paper (e.g. What were the hazard ratios? What are the limitations?)..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !inputQuestion.trim()}>
          {loading ? "Reasoning..." : "Ask Paper →"}
        </button>
      </form>
    </div>
  );
}
