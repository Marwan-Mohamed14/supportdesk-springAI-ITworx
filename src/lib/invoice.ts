import type { OrderDetail } from "@/data/orders";

const INK = "#101820";
const RED = "#C63527";
const GREY = "#78808A";
const DARK = "#1B242C";

export async function downloadInvoice(order: OrderDetail) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const m = 48;

  // Header band
  doc.setFillColor(INK);
  doc.rect(0, 0, pageW, 96, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor("#FFFFFF");
  doc.text("IT", m, 52);
  const itW = doc.getTextWidth("IT");
  doc.setTextColor(RED);
  doc.text("Worx", m + itW, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#D0D3D4");
  doc.text("SupportDesk · Smart Village, Building B12, Giza, Egypt", m, 72);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor("#FFFFFF");
  doc.text("INVOICE", pageW - m, 52, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#D0D3D4");
  doc.text(order.id, pageW - m, 72, { align: "right" });

  // Meta
  let y = 140;
  doc.setTextColor(GREY);
  doc.setFontSize(8);
  doc.text("BILL TO", m, y);
  doc.text("ORDER DETAILS", pageW / 2, y);

  doc.setTextColor(DARK);
  doc.setFontSize(10);
  const billTo = [order.requester, ...order.shipTo];
  billTo.forEach((line, i) => doc.text(line, m, y + 18 + i * 14));

  const meta = [
    `Order: ${order.id}`,
    `Date: ${order.date}`,
    `PO number: ${order.poNumber}`,
    `Cost centre: ${order.costCentre}`,
    `Payment: ${order.paymentMethod}`,
    `Status: ${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}`,
  ];
  meta.forEach((line, i) => doc.text(line, pageW / 2, y + 18 + i * 14));

  y = y + 18 + Math.max(billTo.length, meta.length) * 14 + 24;

  // Table header
  doc.setFillColor(INK);
  doc.rect(m, y, pageW - m * 2, 24, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Item", m + 10, y + 16);
  doc.text("Qty", pageW - m - 210, y + 16, { align: "right" });
  doc.text("Unit price", pageW - m - 110, y + 16, { align: "right" });
  doc.text("Amount", pageW - m - 10, y + 16, { align: "right" });
  y += 24;

  doc.setFont("helvetica", "normal");
  order.lines.forEach((line, i) => {
    if (i % 2 === 1) {
      doc.setFillColor("#F2F3F4");
      doc.rect(m, y, pageW - m * 2, 30, "F");
    }
    doc.setTextColor(DARK);
    doc.setFontSize(10);
    doc.text(line.name, m + 10, y + 14);
    doc.setFontSize(8);
    doc.setTextColor(GREY);
    doc.text(line.sku, m + 10, y + 25);
    doc.setFontSize(10);
    doc.setTextColor(DARK);
    doc.text(String(line.qty), pageW - m - 210, y + 18, { align: "right" });
    doc.text(line.unitPrice, pageW - m - 110, y + 18, { align: "right" });
    doc.text(line.lineTotal, pageW - m - 10, y + 18, { align: "right" });
    y += 30;
  });

  // Totals
  y += 16;
  const totals: [string, string][] = [
    ["Subtotal", order.subtotal],
    ["Shipping", order.shipping],
    ["VAT", order.vat],
  ];
  doc.setFontSize(10);
  totals.forEach(([label, value]) => {
    doc.setTextColor(GREY);
    doc.text(label, pageW - m - 110, y, { align: "right" });
    doc.setTextColor(DARK);
    doc.text(value, pageW - m - 10, y, { align: "right" });
    y += 16;
  });

  y += 6;
  doc.setDrawColor("#D0D3D4");
  doc.line(pageW - m - 220, y - 14, pageW - m, y - 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(RED);
  doc.text("Total", pageW - m - 110, y + 4, { align: "right" });
  doc.text(order.total, pageW - m - 10, y + 4, { align: "right" });

  // Delivery + notes
  y += 44;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(GREY);
  doc.text("DELIVERY", m, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(DARK);
  doc.text(`${order.carrier} · Tracking ${order.tracking}`, m, y + 16);
  doc.setFontSize(9);
  doc.setTextColor(GREY);
  doc.text(doc.splitTextToSize(order.notes, pageW - m * 2), m, y + 34);

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor("#D0D3D4");
  doc.line(m, pageH - 60, pageW - m, pageH - 60);
  doc.setFontSize(8);
  doc.setTextColor(GREY);
  doc.text(
    "ITWorx SupportDesk · This invoice was generated automatically and is valid without signature.",
    m,
    pageH - 42,
  );

  doc.save(`${order.id}-invoice.pdf`);
}
