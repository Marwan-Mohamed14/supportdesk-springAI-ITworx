import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";

/* ============================================================
   Chat widget — frontend shell only.
   ------------------------------------------------------------
   Fixed circular toggle, bottom-right, on every authenticated
   page (mounted once in App.jsx). Sending a message just echoes
   a placeholder locally — there is no backend call here yet.
   TODO: wire up to the real chatbot/assistant backend once it
   exists; swap handleSend's local echo for a real API call.
   ============================================================ */

const COLORS = {
  panel: "#1B242C", panelHi: "#242F39", red: "#C63527", redDark: "#7C2529",
  white: "#FFFFFF", grey: "#D0D3D4", greyDim: "#78808A", line: "rgba(208,211,212,0.16)",
};
const FONT = `"Segoe UI", "Segoe UI Semibold", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;

const GREETING = { from: "bot", text: "Hi! I'm the SupportDesk assistant. How can I help today?" };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [draft, setDraft] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((prev) => [
      ...prev,
      { from: "user", text },
      { from: "bot", text: "🚧 Chatbot logic isn't wired up yet — this is just the frontend shell for now." },
    ]);
  };

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24, width: 340, maxWidth: "calc(100vw - 32px)", height: 440,
          background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,.45)", display: "flex", flexDirection: "column",
          zIndex: 90, overflow: "hidden", fontFamily: FONT,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${COLORS.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#31B456" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.white }}>SupportDesk Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: COLORS.grey, cursor: "pointer", padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.from === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%", padding: "9px 12px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.45,
                background: m.from === "user" ? COLORS.red : COLORS.panelHi,
                color: COLORS.white,
                borderBottomRightRadius: m.from === "user" ? 3 : 12,
                borderBottomLeftRadius: m.from === "bot" ? 3 : 12,
              }}>
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${COLORS.line}` }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              style={{
                flex: 1, background: "#101820", border: `1px solid ${COLORS.line}`, borderRadius: 999,
                padding: "9px 14px", color: COLORS.white, fontFamily: FONT, fontSize: 13.5, outline: "none",
              }}
            />
            <button type="submit" aria-label="Send message" style={{
              width: 36, height: 36, flexShrink: 0, borderRadius: "50%", border: "none",
              background: COLORS.red, color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        style={{
          position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
          border: "none", background: open ? COLORS.redDark : COLORS.red, color: COLORS.white,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          boxShadow: "0 10px 26px rgba(198,53,39,.45)", zIndex: 91, transition: "background 150ms",
        }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
