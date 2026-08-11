import { MessageCircle, RotateCcw, Send, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { askChatbot, createAndAssignTicket } from "../../lib/api.js";

// After this many messages from the customer, the "Connect me with an agent"
// option appears in the chat and stays there - see ESCALATE_AFTER usage below.
const ESCALATE_AFTER = 3;

/* ============================================================
   Chat widget — backed by the real RAG chatbot (POST /api/notes/ask).
   ------------------------------------------------------------
   Fixed circular toggle, bottom-right, on every authenticated
   page (mounted once in App.jsx). Retrieval + grounding happen
   entirely server-side (ChatbotService: Ollama embeddings +
   in-memory vector search + Groq chat completion) - this widget
   just sends the question and renders whatever comes back.
   ============================================================ */

const COLORS = {
  panel: "#1B242C", panelHi: "#242F39", red: "#C63527", redDark: "#7C2529",
  white: "#FFFFFF", grey: "#D0D3D4", greyDim: "#78808A", line: "rgba(208,211,212,0.16)",
};
const FONT = `"Segoe UI", "Segoe UI Semibold", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;

const GREETING = { from: "bot", text: "Hi! I'm the SupportDesk assistant. How can I help today?" };

export default function ChatWidget() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  // Identifies this chat thread to the backend's per-session memory (see
  // ChatbotController#ask). Regenerated on "New chat" so the assistant
  // genuinely forgets - reloading/reopening the widget otherwise keeps the
  // same id, matching what the visible transcript below suggests.
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());

  // Counts the customer's own messages this conversation. Once it hits
  // ESCALATE_AFTER, the "Connect me with an agent" button appears and - per
  // product decision - just stays there; not clicking it is the refusal, so
  // there's no separate dismiss/decline action.
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const showAgentOption = userMessageCount >= ESCALATE_AFTER && !escalated;

  const handleNewChat = () => {
    if (sending) return;
    setMessages([GREETING]);
    setConversationId(crypto.randomUUID());
    setUserMessageCount(0);
    setEscalating(false);
    setEscalated(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setDraft("");
    setMessages((prev) => [...prev, { from: "user", text }]);
    setUserMessageCount((prev) => prev + 1);
    setSending(true);
    try {
      const answer = await askChatbot(token, text, conversationId);
      setMessages((prev) => [...prev, { from: "bot", text: answer.trim() || "I don't have an answer for that." }]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: "bot", text: `⚠️ ${err.message}`, error: true }]);
    } finally {
      setSending(false);
    }
  };

  const handleConnectToAgent = async () => {
    if (escalating || escalated) return;
    setEscalating(true);
    try {
      const firstQuestion = messages.find((m) => m.from === "user")?.text ?? "Chatbot escalation";
      const title = firstQuestion.length > 60 ? `${firstQuestion.slice(0, 57)}...` : firstQuestion;
      const description = messages
        .map((m) => `${m.from === "user" ? "You" : "Assistant"}: ${m.text}`)
        .join("\n");

      const ticket = await createAndAssignTicket(token, {
        customerId: user.userId,
        title,
        description,
        priority: "MEDIUM",
      });

      setEscalated(true);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: ticket.assignedAgentId
            ? `You're connected — ticket ${ticket.ticketNumber} has been created and assigned to a support agent. They'll be in touch shortly.`
            : `Ticket ${ticket.ticketNumber} has been created. No agents are available right now, but one will pick it up shortly.`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: "bot", text: `⚠️ ${err.message}`, error: true }]);
    } finally {
      setEscalating(false);
    }
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
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={handleNewChat} disabled={sending} aria-label="Start new chat" title="Start new chat" style={{
                background: "none", border: "none", color: COLORS.grey, cursor: sending ? "not-allowed" : "pointer", padding: 4,
                opacity: sending ? 0.5 : 1,
              }}>
                <RotateCcw size={15} />
              </button>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: COLORS.grey, cursor: "pointer", padding: 4 }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.from === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%", padding: "9px 12px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.45,
                background: m.from === "user" ? COLORS.red : COLORS.panelHi,
                color: m.error ? "#E2685C" : COLORS.white,
                borderBottomRightRadius: m.from === "user" ? 3 : 12,
                borderBottomLeftRadius: m.from === "bot" ? 3 : 12,
                whiteSpace: "pre-wrap",
              }}>
                {m.text}
              </div>
            ))}
            {sending && (
              <div style={{
                alignSelf: "flex-start", padding: "9px 12px", borderRadius: 12, borderBottomLeftRadius: 3,
                background: COLORS.panelHi, color: COLORS.greyDim, fontSize: 13.5,
              }}>
                Thinking…
              </div>
            )}
          </div>

          {showAgentOption && (
            <div style={{ padding: "0 16px 12px" }}>
              <button
                type="button"
                onClick={handleConnectToAgent}
                disabled={escalating}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: COLORS.panelHi, color: COLORS.white, border: `1px solid ${COLORS.line}`,
                  borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 700, fontFamily: FONT,
                  cursor: escalating ? "not-allowed" : "pointer", opacity: escalating ? 0.6 : 1,
                }}
              >
                <UserPlus size={15} />
                {escalating ? "Connecting…" : "Connect me with an agent"}
              </button>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${COLORS.line}` }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              disabled={sending}
              style={{
                flex: 1, background: "#101820", border: `1px solid ${COLORS.line}`, borderRadius: 999,
                padding: "9px 14px", color: COLORS.white, fontFamily: FONT, fontSize: 13.5, outline: "none",
                opacity: sending ? 0.6 : 1,
              }}
            />
            <button type="submit" aria-label="Send message" disabled={sending || !draft.trim()} style={{
              width: 36, height: 36, flexShrink: 0, borderRadius: "50%", border: "none",
              background: COLORS.red, color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: sending || !draft.trim() ? "not-allowed" : "pointer",
              opacity: sending || !draft.trim() ? 0.6 : 1,
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
