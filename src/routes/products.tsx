import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products Catalogue | ITWorx SupportDesk" },
      {
        name: "description",
        content: "Browse ITWorx SupportDesk hardware, accessories and software licences available to order.",
      },
      { property: "og:title", content: "Products Catalogue | ITWorx SupportDesk" },
      {
        property: "og:description",
        content: "Hardware, accessories and licences available to order from ITWorx SupportDesk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Products,
});

const PRODUCTS = [
  { name: "Dell Latitude 5550", category: "Laptops", price: "$1,320", stock: "In stock" },
  { name: "Dock WD22TB4", category: "Accessories", price: "$260", stock: "Low stock" },
  { name: "Logitech MX Master 3S", category: "Peripherals", price: "$105", stock: "In stock" },
  { name: "Jabra Evolve2 65", category: "Audio", price: "$249", stock: "In stock" },
  { name: "Microsoft 365 E3", category: "Licences", price: "$438 / yr", stock: "Unlimited" },
  { name: "UniFi 6 Pro AP", category: "Networking", price: "$189", stock: "Low stock" },
];

function Products() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Catalogue</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Products</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Standard equipment and licences approved for internal ordering.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <article key={p.name} className="panel-surface rounded-xl p-5">
            <p className="text-xs uppercase tracking-widest text-dim">{p.category}</p>
            <h2 className="mt-2 text-base font-semibold text-foreground">{p.name}</h2>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">{p.price}</span>
              <span
                className={`text-xs font-medium ${
                  p.stock === "Low stock" ? "text-warning" : "text-success"
                }`}
              >
                {p.stock}
              </span>
            </div>
            <button className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-red-dark">
              Add to order
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
