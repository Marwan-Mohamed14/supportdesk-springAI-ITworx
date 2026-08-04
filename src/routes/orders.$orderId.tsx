import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Package, Receipt, Truck } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { ReorderButton } from "@/components/orders/ReorderButton";
import { getOrder, type OrderDetail } from "@/data/orders";
import { useReorders } from "@/lib/reorder-store";

export const Route = createFileRoute("/orders/$orderId")({
  loader: ({ params }): { order: OrderDetail } => {
    const order = getOrder(params.orderId);
    if (!order) throw notFound();
    return { order };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Order not found | ITWorx SupportDesk" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `Order ${loaderData.order.id} | ITWorx SupportDesk`;
    const description = `Full breakdown of order ${loaderData.order.id}: items, delivery status, tracking and totals.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: OrderNotFound,
  component: OrderDetailPage,
});

function OrderNotFound() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground">Order not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t find that order in your history.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-red-dark"
        >
          <ArrowLeft className="size-4" /> Back to orders
        </Link>
      </div>
    </main>
  );
}

function OrderDetailPage() {
  const { order } = Route.useLoaderData() as { order: OrderDetail };
  const reorder = useReorders()[order.id];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Previous orders
        </Link>

        <header className="mt-6 flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{order.id}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{order.items}</p>
            <p className="mt-3 text-xs text-dim">
              Placed {order.date} · {order.poNumber} · Requested by {order.requester}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setDownloading(true);
                try {
                  await downloadInvoice(order);
                  toast.success(`Invoice for ${order.id} downloaded`);
                } catch {
                  toast.error("Could not generate the invoice. Please try again.");
                } finally {
                  setDownloading(false);
                }
              }}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-panel-hi hover:text-foreground disabled:opacity-60"
            >
              <Download className="size-4" />
              {downloading ? "Preparing…" : "Download invoice"}
            </button>

            <ReorderButton orderId={order.id} />
          </div>
        </header>

        {reorder && (
          <div className="mt-6 rounded-xl border border-success/40 bg-success/10 p-4 text-sm text-success">
            This order was reordered on {reorder.placedAt} — new order {reorder.newId} is now being
            processed.
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Order total", value: order.total },
            { label: "Units", value: String(order.units) },
            { label: "Cost centre", value: order.costCentre },
          ].map((stat) => (
            <div key={stat.label} className="panel-surface rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-dim">{stat.label}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="panel-surface rounded-xl p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-dim">
              <Package className="size-4" /> Items
            </h2>
            <div className="mt-4 divide-y divide-border">
              {order.lines.map((line) => (
                <div key={line.sku} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{line.name}</p>
                    <p className="mt-1 text-xs text-dim">
                      {line.sku} · {line.qty} × {line.unitPrice}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{line.lineTotal}</p>
                </div>
              ))}
            </div>

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd>{order.subtotal}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Shipping</dt>
                <dd>{order.shipping}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>VAT</dt>
                <dd>{order.vat}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold text-foreground">
                <dt>Total</dt>
                <dd>{order.total}</dd>
              </div>
            </dl>
          </section>

          <div className="space-y-6">
            <section className="panel-surface rounded-xl p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-dim">
                <Truck className="size-4" /> Progress
              </h2>
              <ol className="mt-4 space-y-4">
                {order.timeline.map((step) => (
                  <li key={step.label} className="flex gap-3">
                    <span
                      className={`mt-1 size-2.5 shrink-0 rounded-full ${
                        step.done ? "bg-success" : "border border-border bg-panel-hi"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm ${step.done ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-dim">{step.date}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="panel-surface rounded-xl p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-dim">
                <MapPin className="size-4" /> Delivery
              </h2>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                {order.shipTo.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p className="mt-3 text-xs text-dim">
                {order.carrier} · Tracking {order.tracking}
              </p>
            </section>

            <section className="panel-surface rounded-xl p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-dim">
                <Receipt className="size-4" /> Billing
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{order.paymentMethod}</p>
              <p className="mt-1 text-xs text-dim">{order.poNumber}</p>
              <p className="mt-4 text-xs text-dim">{order.notes}</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
