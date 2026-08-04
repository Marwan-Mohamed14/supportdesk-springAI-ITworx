import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadge = cva(
  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wide",
  {
    variants: {
      status: {
        delivered: "bg-success/12 text-success",
        processing: "bg-warning/12 text-warning",
        cancelled: "bg-primary/14 text-primary",
        shipped: "bg-brand-blue/25 text-foreground",
      },
    },
    defaultVariants: { status: "delivered" },
  },
);

export type OrderStatus = NonNullable<VariantProps<typeof statusBadge>["status"]>;

const labels: Record<OrderStatus, string> = {
  delivered: "Delivered",
  processing: "Processing",
  cancelled: "Cancelled",
  shipped: "Shipped",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn(statusBadge({ status }))}>
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
