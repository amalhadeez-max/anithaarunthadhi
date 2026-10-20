import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { renderInvoicePdf } from "@/lib/pdf/invoice";
import { toNumber } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const order = await prisma.order.findFirst({
    where: { id, ...(user.role === "admin" ? {} : { userId: user.id }) },
    include: { items: true, user: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const s = await getSiteSettings();
  const a = order.shippingAddress as {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };

  const pdf = await renderInvoicePdf({
    storeName: s.storeName,
    storeAddress: [s.addressLine1, s.addressLine2, s.city].filter(Boolean) as string[],
    storeEmail: s.contactEmail,
    storePhone: s.contactPhone,
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    paymentMethod: order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay",
    paymentStatus: order.paymentStatus.replace("_", " "),
    customer: { name: order.user.fullName ?? a.fullName, email: order.user.email },
    shipTo: [
      a.fullName,
      a.line1,
      a.line2 ?? "",
      `${a.city}, ${a.state} - ${a.pincode}`,
      `Phone: ${a.phone}`,
    ].filter(Boolean),
    items: order.items.map((i) => ({
      name: i.name,
      sku: i.sku,
      qty: i.quantity,
      unitPrice: toNumber(i.unitPrice),
      lineTotal: toNumber(i.lineTotal),
    })),
    subtotal: toNumber(order.subtotal),
    discount: toNumber(order.discount),
    delivery: toNumber(order.deliveryCharge),
    total: toNumber(order.total),
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
