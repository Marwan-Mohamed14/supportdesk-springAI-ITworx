import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { OrderCard, type Order } from "@/components/orders/OrderCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Previous Orders | ITWorx SupportDesk" },
      {
        name: "description",
        content:
          "Review your ITWorx SupportDesk order history: track status, totals and reorder hardware and licences in one place.",
      },
      { property: "og:title", content: "Previous Orders | ITWorx SupportDesk" },
      {
        property: "og:description",
        content: "Track past ITWorx SupportDesk orders, statuses and totals, and reorder in one click.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PreviousOrders,
});

const ORDERS: Order[] = [
  {
    id: "ORD-24817",
    date: "12 Jul 2026",
    items: "Dell Latitude 5550 · Docking Station WD22TB4",
    units: 4,
    total: "$6,480.00",
    status: "delivered",
    requester: "Nour Adel",
  },
  {
    id: "ORD-24796",
    date: "04 Jul 2026",
    items: "Microsoft 365 E3 licences (annual renewal)",
    units: 25,
    total: "$10,950.00",
    status: "processing",
    requester: "Karim Fahmy",
  },
  {
    id: "ORD-24755",
    date: "22 Jun 2026",
    items: "Logitech MX Master 3S · Keyboard MX Keys",
    units: 12,
    total: "$1,740.00",
    status: "shipped",
    requester: "Salma Hassan",
  },
  {
    id: "ORD-24710",
    date: "09 Jun 2026",
    items: "Jabra Evolve2 65 Headsets",
    units: 8,
    total: "$1,992.00",
    status: "delivered",
    requester: "Omar Zaki",
  },
  {
    id: "ORD-24688",
    date: "28 May 2026",
    items: "Ubiquiti UniFi 6 Pro Access Points",
    units: 6,
    total: "$1,134.00",
    status: "cancelled",
    requester: "Mariam Sobhy",
  },
];

const FILTERS = ["All", "Delivered", "Shipped", "Processing", "Cancelled"] as const;

function PreviousOrders() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");

  const orders = useMemo(
    () =>
      ORDERS.filter((o) => filter === "All" || o.status === filter.toLowerCase()).filter((o) =>
        `${o.id} ${o.items} ${o.requester}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [filter, query],
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              ITWorx SupportDesk
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Previous orders
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Every hardware, licence and accessory request you have raised, with live fulfilment
              status.
            </p>
          </div>
          <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-red-dark">
            New order
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Orders this year", value: "38", tone: "text-foreground" },
            { label: "Spend to date", value: "$74,320", tone: "text-foreground" },
            { label: "Awaiting delivery", value: "3", tone: "text-warning" },
          ].map((stat) => (
            <div key={stat.label} className="panel-surface rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-dim">{stat.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
            </div>
          ))}
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  filter === f
                    ? "border-primary bg-primary/14 text-foreground"
                    : "border-border text-muted-foreground hover:bg-panel-hi hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders…"
            className="w-full rounded-md border border-border bg-panel px-4 py-2 text-sm text-foreground placeholder:text-dim focus:border-primary focus:outline-none sm:w-64"
          />
        </div>

        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {orders.length === 0 && (
            <p className="panel-surface rounded-xl p-10 text-center text-sm text-dim">
              No orders match your filters.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
