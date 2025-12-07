// frontend/src/components/Chatbot.jsx
import React, { useEffect, useRef, useState } from "react";

const CHAT_PROXY = process.env.REACT_APP_CHAT_PROXY || "/api/chatbot"; // proxy to backend

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_history")) || [];
    } catch {
      return [];
    }
  });
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  // Example context to send with every message:
  const context = {
    userId: window.__USER_ID__ || process.env.REACT_APP_USER_ID || "guest",
    cart: window.__CART__ || [],
    storeId: window.__STORE_ID__ || "online",
    locale: navigator.language || "en-US",
  };

  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = { from: "user", text: trimmed, at: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setSending(true);

    try {
      const res = await fetch(CHAT_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed, context }),
      });

      const payload = await res.json();

      // payload might be { reply: "text" } or { messages: ["a","b"] }
      if (payload.reply) {
        setMessages((m) => [...m, { from: "agent", text: payload.reply, at: new Date().toISOString() }]);
      } else if (Array.isArray(payload.messages)) {
        setMessages((m) => [...m, ...payload.messages.map(t => ({ from: "agent", text: t, at: new Date().toISOString() }))]);
      } else if (payload.error) {
        setMessages((m) => [...m, { from: "agent", text: "Agent error: " + payload.error, at: new Date().toISOString() }]);
      } else {
        setMessages((m) => [...m, { from: "agent", text: "No reply from agent.", at: new Date().toISOString() }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { from: "agent", text: "Network error — can't reach chat service.", at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating button */}
      <div
        onClick={() => setOpen(s => !s)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#0ea5e9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          cursor: "pointer",
          zIndex: 9999
        }}
        title="Chat with Sales Agent"
      >
        <span style={{ fontSize: 26 }}>💬</span>
      </div>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 100,
          right: 20,
          width: 360,
          height: 520,
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(2,6,23,0.2)",
          display: "flex",
          flexDirection: "column",
          zIndex: 9999
        }}>
          <div style={{ padding: 12, background: "#0369a1", color: "#fff", fontWeight: 600 }}>
            Retail Sales Agent
            <button onClick={() => setOpen(false)} style={{ float: "right", background: "transparent", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f8fafc" }}>
            {messages.length === 0 && <div style={{ color: "#6b7280" }}>Hi — I'm the Sales Agent. Ask about products, deals, or reserve in-store.</div>}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                <div style={{
                  maxWidth: "78%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: m.from === "user" ? "#0369a1" : "#ffffff",
                  color: m.from === "user" ? "#fff" : "#111827",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  border: m.from === "agent" ? "1px solid #e6eef6" : "none"
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div style={{ padding: 10, borderTop: "1px solid #e6eef6", display: "flex", gap: 8 }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message and press Enter"
              style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #d1d5db", minHeight: 40, maxHeight: 120, resize: "none" }}
            />
            <button onClick={sendMessage} disabled={sending} style={{ padding: "8px 12px", background: "#0369a1", color: "#fff", border: "none", borderRadius: 8 }}>
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
