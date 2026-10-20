import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { finalizeRazorpayPayment, markRazorpayPaymentFailed } from "@/lib/orders";

export const runtime = "nodejs";

/**
 * Razorpay webhook (Dashboard → Webhooks → events: payment.captured, payment.failed, order.paid).
 * Verifies X-Razorpay-Signature against the raw body using RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  let valid = false;
  try {
    valid = verifyWebhookSignature(raw, signature);
  } catch {
    valid = false;
  }
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  let event: {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; status: string } };
      order?: { entity: { id: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  try {
    const payment = event.payload.payment?.entity;
    switch (event.event) {
      case "payment.captured":
      case "order.paid":
        if (payment?.order_id)
          await finalizeRazorpayPayment({
            razorpayOrderId: payment.order_id,
            paymentId: payment.id,
            payload: event,
          });
        break;
      case "payment.failed":
        if (payment?.order_id) await markRazorpayPaymentFailed(payment.order_id, event);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("webhook processing failed", e);
    // Return 200 so Razorpay does not retry forever on our own bugs; the client-side verify path also finalizes.
  }
  return NextResponse.json({ ok: true });
}
