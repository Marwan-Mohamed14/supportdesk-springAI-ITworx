import { Link } from "@tanstack/react-router";
import { OrderStatusBadge, type OrderStatus } from "./OrderStatusBadge";

export type Order = {
  id: string;
  date: string;
  items: string;
  units: number;
  total: string;
  status: OrderStatus;
  requester: string;
};

export function OrderCard({ order }: { order: Order }) {
  return (
    <article className="panel-surface group rounded-xl p-5 transition-colors hover:bg-panel-hi">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-foreground">{order.id}</h3>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{order.items}</p>
          <p className="mt-3 text-xs text-dim">
            {order.date} · {order.units} units · Requested by {order.requester}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-dim">Total</p>
            <p className="text-lg font-semibold text-foreground">{order.total}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-red-dark">
              Reorder
            </button>
            <Link
              to="/orders/$orderId"
              params={{ orderId: order.id }}
              className="rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-panel-hi hover:text-foreground"
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
