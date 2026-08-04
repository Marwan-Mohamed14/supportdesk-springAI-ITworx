import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LifeBuoy, Search, Bell, Plus, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { TicketCard } from "@/components/tickets/TicketCard";
import {
  AGENTS,
  INITIAL_TICKETS,
  PRIORITIES,
  PRIORITY_RANK,
  SORT_OPTIONS,
  STATUSES,
  type Priority,
  type SortOption,
  type Status,
  type Ticket,
} from "@/components/tickets/data";

const PAGE_SIZE = 6;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Support Tickets — SupportDesk AI" },
      {
        name: "description",
        content:
          "Create, triage, assign, and escalate customer support tickets in one dark, focused SupportDesk AI queue.",
      },
      { property: "og:title", content: "Support Tickets — SupportDesk AI" },
      {
        property: "og:description",
        content:
          "Create, triage, assign, and escalate customer support tickets in one dark, focused SupportDesk AI queue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportTicketsPage,
});

function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [statusFilters, setStatusFilters] = useState<Status[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<Priority[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  // Create ticket
  const [createOpen, setCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("Medium");
  const [newOrder, setNewOrder] = useState("");

  // Assign / escalate
  const [assignTicket, setAssignTicket] = useState<Ticket | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [escalateTicket, setEscalateTicket] = useState<Ticket | null>(null);
  const [reason, setReason] = useState("");

  const stats = useMemo(
    () => [
      { label: "Total Tickets", value: tickets.length, tone: "text-foreground" },
      {
        label: "Open",
        value: tickets.filter((t) => t.status === "Open").length,
        tone: "text-foreground",
      },
      {
        label: "In Progress",
        value: tickets.filter((t) => t.status === "In Progress").length,
        tone: "text-warning",
      },
      {
        label: "Escalated",
        value: tickets.filter((t) => t.status === "Escalated").length,
        tone: "text-primary",
      },
      {
        label: "Closed",
        value: tickets.filter((t) => t.status === "Closed").length,
        tone: "text-success",
      },
    ],
    [tickets],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tickets.filter((t) => {
      const statusOk = statusFilters.length === 0 || statusFilters.includes(t.status);
      const priorityOk = priorityFilters.length === 0 || priorityFilters.includes(t.priority);
      const queryOk =
        q === "" || [t.id, t.subject, t.customer].some((f) => f.toLowerCase().includes(q));
      return statusOk && priorityOk && queryOk;
    });

    return [...list].sort((a, b) => {
      if (sort === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (sort === "oldest") return a.createdAt - b.createdAt;
      return b.createdAt - a.createdAt;
    });
  }, [tickets, statusFilters, priorityFilters, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, statusFilters, priorityFilters, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggle<T>(list: T[], value: T, setter: (next: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function createTicket() {
    const subject = newSubject.trim();
    if (!subject) return;
    const ticket: Ticket = {
      id: `TCK-${Math.floor(48300 + Math.random() * 9000)}`,
      subject: subject.slice(0, 120),
      description: newDescription.trim().slice(0, 1000) || undefined,
      orderNumber: newOrder.trim().slice(0, 40) || undefined,
      customer: "Alex Rivera",
      company: "Internal Report",
      priority: newPriority,
      status: "Open",
      agent: null,
      updated: "just now",
      createdAt: Date.now(),
    };
    setTickets((prev) => [ticket, ...prev]);
    toast.success(`${ticket.id} created`);
    setCreateOpen(false);
    setNewSubject("");
    setNewDescription("");
    setNewOrder("");
    setNewPriority("Medium");
  }

  function confirmAssign() {
    if (!assignTicket || !selectedAgent) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === assignTicket.id
          ? { ...t, agent: selectedAgent, status: "In Progress", updated: "just now" }
          : t,
      ),
    );
    toast.success(`${assignTicket.id} assigned to ${selectedAgent}`);
    setAssignTicket(null);
  }

  function confirmEscalate() {
    const text = reason.trim();
    if (!escalateTicket || !text) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === escalateTicket.id
          ? { ...t, status: "Escalated", escalationReason: text, updated: "just now" }
          : t,
      ),
    );
    toast.success(`${escalateTicket.id} escalated`);
    setEscalateTicket(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <LifeBuoy className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg leading-none font-bold tracking-tight text-foreground">
              SupportDesk AI
            </h1>
            <p className="mt-1 text-xs tracking-wide text-text-muted uppercase">
              Customer Operations Console
            </p>
          </div>

          <div className="relative ml-auto hidden w-72 md:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tickets, customers…"
              maxLength={100}
              className="border-border bg-surface pl-9 text-foreground placeholder:text-text-muted"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New Ticket
          </Button>
          <Button variant="outline" size="icon" aria-label="Notifications">
            <Bell />
          </Button>
          <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-link text-xs font-semibold text-link-foreground sm:flex">
            AR
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-medium tracking-wider text-text-muted uppercase">
                {s.label}
              </p>
              <p className={`mt-2 font-display text-3xl font-bold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                Filters
              </h2>
              <button
                onClick={() => {
                  setStatusFilters([]);
                  setPriorityFilters([]);
                }}
                className="cursor-pointer text-xs text-text-muted underline-offset-4 hover:text-foreground hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 md:hidden">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tickets…"
                maxLength={100}
                className="border-border bg-surface text-foreground placeholder:text-text-muted"
              />
            </div>

            <fieldset className="mt-5">
              <legend className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                Status
              </legend>
              <div className="mt-3 space-y-3">
                {STATUSES.map((status) => (
                  <div key={status} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`status-${status}`}
                      checked={statusFilters.includes(status)}
                      onCheckedChange={() => toggle(statusFilters, status, setStatusFilters)}
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="cursor-pointer text-sm font-normal text-text-secondary"
                    >
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="my-5 h-px bg-border" />

            <fieldset>
              <legend className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                Priority
              </legend>
              <div className="mt-3 space-y-3">
                {PRIORITIES.map((priority) => (
                  <div key={priority} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={priorityFilters.includes(priority)}
                      onCheckedChange={() =>
                        toggle(priorityFilters, priority, setPriorityFilters)
                      }
                    />
                    <Label
                      htmlFor={`priority-${priority}`}
                      className="cursor-pointer text-sm font-normal text-text-secondary"
                    >
                      {priority}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">Support Tickets</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">
                  {filtered.length} of {tickets.length}
                </span>
                <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                  <SelectTrigger
                    aria-label="Sort tickets"
                    className="w-36 border-border bg-surface text-foreground"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <p className="text-sm text-text-secondary">No tickets match these filters.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onAssign={() => {
                      setSelectedAgent(ticket.agent);
                      setAssignTicket(ticket);
                    }}
                    onEscalate={() => {
                      setReason("");
                      setEscalateTicket(ticket);
                    }}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft /> Previous
              </Button>
              <span className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight />
              </Button>
            </div>
          </section>
        </div>
      </main>

      {/* Create ticket dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>New ticket</DialogTitle>
            <DialogDescription className="text-text-muted">
              Log a new customer issue. It starts in the Open queue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-text-secondary">
                Subject
              </Label>
              <Input
                id="subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                maxLength={120}
                placeholder="Short summary of the issue"
                className="border-border bg-surface text-foreground placeholder:text-text-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-text-secondary">
                Description
              </Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                maxLength={1000}
                placeholder="What happened, and what has been tried so far…"
                className="border-border bg-surface text-foreground placeholder:text-text-muted"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-text-secondary">Priority</Label>
                <Select
                  value={newPriority}
                  onValueChange={(v) => setNewPriority(v as Priority)}
                >
                  <SelectTrigger
                    aria-label="Priority"
                    className="border-border bg-surface text-foreground"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order" className="text-text-secondary">
                  Order number <span className="text-text-muted">(optional)</span>
                </Label>
                <Input
                  id="order"
                  value={newOrder}
                  onChange={(e) => setNewOrder(e.target.value)}
                  maxLength={40}
                  placeholder="ORD-10293"
                  className="border-border bg-surface text-foreground placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTicket} disabled={newSubject.trim() === ""}>
              Create ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={assignTicket !== null} onOpenChange={(o) => !o && setAssignTicket(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Assign ticket</DialogTitle>
            <DialogDescription className="text-text-muted">
              Pick an agent for {assignTicket?.id} — {assignTicket?.subject}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-text-secondary">Agent</Label>
            <Select
              value={selectedAgent ?? undefined}
              onValueChange={(v) => setSelectedAgent(v)}
            >
              <SelectTrigger
                aria-label="Agent"
                className="border-border bg-surface text-foreground"
              >
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {AGENTS.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-text-muted">
              Assigning moves the ticket to In Progress.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTicket(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAssign} disabled={!selectedAgent}>
              Assign agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate dialog */}
      <Dialog open={escalateTicket !== null} onOpenChange={(o) => !o && setEscalateTicket(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Escalate ticket</DialogTitle>
            <DialogDescription className="text-text-muted">
              Tell us why {escalateTicket?.id} needs escalation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-text-secondary">
              Escalation reason <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="e.g. SLA breach imminent — customer requested a manager"
              className="border-border bg-surface text-foreground placeholder:text-text-muted"
            />
            {reason.trim() === "" ? (
              <p className="text-xs text-text-muted">A reason is required to escalate.</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateTicket(null)}>
              Cancel
            </Button>
            <Button onClick={confirmEscalate} disabled={reason.trim() === ""}>
              Escalate ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
