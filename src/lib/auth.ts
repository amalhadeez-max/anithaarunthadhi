import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Profile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Returns the current user's profile (or null). Creates the profile row on first
 * login as a safety net in case the DB trigger did not run.
 */
export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await prisma.profile.findUnique({ where: { id: user.id } });
  if (existing) return existing;

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  return prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? "",
      fullName: meta.full_name ?? meta.name ?? null,
      avatarUrl: meta.avatar_url ?? null,
    },
    update: {},
  });
});

export async function requireUser(next?: string): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export async function requireAdmin(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

/** For server actions: throw instead of redirect. */
export async function assertUser(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in.");
  return user;
}

export async function assertAdmin(): Promise<Profile> {
  const user = await assertUser();
  if (user.role !== "admin") throw new Error("Admin access required.");
  return user;
}
