"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { contactSchema, zodMessage } from "@/lib/validations";
import { assertRateLimit } from "@/lib/rate-limit";
import { sendEmail, adminEmail, layoutEmail, escapeHtml } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";
import { CONTACT_SUBJECTS } from "@/lib/constants";
import type { ActionResult } from "@/types";

export async function submitContact(input: unknown): Promise<ActionResult> {
  try {
    await assertRateLimit("contact", 5, 10 * 60_000);
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const d = parsed.data;
    await prisma.contactMessage.create({ data: { ...d, phone: d.phone || null } });

    const s = await getSiteSettings();
    const to = adminEmail() ?? s.contactEmail;
    if (to) {
      const subject = CONTACT_SUBJECTS.find((x) => x.value === d.subject)?.label ?? d.subject;
      void sendEmail({
        to,
        subject: `[${s.storeName}] New contact message: ${subject}`,
        html: layoutEmail(
          s.storeName,
          `New message — ${subject}`,
          `<p><strong>${escapeHtml(d.firstName)} ${escapeHtml(d.lastName)}</strong> &lt;${escapeHtml(d.email)}&gt;${d.phone ? ` · ${escapeHtml(d.phone)}` : ""}</p><p style="white-space:pre-wrap">${escapeHtml(d.message)}</p>`,
        ),
      }).catch(() => {});
    }
    revalidatePath("/admin/messages");
    return { ok: true, message: "Thanks! We'll get back to you soon." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send message" };
  }
}

export async function setMessageRead(id: string, isRead: boolean): Promise<ActionResult> {
  try {
    await assertAdmin();
    await prisma.contactMessage.update({ where: { id }, data: { isRead } });
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    await prisma.contactMessage.delete({ where: { id } });
    revalidatePath("/admin/messages");
    return { ok: true, message: "Message deleted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

const NEWSLETTER_MESSAGE = "Newsletter subscription request from the home page.";
const newsletterSchema = z.object({ email: z.string().trim().email().max(120) });

/** Home-page newsletter form. Stored as a contact message so it shows up in the admin inbox. */
export async function subscribeNewsletter(input: unknown): Promise<ActionResult> {
  try {
    await assertRateLimit("newsletter", 5, 10 * 60_000);
    const parsed = newsletterSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Enter a valid email address" };
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.contactMessage.findFirst({
      where: { email, message: NEWSLETTER_MESSAGE },
      select: { id: true },
    });
    if (existing) return { ok: true, message: "You're already subscribed." };
    await prisma.contactMessage.create({
      data: {
        firstName: "Newsletter",
        lastName: "Subscriber",
        email,
        subject: "general_inquiry",
        message: NEWSLETTER_MESSAGE,
      },
    });
    revalidatePath("/admin/messages");
    return { ok: true, message: "Subscribed! We'll keep you posted on new products and offers." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not subscribe right now" };
  }
}
