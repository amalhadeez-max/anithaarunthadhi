import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { requiredEnv } from "@/lib/env";

export function razorpayClient() {
  return new Razorpay({
    key_id: requiredEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID"),
    key_secret: requiredEnv("RAZORPAY_KEY_SECRET"),
  });
}

export function isRazorpayConfigured() {
  const id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return Boolean(id && secret && !id.endsWith("xxxxxxxx") && !secret.startsWith("xxxx"));
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Checkout callback: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyCheckoutSignature(input: { orderId: string; paymentId: string; signature: string }) {
  const expected = crypto
    .createHmac("sha256", requiredEnv("RAZORPAY_KEY_SECRET"))
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return safeEqual(expected, input.signature);
}

/** Webhook: HMAC_SHA256(raw_body, webhook_secret) compared with X-Razorpay-Signature */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", requiredEnv("RAZORPAY_WEBHOOK_SECRET"))
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}
