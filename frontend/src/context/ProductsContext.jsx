import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { uid } from '../pages/products/product-shared.jsx';

const STORAGE_KEY = 'supportdesk.products';

const SEED_NAMES = [
  ["Wireless Mesh Router X2", "Networking", 149.0], ["USB-C Dock Pro 12-in-1", "Peripherals", 89.0],
  ["1TB NVMe SSD", "Storage", 74.5], ["Noise-Cancel Headset H400", "Audio", 129.0],
  ["27in 4K Monitor", "Displays", 329.0], ["65W GaN Charger", "Power", 39.0],
  ["Braided USB-C Cable 2m", "Cables", 12.0], ["Support Pro License — Annual", "Licenses", 199.0],
  ["Mechanical Keyboard K7", "Peripherals", 79.0], ["Ergo Vertical Mouse", "Peripherals", 45.0],
  ["8-Port PoE Switch", "Networking", 159.0], ["2TB Portable HDD", "Storage", 64.0],
  ["Conference Speakerphone", "Audio", 189.0], ["34in Curved Monitor", "Displays", 449.0],
  ["Desktop Power Bank 20K", "Power", 55.0], ["HDMI 2.1 Cable 3m", "Cables", 15.0],
  ["Analytics Add-on License", "Licenses", 99.0], ["Webcam 4K Autofocus", "Peripherals", 69.0],
  ["Wi-Fi 6 Access Point", "Networking", 119.0], ["512GB microSD Pro", "Storage", 29.0],
  ["Studio Condenser Mic", "Audio", 139.0], ["Dual Monitor Arm Mount", "Displays", 59.0],
  ["Rack PDU 8-Outlet", "Power", 89.0], ["USB-A to C Adapter Pack", "Cables", 9.0],
];

const CATEGORY_BLURBS = {
  Peripherals: "Built for daily use at a desk — comfortable, reliable, and backed by ITWorx support desk coverage.",
  Networking: "Enterprise-grade networking gear, tested for stable throughput under real office load.",
  Storage: "Fast, dependable storage with a manufacturer warranty and straightforward RMA through IT.",
  Audio: "Tuned for clear calls and meetings, with plug-and-play compatibility across common conferencing tools.",
  Displays: "Sharp, color-accurate panels sized for productivity — easy to mount, easy to daisy-chain.",
  Power: "Certified power delivery hardware, safe for shared office circuits and always-on equipment.",
  Cables: "Durable, braided-jacket cabling rated for constant plug/unplug cycles.",
  Licenses: "Digital delivery — activation instructions are emailed immediately after the order is placed.",
};

function seedProducts() {
  return SEED_NAMES.map(([name, category, price], i) => {
    const stock = [0, 0, 3, 4, 22, 40, 2, 60, 15, 0, 8, 30][i % 12];
    const active = !(i % 9 === 8);
    const assigned = Math.floor(Math.random() * 6);
    const decommissioned = Math.floor(Math.random() * 3);
    const totalUnits = stock + assigned + decommissioned;
    const created = new Date(Date.now() - (i + 5) * 86400000 * 3);
    const modified = new Date(Date.now() - (i + 1) * 86400000);
    // Deterministic-looking rating/review count so it doesn't reshuffle on every render.
    const rating = 3.6 + ((i * 37) % 14) / 10; // 3.6 .. 4.9
    const reviewCount = 12 + ((i * 53) % 520);
    return {
      id: uid(), sku: `${category.slice(0, 3).toUpperCase()}-${1000 + i}`, name, category, price, active, stock,
      totalAssignedItems: assigned, totalDecommissioned: decommissioned, totalUnits,
      createdAt: created.toISOString(), modifiedAt: modified.toISOString(),
      rating: Math.min(4.9, rating), reviewCount,
      description: `${name} — ${CATEGORY_BLURBS[category] || "Reliable hardware, sourced and supported by ITWorx IT Procurement."}`,
    };
  });
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(() => readStored() || seedProducts());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const addProduct = useCallback((form) => {
    const stock = Number(form.stock);
    const nowIso = new Date().toISOString();
    const product = {
      id: uid(), sku: form.sku.trim(), name: form.name.trim(), price: Number(form.price), category: form.category,
      active: true, stock, totalAssignedItems: 0, totalDecommissioned: 0, totalUnits: stock,
      createdAt: nowIso, modifiedAt: nowIso, rating: 4.5, reviewCount: 0,
      description: `${form.name.trim()} — ${CATEGORY_BLURBS[form.category] || "Newly added to the catalog."}`,
    };
    setProducts((list) => [product, ...list]);
    return product;
  }, []);

  const updateProduct = useCallback((id, form) => {
    setProducts((list) => list.map((p) => (p.id === id
      ? { ...p, name: form.name.trim(), price: Number(form.price), category: form.category, modifiedAt: new Date().toISOString() }
      : p)));
  }, []);

  const updateStock = useCallback((id, stock) => {
    setProducts((list) => list.map((p) => (p.id === id
      ? { ...p, stock, totalUnits: stock + p.totalAssignedItems + p.totalDecommissioned, modifiedAt: new Date().toISOString() }
      : p)));
  }, []);

  const toggleActive = useCallback((id, active) => {
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, active, modifiedAt: new Date().toISOString() } : p)));
  }, []);

  const getById = useCallback((id) => products.find((p) => p.id === id) ?? null, [products]);

  const value = useMemo(
    () => ({ products, addProduct, updateProduct, updateStock, toggleActive, getById }),
    [products, addProduct, updateProduct, updateStock, toggleActive, getById]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
