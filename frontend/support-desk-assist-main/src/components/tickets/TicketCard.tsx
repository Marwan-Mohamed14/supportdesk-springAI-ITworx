import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "./badges";
import type { Ticket } from "./data";

export function TicketCard({
  ticket,
  onAssign,
  onEscalate,
}: {
  ticket: Ticket;
  onAssign: () => void;
  onEscalate: () => void;
}) {
  return (
    <article className="flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs tracking-widest text-text-muted">{ticket.id}</span>
        <StatusBadge status={ticket.status} />
      </div>

      <h3 className="mt-3 text-base leading-snug font-semibold text-foreground">
        {ticket.subject}
      </h3>

      {ticket.description ? (
        <p className="mt-1.5 line-clamp-2 text-sm text-text-muted">{ticket.description}</p>
      ) : null}

      <p className="mt-1.5 text-sm text-text-secondary">
        {ticket.customer} <span className="text-text-muted">· {ticket.company}</span>
      </p>

      <div className="mt-4 flex items-center gap-2">
        <PriorityBadge priority={ticket.priority} />
        <span className="text-xs text-text-muted">Updated {ticket.updated}</span>
      </div>

      {ticket.orderNumber ? (
        <p className="mt-2 font-mono text-xs text-text-muted">Order {ticket.orderNumber}</p>
      ) : null}

      {ticket.escalationReason ? (
        <p className="mt-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-text-secondary">
          <span className="font-semibold text-primary">Escalated:</span>{" "}
          {ticket.escalationReason}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-semibold text-text-secondary">
          {ticket.agent
            ? ticket.agent
                .split(" ")
                .map((p) => p[0])
                .join("")
            : "—"}
        </span>
        <span className="text-sm text-text-secondary">
          {ticket.agent ?? <span className="text-text-muted">Unassigned</span>}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onAssign}
          disabled={ticket.status === "Closed" || ticket.status === "Escalated"}
          title={
            ticket.status === "Closed" || ticket.status === "Escalated"
              ? `Cannot assign a ${ticket.status.toLowerCase()} ticket`
              : undefined
          }
        >
          Assign
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={onEscalate}
          disabled={ticket.status === "Closed"}
          title={ticket.status === "Closed" ? "Cannot escalate a closed ticket" : undefined}
        >
          Escalate
        </Button>
      </div>
    </article>
  );
}