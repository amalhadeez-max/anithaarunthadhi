import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type InvoiceData = {
  storeName: string;
  storeAddress: string[];
  storeEmail?: string | null;
  storePhone?: string | null;
  orderNumber: string;
  orderDate: Date;
  paymentMethod: string;
  paymentStatus: string;
  customer: { name: string; email: string };
  shipTo: string[];
  items: { name: string; sku: string; qty: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
};

const money = (n: number) =>
  `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Simple A4 invoice generated server-side with pdf-lib (no native deps; works on Vercel). */
export async function renderInvoicePdf(d: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;
  const black = rgb(0.07, 0.07, 0.07);
  const grey = rgb(0.45, 0.45, 0.45);
  const light = rgb(0.93, 0.93, 0.93);

  const text = (t: string, x: number, size = 10, f = font, color = black) =>
    page.drawText(t, { x, y, size, font: f, color });
  const right = (t: string, xRight: number, size = 10, f = font, color = black) =>
    page.drawText(t, { x: xRight - f.widthOfTextAtSize(t, size), y, size, font: f, color });

  // Header band
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: black });
  y = height - 50;
  page.drawText(d.storeName, { x: margin, y, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText("TAX INVOICE", {
    x: width - margin - bold.widthOfTextAtSize("TAX INVOICE", 14),
    y: y + 4,
    size: 14,
    font: bold,
    color: rgb(1, 1, 1),
  });
  y -= 22;
  page.drawText([...d.storeAddress, d.storePhone, d.storeEmail].filter(Boolean).join("  |  "), {
    x: margin,
    y,
    size: 8.5,
    font,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Meta
  y = height - 120;
  text("Invoice / Order #", margin, 9, font, grey);
  text(d.orderNumber, margin + 95, 9, bold);
  right(
    `Date: ${d.orderDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    width - margin,
    9,
  );
  y -= 14;
  text("Payment", margin, 9, font, grey);
  text(`${d.paymentMethod}  (${d.paymentStatus})`, margin + 95, 9);

  // Bill to / Ship to
  y -= 28;
  text("BILL TO", margin, 8.5, bold, grey);
  text("SHIP TO", width / 2, 8.5, bold, grey);
  y -= 13;
  text(d.customer.name, margin, 10, bold);
  text(d.shipTo[0] ?? "", width / 2, 10, bold);
  y -= 12;
  text(d.customer.email, margin, 9, font, grey);
  const ship = d.shipTo.slice(1);
  let sy = y;
  for (const line of ship) {
    page.drawText(line, { x: width / 2, y: sy, size: 9, font, color: grey });
    sy -= 11;
  }
  y = Math.min(y, sy) - 16;

  // Table header
  const cols = { item: margin, sku: 300, qty: 385, unit: 455, total: width - margin };
  page.drawRectangle({ x: margin - 6, y: y - 5, width: width - margin * 2 + 12, height: 18, color: light });
  text("ITEM", cols.item, 8.5, bold, grey);
  text("SKU", cols.sku, 8.5, bold, grey);
  right("QTY", cols.qty + 20, 8.5, bold, grey);
  right("UNIT", cols.unit + 30, 8.5, bold, grey);
  right("AMOUNT", cols.total, 8.5, bold, grey);
  y -= 20;

  for (const it of d.items) {
    if (y < 140) {
      page = pdf.addPage([595.28, 841.89]);
      y = height - margin;
    }
    const name = it.name.length > 55 ? `${it.name.slice(0, 54)}…` : it.name;
    text(name, cols.item, 9.5);
    text(it.sku, cols.sku, 8.5, font, grey);
    right(String(it.qty), cols.qty + 20, 9.5);
    right(money(it.unitPrice), cols.unit + 30, 9.5);
    right(money(it.lineTotal), cols.total, 9.5, bold);
    y -= 16;
    page.drawLine({
      start: { x: margin, y: y + 5 },
      end: { x: width - margin, y: y + 5 },
      thickness: 0.5,
      color: light,
    });
  }

  // Totals
  y -= 8;
  const totals: [string, string, boolean][] = [["Subtotal", money(d.subtotal), false]];
  if (d.discount > 0) totals.push(["Discount", `- ${money(d.discount)}`, false]);
  totals.push(["Delivery", d.delivery === 0 ? "FREE" : money(d.delivery), false]);
  totals.push(["TOTAL", money(d.total), true]);
  for (const [label, val, isBold] of totals) {
    right(label, cols.unit + 30, isBold ? 11 : 9.5, isBold ? bold : font, isBold ? black : grey);
    right(val, cols.total, isBold ? 11 : 9.5, isBold ? bold : font);
    y -= isBold ? 18 : 14;
  }

  // Footer
  y = 60;
  page.drawText("Thank you for shopping with " + d.storeName + ". This is a computer generated invoice.", {
    x: margin,
    y,
    size: 8,
    font,
    color: grey,
  });
  return pdf.save();
}
