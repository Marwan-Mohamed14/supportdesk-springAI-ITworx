import React, { useState, useEffect, useCallback } from "react";
import { COLORS, FONT } from "./admin-shared.jsx";

const ACTUATOR_URL =
    (import.meta.env.VITE_API_URL || "http://localhost:8080") + "/actuator/health";

const STATUS_COLOR = {
  UP: COLORS.green,
  DOWN: COLORS.red,
  OUT_OF_SERVICE: COLORS.red,
  UNKNOWN: COLORS.grey,
};

function StatusDot({ status }) {
  const color = STATUS_COLOR[status] || COLORS.grey;
  return (
      <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: color,
            boxShadow: status === "UP" ? `0 0 8px ${color}` : "none",
          }}
      />
  );
}

function ComponentCard({ name, data }) {
  const status = data?.status || "UNKNOWN";
  const details = data?.details;

  return (
      <div
          style={{
            background: COLORS.panel,
            border: `1px solid ${status === "DOWN" ? COLORS.red : COLORS.line}`,
            borderRadius: 10,
            padding: 16,
          }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusDot status={status} />
            <span style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>
            {name}
          </span>
          </div>
          <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.4,
                color: STATUS_COLOR[status] || COLORS.grey,
              }}
          >
          {status}
        </span>
        </div>

        {details && (
            <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: `1px solid ${COLORS.line}`,
                  fontSize: 12,
                  color: COLORS.greyDim,
                  display: "grid",
                  gap: 4,
                }}
            >
              {Object.entries(details).map(([key, value]) => (
                  <div key={key} style={{ display: "flex", gap: 8 }}>
                    <span style={{ minWidth: 90, color: COLORS.grey }}>{key}</span>
                    <span style={{ wordBreak: "break-word" }}>
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </span>
                  </div>
              ))}
            </div>
        )}
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

  return (
      <div style={{ fontFamily: FONT, color: COLORS.white, padding: "24px 28px", maxWidth: 900 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>System Health</h1>
            <p style={{ fontSize: 13, color: COLORS.greyDim, margin: "4px 0 0" }}>
              Live status from <code>/actuator/health</code>
              {lastChecked && ` — last checked ${lastChecked.toLocaleTimeString()}`}
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
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
          >
            {loading ? "Checking…" : "Refresh now"}
          </button>
        </div>
        <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: COLORS.panel,
              border: `1px solid ${overallStatus === "DOWN" ? COLORS.red : COLORS.line}`,
              borderRadius: 10,
              padding: "16px 20px",
              marginBottom: 20,
            }}
        >
          <StatusDot status={overallStatus} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {overallStatus === "UP" && "All systems operational"}
              {overallStatus === "DOWN" && "Something is down"}
              {overallStatus === "UNKNOWN" && "Checking status…"}
            </div>
            {error && (
                <div style={{ fontSize: 13, color: COLORS.red, marginTop: 2 }}>{error}</div>
            )}
          </div>
        </div>
        {Object.keys(components).length > 0 && (
            <>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.greyDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
                Components
              </h2>
              <div style={{ display: "grid", gap: 10 }}>
                {Object.entries(components).map(([name, data]) => (
                    <ComponentCard key={name} name={name} data={data} />
                ))}
              </div>
            </>
        )}

        <p style={{ fontSize: 12, color: COLORS.greyDim, marginTop: 24 }}>
          Auto-refreshes every 15 seconds. If the database (<code>db</code>) shows{" "}
          <span style={{ color: COLORS.red, fontWeight: 600 }}>DOWN</span>, that's your first
          place to check — before digging through logs.
        </p>
      </div>
  );
}
