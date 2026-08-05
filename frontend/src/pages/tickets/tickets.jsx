// pages/tickets/tickets.jsx
//
// Support Tickets page — Epic E (E1 create, E2 list/filter, E3 assign, E4 escalate).
// Self-contained, matches the same pattern as pages/products/catalog.jsx.
//
// Backend contract (Spring):
//   GET  /api/tickets?status=&priority=&q=&page=&size=&sort=
//   POST /api/tickets                      body: { subject, description, priority, customerName, orderNumber? }
//   POST /api/tickets/{id}/assign          body: { agentId }
//   POST /api/tickets/{id}/escalate        body: { reason }
//
// MOCK_MODE seeds local data so this page renders standalone; swap in real
// fetch() calls per the contract above once the backend is wired in.

import React, { useState } from "react";

const MOCK_MODE = true;

const COLORS = {
    ink: "#101820",
    panel: "#1B242C",
    panelHi: "#242F39",
    red: "#C63527",
    redDark: "#7C2529",
    blue: "#171C8F",
    white: "#FFFFFF",
    grey: "#D0D3D4",
    greyDim: "#78808A",
    green: "#31B456",
    yellow: "#F8CE46",
    line: "rgba(208,211,212,0.16)",
};

const MOCK_TICKETS = [
    { id: "TKT-1042", subject: "Order not delivered after 2 weeks", customer: "Mona Adel", priority: "HIGH", status: "OPEN", assignedAgent: null, escalationReason: null },
    { id: "TKT-1041", subject: "Refund not received", customer: "Omar Khaled", priority: "HIGH", status: "IN_PROGRESS", assignedAgent: "Sara", escalationReason: null },
    { id: "TKT-1039", subject: "Wrong item shipped", customer: "Laila Samir", priority: "MEDIUM", status: "ESCALATED", assignedAgent: "Karim", escalationReason: "Customer requested a manager, third contact this week." },
    { id: "TKT-1037", subject: "Can't reset password", customer: "Ahmed Nabil", priority: "LOW", status: "OPEN", assignedAgent: null, escalationReason: null },
    { id: "TKT-1030", subject: "Product missing accessory", customer: "Hassan Ali", priority: "LOW", status: "CLOSED", assignedAgent: "Nourhan", escalationReason: null },
];

const AGENTS = ["Sara", "Karim", "Youssef", "Nourhan"];

const STATUS_META = {
    OPEN: { label: "Open", color: COLORS.green },
    IN_PROGRESS: { label: "In Progress", color: COLORS.yellow },
    ESCALATED: { label: "Escalated", color: COLORS.red },
    CLOSED: { label: "Closed", color: COLORS.greyDim },
};
const PRIORITY_META = {
    LOW: { label: "Low", color: COLORS.grey },
    MEDIUM: { label: "Medium", color: COLORS.yellow },
    HIGH: { label: "High", color: COLORS.red },
};

function Badge({ text, color }) {
    return (
        <span
            style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 9px",
                borderRadius: 20,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                color,
                background: color + "26",
            }}
        >
      {text}
    </span>
    );
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState(MOCK_MODE ? MOCK_TICKETS : []);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(null); // { type: 'assign'|'escalate', ticketId }
    const [agentChoice, setAgentChoice] = useState(AGENTS[0]);
    const [reasonInput, setReasonInput] = useState("");
    const [newTicketOpen, setNewTicketOpen] = useState(false);
    const [form, setForm] = useState({ subject: "", description: "", priority: "MEDIUM", customer: "", order: "" });

    const filtered = tickets.filter((t) => {
        const s = search.toLowerCase();
        return (
            (statusFilter === "ALL" || t.status === statusFilter) &&
            (priorityFilter === "ALL" || t.priority === priorityFilter) &&
            (!s || t.id.toLowerCase().includes(s) || t.subject.toLowerCase().includes(s) || t.customer.toLowerCase().includes(s))
        );
    });

    const counts = {
        total: tickets.length,
        OPEN: tickets.filter((t) => t.status === "OPEN").length,
        IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
        ESCALATED: tickets.filter((t) => t.status === "ESCALATED").length,
        CLOSED: tickets.filter((t) => t.status === "CLOSED").length,
    };

    function createTicket() {
        if (!form.subject || !form.description || !form.customer) return;
        const id = "TKT-" + (1050 + tickets.length);
        // TODO: replace with POST /api/tickets
        setTickets([{ id, subject: form.subject, customer: form.customer, priority: form.priority, status: "OPEN", assignedAgent: null, escalationReason: null }, ...tickets]);
        setForm({ subject: "", description: "", priority: "MEDIUM", customer: "", order: "" });
        setNewTicketOpen(false);
    }

    function confirmAssign() {
        // TODO: replace with POST /api/tickets/{id}/assign { agentId: agentChoice }
        setTickets(tickets.map((t) => (t.id === modal.ticketId ? { ...t, assignedAgent: agentChoice, status: "IN_PROGRESS" } : t)));
        setModal(null);
    }

    function confirmEscalate() {
        if (!reasonInput.trim()) return;
        // TODO: replace with POST /api/tickets/{id}/escalate { reason: reasonInput }
        setTickets(tickets.map((t) => (t.id === modal.ticketId ? { ...t, status: "ESCALATED", escalationReason: reasonInput } : t)));
        setReasonInput("");
        setModal(null);
    }

    const inputStyle = {
        width: "100%",
        background: COLORS.panel,
        border: `1px solid ${COLORS.line}`,
        color: COLORS.white,
        borderRadius: 7,
        padding: 10,
        fontSize: 13.5,
        marginBottom: 14,
    };
    const btn = (bg) => ({ background: bg, color: COLORS.white, border: "none", borderRadius: 7, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" });

    return (
        <div style={{ background: COLORS.ink, color: COLORS.white, minHeight: "100%", padding: 28, fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>Support Tickets</h2>
                <button style={btn(COLORS.red)} onClick={() => setNewTicketOpen(true)}>+ New Ticket</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 }}>
                {[
                    ["Total Tickets", counts.total, COLORS.white],
                    ["Open", counts.OPEN, COLORS.green],
                    ["In Progress", counts.IN_PROGRESS, COLORS.yellow],
                    ["Escalated", counts.ESCALATED, COLORS.red],
                    ["Closed", counts.CLOSED, COLORS.greyDim],
                ].map(([label, value, color]) => (
                    <div key={label} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: 12, color: COLORS.greyDim, textTransform: "uppercase" }}>{label}</div>
                    </div>
                ))}
            </div>

            <input
                placeholder="Search ticket number, subject, or customer"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, marginBottom: 20 }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 24 }}>
                <div>
                    <h4 style={{ color: COLORS.greyDim, fontSize: 12, textTransform: "uppercase" }}>Status</h4>
                    {["ALL", "OPEN", "IN_PROGRESS", "ESCALATED", "CLOSED"].map((s) => (
                        <div
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", color: statusFilter === s ? COLORS.red : COLORS.grey, background: statusFilter === s ? COLORS.red + "1f" : "transparent" }}
                        >
                            {s === "ALL" ? "All" : STATUS_META[s].label}
                        </div>
                    ))}
                    <h4 style={{ color: COLORS.greyDim, fontSize: 12, textTransform: "uppercase", marginTop: 20 }}>Priority</h4>
                    {["ALL", "LOW", "MEDIUM", "HIGH"].map((p) => (
                        <div
                            key={p}
                            onClick={() => setPriorityFilter(p)}
                            style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", color: priorityFilter === p ? COLORS.red : COLORS.grey, background: priorityFilter === p ? COLORS.red + "1f" : "transparent" }}
                        >
                            {p === "ALL" ? "All" : PRIORITY_META[p].label}
                        </div>
                    ))}
                </div>

                <div>
                    <div style={{ color: COLORS.greyDim, fontSize: 13, marginBottom: 10 }}>{filtered.length} ticket(s)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                        {filtered.map((t) => (
                            <div key={t.id} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontFamily: "monospace", fontSize: 12, color: COLORS.greyDim, background: COLORS.panelHi, padding: "2px 7px", borderRadius: 4 }}>{t.id}</span>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <Badge text={PRIORITY_META[t.priority].label} color={PRIORITY_META[t.priority].color} />
                                        <Badge text={STATUS_META[t.status].label} color={STATUS_META[t.status].color} />
                                    </div>
                                </div>
                                <h4 style={{ margin: "10px 0 4px" }}>{t.subject}</h4>
                                <div style={{ color: COLORS.greyDim, fontSize: 13 }}>{t.customer}</div>
                                {t.escalationReason && (
                                    <div style={{ marginTop: 8, fontSize: 12.5, color: COLORS.grey, background: COLORS.panelHi, borderLeft: `2px solid ${COLORS.red}`, padding: "8px 10px", borderRadius: 4 }}>
                                        "{t.escalationReason}"
                                    </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, borderTop: `1px solid ${COLORS.line}`, paddingTop: 10 }}>
                                    <div style={{ fontSize: 13 }}>{t.assignedAgent ? `Assigned to ${t.assignedAgent}` : <span style={{ color: COLORS.greyDim, fontStyle: "italic" }}>Unassigned</span>}</div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            style={btn(COLORS.blue)}
                                            disabled={t.status === "CLOSED" || t.status === "ESCALATED"}
                                            onClick={() => setModal({ type: "assign", ticketId: t.id })}
                                        >
                                            Assign
                                        </button>
                                        <button
                                            style={btn(COLORS.red)}
                                            disabled={t.status === "CLOSED"}
                                            onClick={() => setModal({ type: "escalate", ticketId: t.id })}
                                        >
                                            Escalate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* New ticket modal */}
            {newTicketOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: COLORS.panelHi, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 24, width: 380 }}>
                        <h3 style={{ marginTop: 0 }}>New ticket</h3>
                        <label style={{ fontSize: 12.5, color: COLORS.grey }}>Subject</label>
                        <input style={inputStyle} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                        <label style={{ fontSize: 12.5, color: COLORS.grey }}>Description</label>
                        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        <label style={{ fontSize: 12.5, color: COLORS.grey }}>Priority</label>
                        <select style={inputStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                        <label style={{ fontSize: 12.5, color: COLORS.grey }}>Customer name</label>
                        <input style={inputStyle} value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button style={{ ...btn(COLORS.panel), border: `1px solid ${COLORS.line}` }} onClick={() => setNewTicketOpen(false)}>Cancel</button>
                            <button style={btn(COLORS.red)} onClick={createTicket}>Create ticket</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign / Escalate modal */}
            {modal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: COLORS.panelHi, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 24, width: 360 }}>
                        {modal.type === "assign" ? (
                            <>
                                <h3 style={{ marginTop: 0 }}>Assign ticket</h3>
                                <p style={{ color: COLORS.greyDim, fontSize: 13 }}>POST /api/tickets/{modal.ticketId}/assign</p>
                                <label style={{ fontSize: 12.5, color: COLORS.grey }}>Assign to agent</label>
                                <select style={inputStyle} value={agentChoice} onChange={(e) => setAgentChoice(e.target.value)}>
                                    {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                                </select>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                    <button style={{ ...btn(COLORS.panel), border: `1px solid ${COLORS.line}` }} onClick={() => setModal(null)}>Cancel</button>
                                    <button style={btn(COLORS.blue)} onClick={confirmAssign}>Confirm assign</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 style={{ marginTop: 0 }}>Escalate ticket</h3>
                                <p style={{ color: COLORS.greyDim, fontSize: 13 }}>POST /api/tickets/{modal.ticketId}/escalate</p>
                                <label style={{ fontSize: 12.5, color: COLORS.grey }}>Reason</label>
                                <textarea style={{ ...inputStyle, minHeight: 80 }} value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} />
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                    <button style={{ ...btn(COLORS.panel), border: `1px solid ${COLORS.line}` }} onClick={() => setModal(null)}>Cancel</button>
                                    <button style={btn(COLORS.red)} onClick={confirmEscalate}>Confirm escalate</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}