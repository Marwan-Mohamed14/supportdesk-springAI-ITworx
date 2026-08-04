import { Link } from "@tanstack/react-router";
import { Package, Ticket, ReceiptText, PanelLeft } from "lucide-react";
import { useState } from "react";

const items = [
  { title: "Products", url: "/products", icon: Package },
  { title: "Tickets", url: "/tickets", icon: Ticket },
  { title: "Orders", url: "/", icon: ReceiptText },
] as const;

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-panel transition-all ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex h-16 items-center gap-2 px-4">
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-panel-hi hover:text-foreground"
        >
          <PanelLeft className="size-4" />
        </button>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-foreground">
            IT<span className="text-primary">Worx</span>
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1 px-3 py-2">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.2em] text-dim">Categories</p>
        )}
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.url}
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-panel-hi text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-panel-hi hover:text-foreground"
            title={item.title}
          >
            <item.icon className="size-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
