import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
    PackageSearch,
    Ticket as TicketIcon,
    UserPlus,
    Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useOrders } from "../../context/OrdersContext.jsx";
import { useProducts } from "../../context/ProductsContext.jsx";
import * as api from "../../lib/api.js";

const COLORS = {
    ink: "#101820",
    panel: "#1B242C",
    panelHi: "#242F39",
    red: "#C63527",
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

const STATUS_META = {
    OPEN: { label: "Open", color: COLORS.grey },
    IN_PROGRESS: { label: "In progress", color: COLORS.green },
    ESCALATED: { label: "Escalated", color: COLORS.yellow },
    CLOSED: { label: "Closed", color: COLORS.greyDim },
};

const QUEUES = [
    { key: "MINE", label: "My tickets" },
    { key: "UNASSIGNED", label: "Unassigned" },
];

const btn = (bg) => ({ background: bg, color: COLORS.white, border: "none", borderRadius: 7, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" });

function StatCard({ label, value, color, icon: Icon }) {
    return (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: COLORS.greyDim, textTransform: "uppercase" }}>{label}</span>
                {Icon && <Icon size={15} color={color || COLORS.greyDim} />}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: color || COLORS.white }}>{value}</div>
        </div>
    );
}

function Badge({ text, color }) {
    return (
        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", color, background: color + "26", flexShrink: 0 }}>
            {text}
        </span>
    );
}

function TicketRow({ t, selected, onSelect }) {
    return (
        <div
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(); }}
            style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                padding: "10px 8px", borderRadius: 8, cursor: "pointer",
                background: selected ? COLORS.panelHi : "transparent",
                border: `1px solid ${selected ? COLORS.line : "transparent"}`,
            }}
        >
            <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11.5, color: COLORS.greyDim, background: COLORS.panelHi, padding: "2px 6px", borderRadius: 4 }}>{t.ticketNumber}</span>
                    <span style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.greyDim, marginTop: 3 }}>{t.customerName || "Unknown customer"}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {t.status && <Badge text={STATUS_META[t.status]?.label || t.status} color={STATUS_META[t.status]?.color || COLORS.grey} />}
                {t.priority && <Badge text={PRIORITY_META[t.priority]?.label || t.priority} color={PRIORITY_META[t.priority]?.color || COLORS.grey} />}
            </div>
        </div>
    );
}

function TicketWorkspace({ ticket, isMine, busy, actionError, onAssignToMe, onEscalate, onClose }) {
    if (!ticket) {
        return (
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 24, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.greyDim, fontSize: 13, minHeight: 260 }}>
                Select a ticket from either queue to work it.
            </div>
        );
    }

    const canAssignToMe = !isMine && ticket.status !== "CLOSED" && ticket.status !== "ESCALATED";
    const canEscalate = ticket.status !== "CLOSED" && ticket.status !== "ESCALATED";
    const canClose = ticket.status !== "CLOSED";

    return (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: COLORS.greyDim, background: COLORS.panelHi, padding: "2px 7px", borderRadius: 4 }}>{ticket.ticketNumber}</span>
                        {ticket.status && <Badge text={STATUS_META[ticket.status]?.label || ticket.status} color={STATUS_META[ticket.status]?.color || COLORS.grey} />}
                        {ticket.priority && <Badge text={PRIORITY_META[ticket.priority]?.label || ticket.priority} color={PRIORITY_META[ticket.priority]?.color || COLORS.grey} />}
                    </div>
                    <h3 style={{ margin: 0, fontSize: 17 }}>{ticket.title}</h3>
                    <div style={{ fontSize: 12.5, color: COLORS.greyDim, marginTop: 4 }}>
                        {ticket.customerName || "Unknown customer"}
                        {ticket.assignedAgentName ? ` · assigned to ${ticket.assignedAgentName}` : " · unassigned"}
                    </div>
                </div>
            </div>

            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: COLORS.grey, whiteSpace: "pre-wrap" }}>
                {ticket.description}
            </p>

            {ticket.status === "ESCALATED" && ticket.escalationReason && (
                <div style={{ background: "rgba(248,206,70,0.1)", border: `1px solid ${COLORS.yellow}`, borderRadius: 8, padding: "10px 12px", fontSize: 12.5 }}>
                    <strong>Escalated:</strong> {ticket.escalationReason}
                </div>
            )}

            {actionError && (
                <div style={{ color: "#E2685C", fontSize: 12.5 }}>{actionError}</div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: `1px solid ${COLORS.line}`, paddingTop: 14 }}>
                <button
                    style={{ ...btn(COLORS.panelHi), border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 6, opacity: canAssignToMe ? 1 : 0.4, cursor: canAssignToMe ? "pointer" : "not-allowed" }}
                    disabled={!canAssignToMe || !!busy}
                    onClick={onAssignToMe}
                >
                    <UserPlus size={13} /> {busy === "assign" ? "Assigning…" : "Assign to me"}
                </button>
                <button
                    style={{ ...btn(COLORS.panelHi), border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 6, opacity: canEscalate ? 1 : 0.4, cursor: canEscalate ? "pointer" : "not-allowed" }}
                    disabled={!canEscalate || !!busy}
                    onClick={onEscalate}
                >
                    <ArrowUpRight size={13} /> {busy === "escalate" ? "Escalating…" : "Escalate"}
                </button>
                <button
                    style={{ ...btn(COLORS.green), display: "flex", alignItems: "center", gap: 6, opacity: canClose ? 1 : 0.4, cursor: canClose ? "pointer" : "not-allowed" }}
                    disabled={!canClose || !!busy}
                    onClick={onClose}
                >
                    <CheckCircle2 size={13} /> {busy === "close" ? "Closing…" : "Mark resolved"}
                </button>
            </div>
        </div>
    );
}

export default function AgentDashboard() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const { orders } = useOrders();
    const { products } = useProducts();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [queue, setQueue] = useState("MINE");
    const [selectedId, setSelectedId] = useState(null);
    const [busy, setBusy] = useState(null);
    const [actionError, setActionError] = useState(null);

    const refresh = () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        return api
            .listTickets(token, { size: 100 })
            .then((page) => setTickets(page.content))
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const myTickets = useMemo(
        () => tickets.filter((t) => t.assignedAgentId && t.assignedAgentId === user?.userId),
        [tickets, user]
    );
    const unassigned = useMemo(() => tickets.filter((t) => !t.assignedAgentId), [tickets]);
    const urgentCount = useMemo(
        () => tickets.filter((t) => t.priority === "URGENT" || t.priority === "HIGH").length,
        [tickets]
    );
    const lowStock = useMemo(
        () => products.filter((p) => p.active !== false && (p.stock ?? 0) <= 5),
        [products]
    );

    const visibleTickets = queue === "MINE" ? myTickets : unassigned;
    const selected = tickets.find((t) => t.id === selectedId) || null;

    function selectTicket(id) {
        setSelectedId(id);
        setActionError(null);
    }

    function updateTicketInPlace(updated) {
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }

    async function handleAssignToMe() {
        if (!selected) return;
        setBusy("assign");
        setActionError(null);
        try {
            const updated = await api.assignTicket(token, selected.id, user.userId);
            updateTicketInPlace(updated);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setBusy(null);
        }
    }

    async function handleEscalate() {
        if (!selected) return;
        const reason = window.prompt("Reason for escalating this ticket?");
        if (!reason || !reason.trim()) return;
        setBusy("escalate");
        setActionError(null);
        try {
            const updated = await api.escalateTicket(token, selected.id, reason.trim());
            updateTicketInPlace(updated);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setBusy(null);
        }
    }

    async function handleClose() {
        if (!selected) return;
        setBusy("close");
        setActionError(null);
        try {
            const updated = await api.closeTicket(token, selected.id);
            updateTicketInPlace(updated);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setBusy(null);
        }
    }

    return (
        <div style={{ background: COLORS.ink, color: COLORS.white, minHeight: "100%", padding: 28, fontFamily: "sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>Welcome back, {user?.name?.split(" ")[0] || "there"}</h2>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.greyDim }}>
                    Here's the state of the ticket queue and a few things worth a glance.
                </p>
            </div>

            {error && (
                <div style={{ background: "rgba(198,53,39,0.1)", border: `1px solid ${COLORS.red}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <span>Couldn't load tickets — {error.message}</span>
                    <button onClick={refresh} style={{ ...btn(COLORS.panelHi), border: `1px solid ${COLORS.line}` }}>Retry</button>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                <StatCard label="My tickets" value={loading ? "…" : myTickets.length} icon={TicketIcon} color={COLORS.white} />
                <StatCard label="Unassigned" value={loading ? "…" : unassigned.length} icon={Users} color={COLORS.yellow} />
                <StatCard label="High + Urgent" value={loading ? "…" : urgentCount} icon={AlertTriangle} color={COLORS.red} />
                <StatCard label="Low stock items" value={lowStock.length} icon={PackageSearch} color={COLORS.yellow} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                        {QUEUES.map((q) => (
                            <button
                                key={q.key}
                                onClick={() => setQueue(q.key)}
                                style={{
                                    ...btn(queue === q.key ? COLORS.red : "transparent"),
                                    border: queue === q.key ? "none" : `1px solid ${COLORS.line}`,
                                    flex: 1,
                                }}
                            >
                                {q.label} ({q.key === "MINE" ? myTickets.length : unassigned.length})
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 420, overflowY: "auto" }}>
                        {loading && <div style={{ color: COLORS.greyDim, fontSize: 13, padding: "10px 8px" }}>Loading…</div>}
                        {!loading && visibleTickets.length === 0 && (
                            <div style={{ color: COLORS.greyDim, fontSize: 13, padding: "10px 8px" }}>
                                {queue === "MINE" ? "Nothing assigned to you right now." : "Every ticket has an owner. Nice."}
                            </div>
                        )}
                        {!loading && visibleTickets.map((t) => (
                            <TicketRow key={t.id} t={t} selected={t.id === selectedId} onSelect={() => selectTicket(t.id)} />
                        ))}
                    </div>

                    <button style={{ ...btn("transparent"), border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }} onClick={() => navigate("/tickets")}>
                        Open full ticket queue <ArrowRight size={13} />
                    </button>
                </div>

                <TicketWorkspace
                    ticket={selected}
                    isMine={!!selected && selected.assignedAgentId === user?.userId}
                    busy={busy}
                    actionError={actionError}
                    onAssignToMe={handleAssignToMe}
                    onEscalate={handleEscalate}
                    onClose={handleClose}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0, fontSize: 14.5 }}>Orders you've looked up</h4>
                        <button style={{ ...btn("transparent"), border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 5 }} onClick={() => navigate("/orders")}>View orders <ArrowRight size={13} /></button>
                    </div>
                    <p style={{ margin: "-4px 0 4px", fontSize: 12, color: COLORS.greyDim }}>
                        There's no "all orders" endpoint yet, so this is only orders this browser has created or looked up — same as the Orders page.
                    </p>
                    {orders.length === 0 && <div style={{ color: COLORS.greyDim, fontSize: 13 }}>No tracked orders yet.</div>}
                    {orders.slice(0, 5).map((o) => (
                        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13.5 }}>
                            <span>{o.orderNumber}</span>
                            <span style={{ color: COLORS.greyDim }}>{o.status}</span>
                        </div>
                    ))}
                </div>

                <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0, fontSize: 14.5 }}>Low stock</h4>
                        <button style={{ ...btn("transparent"), border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 5 }} onClick={() => navigate("/products")}>View catalog <ArrowRight size={13} /></button>
                    </div>
                    {lowStock.length === 0 && <div style={{ color: COLORS.greyDim, fontSize: 13 }}>Nothing running low.</div>}
                    {lowStock.slice(0, 5).map((p) => (
                        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13.5 }}>
                            <span>{p.name}</span>
                            <span style={{ color: (p.stock ?? 0) === 0 ? COLORS.red : COLORS.yellow, fontWeight: 700 }}>{p.stock ?? 0} left</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
