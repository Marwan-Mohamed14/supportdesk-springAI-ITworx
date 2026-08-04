import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tickets")({
  head: () => ({
    meta: [
      { title: "Support Tickets | ITWorx SupportDesk" },
      {
        name: "description",
        content: "Track open and resolved ITWorx SupportDesk tickets with priority, owner and status.",
      },
      { property: "og:title", content: "Support Tickets | ITWorx SupportDesk" },
      {
        property: "og:description",
        content: "Open and resolved ITWorx SupportDesk tickets with priority and owner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tickets,
});

const TICKETS = [
  { id: "TKT-8821", title: "VPN drops on remote login", owner: "Nour Adel", priority: "High", state: "Open" },
  { id: "TKT-8804", title: "Laptop battery replacement", owner: "Omar Zaki", priority: "Medium", state: "In progress" },
  { id: "TKT-8779", title: "Outlook calendar not syncing", owner: "Salma Hassan", priority: "Low", state: "Resolved" },
  { id: "TKT-8752", title: "New joiner hardware setup", owner: "Karim Fahmy", priority: "High", state: "In progress" },
];

const tone: Record<string, string> = {
  High: "text-primary",
  Medium: "text-warning",
  Low: "text-dim",
};

function Tickets() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Service desk</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Tickets</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Requests and incidents raised by your team.
      </p>

      <div className="panel-surface mt-8 overflow-hidden rounded-xl">
        {TICKETS.map((t, i) => (
          <div
            key={t.id}
            className={`flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-panel-hi ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">{t.id}</span>
                <span className={`text-xs font-medium ${tone[t.priority]}`}>{t.priority}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.title}</p>
              <p className="mt-2 text-xs text-dim">Owner · {t.owner}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                t.state === "Resolved"
                  ? "bg-success/12 text-success"
                  : t.state === "Open"
                    ? "bg-primary/14 text-primary"
                    : "bg-brand-blue/25 text-foreground"
              }`}
            >
              {t.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
