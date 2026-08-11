// pages/tickets/tickets.jsx
//
// Support Tickets page, backed by the real backend:
//   GET  /tickets?status=&priority=&page=&size=&sort=
//   POST /tickets/create             body: { customerId, title, description, priority, orderId? }
//   POST /tickets/create-and-assign  same body — also auto-picks an agent (used by ChatWidget)
//
// Real backend gaps still shaping what this page can do (not worked around
// with invented data — just left out, and called out here):
//
//  1. The list endpoint isn't scoped to the caller — it returns every
//     ticket in the system to any authenticated user, and there's no
//     free-text search param (the search box below filters client-side
//     over the page already fetched, it doesn't call anything new).
//
// (Create/list used to return an older DTO with no `id`/`status`, which is
// why Assign/Escalate weren't wired here and the list had no status badge —
// both endpoints now return the same DTO assign/escalate use, so the
// "Assigned to you" panel below can rely on `status`.)

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useOrders } from "../../context/OrdersContext.jsx";
import * as api from "../../lib/api.js";

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

const PRIORITY_META = {
    LOW: { label: "Low", color: COLORS.grey },
    MEDIUM: { label: "Medium", color: COLORS.yellow },
    HIGH: { label: "High", color: COLORS.red },
    URGENT: { label: "Urgent", color: "#E2685C" },
};
const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "ESCALATED", "CLOSED"];
const PRIORITY_OPTIONS = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUS_META = {
    OPEN: { label: "Open", color: COLORS.grey },
    IN_PROGRESS: { label: "In progress", color: COLORS.green },
    ESCALATED: { label: "Escalated", color: COLORS.yellow },
    CLOSED: { label: "Closed", color: COLORS.greyDim },
};

function Badge({ text, color }) {
    return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.3, color, background: color + "26" }}>
            {text}
        </span>
    );
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
    boxSizing: "border-box",
};
const btn = (bg) => ({ background: bg, color: COLORS.white, border: "none", borderRadius: 7, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" });

export default function TicketsPage() {
    const { token, user, role } = useAuth();
    const { orders } = useOrders();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [newTicketOpen, setNewTicketOpen] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", orderId: "" });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const refresh = async () => {
        setLoading(true);
        setListError(null);
        try {
            const page = await api.listTickets(token, {
                status: statusFilter === "ALL" ? undefined : statusFilter,
                priority: priorityFilter === "ALL" ? undefined : priorityFilter,
                size: 50,
            });
            setTickets(page.content);
        } catch (err) {
            setListError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, statusFilter, priorityFilter]);

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        if (!s) return tickets;
        return tickets.filter((t) =>
            t.ticketNumber.toLowerCase().includes(s) ||
            t.title.toLowerCase().includes(s) ||
            (t.description || "").toLowerCase().includes(s)
        );
    }, [tickets, search]);

    const priorityCounts = useMemo(() => {
        const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
        tickets.forEach((t) => { if (t.priority && counts[t.priority] !== undefined) counts[t.priority] += 1; });
        return counts;
    }, [tickets]);

    // Informational only — no accept/decline here, tickets assigned via the
    // chatbot's auto-assign flow (or manual assign) land straight in
    // IN_PROGRESS, so there's nothing for the agent to act on but see it.
    const assignedToMe = useMemo(
        () => (role === "AGENT" ? tickets.filter((t) => t.assignedAgentId === user?.userId) : []),
        [tickets, role, user]
    );

    async function createTicket() {
        if (!form.title.trim() || !form.description.trim()) {
            setFormError("Title and description are required.");
            return;
        }
        setSubmitting(true);
        setFormError("");
        try {
            const created = await api.createTicket(token, {
                customerId: user.userId,
                title: form.title.trim(),
                description: form.description.trim(),
                priority: form.priority,
                orderId: form.orderId || undefined,
            });
            setTickets((prev) => [created, ...prev]);
            setForm({ title: "", description: "", priority: "MEDIUM", orderId: "" });
            setNewTicketOpen(false);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ background: COLORS.ink, color: COLORS.white, minHeight: "100%", padding: 28, fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h2 style={{ margin: 0 }}>Support Tickets</h2>
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.greyDim }}>
                        Every ticket in the system — the list endpoint isn't scoped to your account.
                    </p>
                </div>
                <button style={btn(COLORS.red)} onClick={() => setNewTicketOpen(true)}>+ New Ticket</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 }}>
                {[
                    ["Total (this page)", tickets.length, COLORS.white],
                    ["Low", priorityCounts.LOW, PRIORITY_META.LOW.color],
                    ["Medium", priorityCounts.MEDIUM, PRIORITY_META.MEDIUM.color],
                    ["High", priorityCounts.HIGH, PRIORITY_META.HIGH.color],
                    ["Urgent", priorityCounts.URGENT, PRIORITY_META.URGENT.color],
                ].map(([label, value, color]) => (
                    <div key={label} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: 12, color: COLORS.greyDim, textTransform: "uppercase" }}>{label}</div>
                    </div>
                ))}
            </div>

            {role === "AGENT" && assignedToMe.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: 12, color: COLORS.greyDim, textTransform: "uppercase" }}>
                        Assigned to you ({assignedToMe.length})
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                        {assignedToMe.map((t) => (
                            <div key={t.id} style={{ background: COLORS.panel, border: `1px solid ${COLORS.red}`, borderRadius: 10, padding: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                    <span style={{ fontFamily: "monospace", fontSize: 12, color: COLORS.greyDim, background: COLORS.panelHi, padding: "2px 7px", borderRadius: 4 }}>{t.ticketNumber}</span>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {t.status && <Badge text={STATUS_META[t.status]?.label || t.status} color={STATUS_META[t.status]?.color || COLORS.grey} />}
                                        {t.priority && <Badge text={PRIORITY_META[t.priority]?.label || t.priority} color={PRIORITY_META[t.priority]?.color || COLORS.grey} />}
                                    </div>
                                </div>
                                <h4 style={{ margin: "10px 0 4px" }}>{t.title}</h4>
                                <div style={{ color: COLORS.greyDim, fontSize: 13 }}>{t.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <input
                placeholder="Filter this page by ticket number, title, or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, marginBottom: 20 }}
            />

            {listError && (
                <div style={{ background: "rgba(198,53,39,0.1)", border: `1px solid ${COLORS.red}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <span>Couldn't load tickets — {listError.message}</span>
                    <button onClick={refresh} style={{ ...btn(COLORS.panelHi), border: `1px solid ${COLORS.line}` }}>Retry</button>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 24 }}>
                <div>
                    <h4 style={{ color: COLORS.greyDim, fontSize: 12, textTransform: "uppercase" }}>Status (filter only)</h4>
                    {STATUS_OPTIONS.map((s) => (
                        <div key={s} onClick={() => setStatusFilter(s)}
                            style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", color: statusFilter === s ? COLORS.red : COLORS.grey, background: statusFilter === s ? COLORS.red + "1f" : "transparent" }}>
                            {s === "ALL" ? "All" : s.replace("_", " ")}
                        </div>
                    ))}
                    <h4 style={{ color: COLORS.greyDim, fontSize: 12, textTransform: "uppercase", marginTop: 20 }}>Priority</h4>
                    {PRIORITY_OPTIONS.map((p) => (
                        <div key={p} onClick={() => setPriorityFilter(p)}
                            style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", color: priorityFilter === p ? COLORS.red : COLORS.grey, background: priorityFilter === p ? COLORS.red + "1f" : "transparent" }}>
                            {p === "ALL" ? "All" : PRIORITY_META[p].label}
                        </div>
                    ))}
                </div>

                <div>
                    <div style={{ color: COLORS.greyDim, fontSize: 13, marginBottom: 10 }}>
                        {loading ? "Loading…" : `${filtered.length} ticket(s)`}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                        {filtered.map((t, i) => (
                            <div key={t.ticketNumber || i} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontFamily: "monospace", fontSize: 12, color: COLORS.greyDim, background: COLORS.panelHi, padding: "2px 7px", borderRadius: 4 }}>{t.ticketNumber}</span>
                                    {t.priority && <Badge text={PRIORITY_META[t.priority]?.label || t.priority} color={PRIORITY_META[t.priority]?.color || COLORS.grey} />}
                                </div>
                                <h4 style={{ margin: "10px 0 4px" }}>{t.title}</h4>
                                <div style={{ color: COLORS.greyDim, fontSize: 13 }}>{t.description}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, borderTop: `1px solid ${COLORS.line}`, paddingTop: 10, fontSize: 12.5, color: COLORS.greyDim }}>
                                    <span>{t.assignedAgentId ? "Assigned" : "Unassigned"}</span>
                                    {t.orderId && <span>Order: {t.orderId.slice(0, 8)}…</span>}
                                </div>
                            </div>
                        ))}
                        {!loading && filtered.length === 0 && (
                            <div style={{ color: COLORS.greyDim, fontSize: 13.5, padding: "24px 0" }}>No tickets match this filter.</div>
                        )}
                    </div>
                </div>
            </div>

            {newTicketOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: COLORS.panelHi, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 24, width: 380 }}>
                        <h3 style={{ marginTop: 0 }}>New ticket</h3>
                        <label style={{ fontSize: 12.5, color: COLORS.grey }}>Subject</label>
                        <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        <label style={{ fontSize: 12.5, color: COLORS.grey }}>Description</label>
                        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        <label style={{ fontSize: 12.5, color: COLORS.grey }}>Priority</label>
                        <select style={inputStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                        <label style={{ fontSize: 12.5, color: COLORS.grey }}>Related order (optional)</label>
                        <select style={inputStyle} value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
                            <option value="">No related order</option>
                            {orders.map((o) => (
                                <option key={o.id} value={o.id}>{o.orderNumber}</option>
                            ))}
                        </select>
                        {formError && <div style={{ color: "#E2685C", fontSize: 12.5, marginBottom: 10 }}>{formError}</div>}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button style={{ ...btn(COLORS.panel), border: `1px solid ${COLORS.line}` }} onClick={() => setNewTicketOpen(false)}>Cancel</button>
                            <button style={btn(COLORS.red)} disabled={submitting} onClick={createTicket}>{submitting ? "Creating…" : "Create ticket"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
