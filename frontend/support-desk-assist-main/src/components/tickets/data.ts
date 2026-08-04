export type Priority = "Critical" | "High" | "Medium" | "Low";
export type Status = "Open" | "In Progress" | "Escalated" | "Closed";

export type Ticket = {
  id: string;
  subject: string;
  description?: string;
  orderNumber?: string;
  customer: string;
  company: string;
  priority: Priority;
  status: Status;
  agent: string | null;
  escalationReason?: string;
  updated: string;
  createdAt: number;
};

export const AGENTS = [
  "Nadia Reyes",
  "Tomas Lindqvist",
  "Priya Raghunathan",
  "Marcus Bell",
  "Yuki Tanabe",
  "Ellen Castro",
];

export const PRIORITIES: Priority[] = ["Critical", "High", "Medium", "Low"];
export const STATUSES: Status[] = ["Open", "In Progress", "Escalated", "Closed"];

export const ESCALATION_REASONS = [
  "SLA breach imminent",
  "Customer requested manager",
  "Requires engineering input",
  "Repeat incident",
];

export const PRIORITY_RANK: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const HOUR = 60 * 60 * 1000;
const BASE = 1_780_000_000_000;

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: "TCK-48210",
    subject: "Login loop after SSO migration",
    customer: "Dana Whitfield",
    company: "Northgate Logistics",
    priority: "Critical",
    status: "Escalated",
    agent: "Nadia Reyes",
    updated: "12m ago",
    createdAt: BASE - 1 * 3 * HOUR,
  },
  {
    id: "TCK-48207",
    subject: "Invoices exporting with wrong tax region",
    customer: "Marco Pineda",
    company: "Vireo Retail Group",
    priority: "High",
    status: "In Progress",
    agent: "Tomas Lindqvist",
    updated: "34m ago",
    createdAt: BASE - 2 * 3 * HOUR,
  },
  {
    id: "TCK-48201",
    subject: "Webhook retries flooding endpoint",
    customer: "Aisha Khan",
    company: "Beacon Health",
    priority: "High",
    status: "Open",
    agent: null,
    updated: "1h ago",
    createdAt: BASE - 3 * 3 * HOUR,
  },
  {
    id: "TCK-48196",
    subject: "Bulk agent import fails past 500 rows",
    customer: "Simon Achebe",
    company: "Harbor & Co.",
    priority: "Medium",
    status: "In Progress",
    agent: "Priya Raghunathan",
    updated: "2h ago",
    createdAt: BASE - 4 * 3 * HOUR,
  },
  {
    id: "TCK-48190",
    subject: "Knowledge base search returns stale drafts",
    customer: "Lena Vogt",
    company: "Cobalt Studios",
    priority: "Low",
    status: "Open",
    agent: null,
    updated: "3h ago",
    createdAt: BASE - 5 * 3 * HOUR,
  },
  {
    id: "TCK-48184",
    subject: "Outage report: EU cluster latency spike",
    customer: "Hugo Marchand",
    company: "Trellis Bank",
    priority: "Critical",
    status: "Escalated",
    agent: "Marcus Bell",
    updated: "4h ago",
    createdAt: BASE - 6 * 3 * HOUR,
  },
  {
    id: "TCK-48177",
    subject: "Chat widget not respecting theme tokens",
    customer: "Rosa Delgado",
    company: "Peakline Fitness",
    priority: "Medium",
    status: "Closed",
    agent: "Yuki Tanabe",
    updated: "Yesterday",
    createdAt: BASE - 7 * 3 * HOUR,
  },
  {
    id: "TCK-48165",
    subject: "CSAT survey emails delayed by 6 hours",
    customer: "Owen Bradshaw",
    company: "Fairmount Media",
    priority: "High",
    status: "Closed",
    agent: "Ellen Castro",
    updated: "Yesterday",
    createdAt: BASE - 8 * 3 * HOUR,
  },
  {
    id: "TCK-48158",
    subject: "Macro variables render as raw text",
    customer: "Ingrid Solberg",
    company: "Nordvik Marine",
    priority: "Low",
    status: "Open",
    agent: null,
    updated: "2d ago",
    createdAt: BASE - 9 * 3 * HOUR,
  },
];