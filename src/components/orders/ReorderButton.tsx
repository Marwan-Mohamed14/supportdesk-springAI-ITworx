import { Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { placeReorder, useReorders } from "@/lib/reorder-store";
import { cn } from "@/lib/utils";

export function ReorderButton({
  orderId,
  className,
}: {
  orderId: string;
  className?: string;
}) {
  const reorders = useReorders();
  const record = reorders[orderId];

  if (record) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md border border-success/40 bg-success/12 px-4 py-2 text-sm font-medium text-success",
          className,
        )}
      >
        <Check className="size-4" /> Reordered · {record.newId}
      </span>
    );
  }

  return (
    <button
      onClick={() => {
        const created = placeReorder(orderId);
        toast.success(`Reorder placed for ${orderId}`, {
          description: `New order ${created.newId} created on ${created.placedAt}.`,
        });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-red-dark",
        className,
      )}
    >
      <RotateCcw className="size-4" /> Reorder
    </button>
  );
}
