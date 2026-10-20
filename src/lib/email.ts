import "server-only";
import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "Anithaarunthadhi <onboarding@resend.dev>";

/** Sends via Resend when configured; otherwise logs to the console (dev-friendly no-op). */
export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_xxxx")) {
    console.info(
      `[email:dev] to=${Array.isArray(input.to) ? input.to.join(",") : input.to} subject="${input.subject}"`,
    );
    return { id: "dev-noop" };
  }
  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({ from, ...input });
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("sendEmail failed", e);
    return null;
  }
}

export function adminEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL ?? null;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function layoutEmail(storeName: string, title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f6f6f7;padding:24px">
  <table role="presentation" width="100%" style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="background:#111;color:#fff;padding:20px 24px;font-size:20px;font-weight:700">${esc(storeName)}</td></tr>
    <tr><td style="padding:24px"><h2 style="margin:0 0 12px;font-size:18px">${esc(title)}</h2>${bodyHtml}</td></tr>
    <tr><td style="padding:16px 24px;color:#777;font-size:12px">You are receiving this because you have an account at ${esc(storeName)}.</td></tr>
  </table></body></html>`;
}

export { esc as escapeHtml };
