

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, PackageSearch, Ticket as TicketIcon, Users } from "lucide-react";
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

function SectionCard({ title, action, children }) {
    return (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: 14.5 }}>{title}</h4>
                {action}
            </div>
            {children}
        </div>
    );
}

function TicketRow({ t }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
            <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11.5, color: COLORS.greyDim, background: COLORS.panelHi, padding: "2px 6px", borderRadius: 4 }}>{t.ticketNumber}</span>
                    <span style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                </div>
            </div>
            {t.priority && (
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", color: PRIORITY_META[t.priority]?.color, background: (PRIORITY_META[t.priority]?.color || COLORS.grey) + "26", flexShrink: 0, marginLeft: 10 }}>
                    {PRIORITY_META[t.priority]?.label || t.priority}
                </span>
            )}
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

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        api
            .listTickets(token, { size: 100 })
            .then((page) => { if (!cancelled) setTickets(page.content); })
            .catch((err) => { if (!cancelled) setError(err); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
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

    return (
        <div style={{ background: COLORS.ink, color: COLORS.white, minHeight: "100%", padding: 28, fontFamily: "sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>Welcome back, {user?.name?.split(" ")[0] || "there"}</h2>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.greyDim }}>
                    Here's the state of the ticket queue and a few things worth a glance.
                </p>
            </div>

            {error && (
                <div style={{ background: "rgba(198,53,39,0.1)", border: `1px solid ${COLORS.red}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13.5 }}>
                    Couldn't load tickets — {error.message}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                <StatCard label="My tickets" value={loading ? "…" : myTickets.length} icon={TicketIcon} color={COLORS.white} />
                <StatCard label="Unassigned" value={loading ? "…" : unassigned.length} icon={Users} color={COLORS.yellow} />
                <StatCard label="High + Urgent" value={loading ? "…" : urgentCount} icon={AlertTriangle} color={COLORS.red} />
                <StatCard label="Low stock items" value={lowStock.length} icon={PackageSearch} color={COLORS.yellow} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <SectionCard
                    title="My tickets"
                    action={<button style={{ ...btn("transparent"), border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 5 }} onClick={() => navigate("/tickets")}>Open queue <ArrowRight size={13} /></button>}
                >
                    {loading && <div style={{ color: COLORS.greyDim, fontSize: 13 }}>Loading…</div>}
                    {!loading && myTickets.length === 0 && (
                        <div style={{ color: COLORS.greyDim, fontSize: 13 }}>Nothing assigned to you right now.</div>
                    )}
                    {!loading && myTickets.slice(0, 5).map((t, i) => <TicketRow key={t.ticketNumber || i} t={t} />)}
                </SectionCard>

                <SectionCard
                    title="Unassigned — needs an owner"
                    action={<button style={{ ...btn("transparent"), border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 5 }} onClick={() => navigate("/tickets")}>Open queue <ArrowRight size={13} /></button>}
                >
                    {loading && <div style={{ color: COLORS.greyDim, fontSize: 13 }}>Loading…</div>}
                    {!loading && unassigned.length === 0 && (
                        <div style={{ color: COLORS.greyDim, fontSize: 13 }}>Every ticket has an owner. Nice.</div>
                    )}
                    {!loading && unassigned.slice(0, 5).map((t, i) => <TicketRow key={t.ticketNumber || i} t={t} />)}
                </SectionCard>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <SectionCard
                    title="Orders you've looked up"
                    action={<button style={{ ...btn("transparent"), border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 5 }} onClick={() => navigate("/orders")}>View orders <ArrowRight size={13} /></button>}
                >
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
                </SectionCard>

                <SectionCard
                    title="Low stock"
                    action={<button style={{ ...btn("transparent"), border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 5 }} onClick={() => navigate("/products")}>View catalog <ArrowRight size={13} /></button>}
                >
                    {lowStock.length === 0 && <div style={{ color: COLORS.greyDim, fontSize: 13 }}>Nothing running low.</div>}
                    {lowStock.slice(0, 5).map((p) => (
                        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13.5 }}>
                            <span>{p.name}</span>
                            <span style={{ color: (p.stock ?? 0) === 0 ? COLORS.red : COLORS.yellow, fontWeight: 700 }}>{p.stock ?? 0} left</span>
                        </div>
                    ))}
                </SectionCard>
            </div>
        </div>
    );
}
