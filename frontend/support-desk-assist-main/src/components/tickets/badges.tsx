import type { Priority, Status } from "./data";

const priorityStyles: Record<Priority, string> = {
  Critical: "bg-primary/20 text-primary border-primary/50",
  High: "bg-warning/15 text-warning border-warning/40",
  Medium: "bg-link/40 text-foreground border-link",
  Low: "bg-surface text-text-muted border-border",
};

const statusStyles: Record<Status, string> = {
  Open: "bg-link/40 text-foreground border-link",
  "In Progress": "bg-warning/15 text-warning border-warning/40",
  Escalated: "bg-primary/20 text-primary border-primary/50",
  Closed: "bg-success/15 text-success border-success/40",
};

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider";

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`${base} ${priorityStyles[priority]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`${base} ${statusStyles[status]}`}>{status}</span>;
}