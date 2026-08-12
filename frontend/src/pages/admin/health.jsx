import React, { useState, useEffect, useCallback } from "react";
import { COLORS, FONT, Icon } from "./admin-shared.jsx";

const ACTUATOR_URL =
    (import.meta.env.VITE_API_URL || "http://localhost:8080") + "/actuator/health";

const STATUS_COLOR = {
  UP: COLORS.green,
  DOWN: COLORS.red,
  OUT_OF_SERVICE: COLORS.red,
  UNKNOWN: COLORS.grey,
};

function formatBytes(n) {
  if (typeof n !== "number") return String(n);
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

// "diskSpace" -> "Disk Space", "livenessState" -> "Liveness State"
function formatComponentLabel(name) {
  const spaced = name.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Friendly, human-readable subtitle per known actuator component — falls
// back to a generic summary of whatever `details` came back for anything
// unrecognized.
function describeComponent(name, data) {
  const d = data?.details;
  switch (name) {
    case "overall":
      return data?.status === "UP" ? "All systems operational" : "One or more components are down";
    case "db":
      return d?.database ? `${d.database} · connection healthy` : "Connection healthy";
    case "diskSpace":
      return d ? `${formatBytes(d.free)} free of ${formatBytes(d.total)}` : null;
    case "livenessState":
      return "Application process check";
    case "readinessState":
      return "Ready to accept traffic";
    case "ping":
      return "Basic connectivity check";
    case "ssl":
      return d ? `${d.validChains?.length ?? 0} valid certificate chain(s)` : null;
    default:
      if (!d) return null;
      return Object.entries(d).slice(0, 2)
          .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
          .join(" · ");
  }
}

function StatusPill({ status, large }) {
  const map = {
    UP: { label: "Up", color: COLORS.green },
    DOWN: { label: "Down", color: COLORS.red },
    OUT_OF_SERVICE: { label: "Down", color: COLORS.red },
    UNKNOWN: { label: "Unknown", color: COLORS.grey },
  };
  const s = map[status] || map.UNKNOWN;
  return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: large ? 7 : 5, fontFamily: FONT, fontSize: large ? 13 : 11, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: s.color, background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: large ? "6px 14px" : "3px 9px" }}>
      <span style={{ width: large ? 8 : 6, height: large ? 8 : 6, borderRadius: "50%", background: s.color }} /> {s.label}
    </span>
  );
}

function ComponentBar({ name, data, emphasize }) {
  const status = data?.status || "UNKNOWN";
  const subtitle = describeComponent(name, data);
  const statusColor = STATUS_COLOR[status] || COLORS.grey;

  if (emphasize) {
    return (
        <div style={{ background: COLORS.panelHi, border: `1.5px solid ${statusColor}`, borderRadius: 18, padding: "22px 26px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 8px 24px rgba(0,0,0,0.25)` }}>
          <Icon name="shield" size={28} color={statusColor} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: COLORS.white }}>{formatComponentLabel(name)}</div>
            {subtitle && <div style={{ fontFamily: FONT, fontSize: 14, color: COLORS.grey, marginTop: 4 }}>{subtitle}</div>}
          </div>
          <StatusPill status={status} large />
        </div>
    );
  }

  return (
      <div style={{ background: COLORS.panel, border: `1px solid ${status === "DOWN" ? COLORS.red : COLORS.line}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Icon name="shield" size={18} color={COLORS.grey} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14.5, color: COLORS.white }}>{formatComponentLabel(name)}</div>
          {subtitle && <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.grey, marginTop: 3 }}>{subtitle}</div>}
        </div>
        <StatusPill status={status} />
      </div>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(ACTUATOR_URL);
      const data = await res.json().catch(() => null);
      if (!data) throw new Error("Empty or invalid response from server.");
      setHealth(data);
      setError(null);
    } catch (err) {
      setHealth(null);
      setError(
          err.message === "Failed to fetch"
              ? "Could not reach the backend. Is it running?"
              : err.message
      );
    } finally {
      setLastChecked(new Date());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const overallStatus = health?.status || (error ? "DOWN" : "UNKNOWN");
  const components = health?.components || {};
  const componentEntries = Object.entries(components);

  return (
      <div style={{ minHeight: "100vh", fontFamily: FONT, color: COLORS.white }}>
        <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "16px 28px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15 }}>
                System Health <span style={{ color: COLORS.grey, fontWeight: 400 }}>· /actuator/health</span>
              </div>
              <p style={{ fontSize: 12.5, color: COLORS.greyDim, margin: "4px 0 0", fontFamily: FONT }}>
                {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : "Checking…"}
                {error && <span style={{ color: COLORS.red }}> — {error}</span>}
              </p>
            </div>
            <button
                onClick={checkHealth}
                disabled={loading}
                style={{
                  background: COLORS.panelHi,
                  color: COLORS.white,
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontFamily: FONT,
                  fontWeight: 600,
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
            >
              {loading ? "Checking…" : "Refresh now"}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px" }}>
          <div style={{ marginBottom: 18 }}>
            <ComponentBar
                name="overall"
                data={{
                  status: overallStatus,
                  details: null,
                }}
                emphasize
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {componentEntries.map(([name, data]) => (
                <ComponentBar key={name} name={name} data={data} />
            ))}
          </div>

          <p style={{ fontSize: 12, color: COLORS.greyDim, marginTop: 24, fontFamily: FONT }}>
            Auto-refreshes every 15 seconds. If the database (<code>db</code>) shows{" "}
            <span style={{ color: COLORS.red, fontWeight: 600 }}>DOWN</span>, that's your first
            place to check — before digging through logs.
          </p>
        </div>
      </div>
  );
}
