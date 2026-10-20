import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

/** OAuth / magic-link callback: exchange the code for a session then route by role. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (next && next.startsWith("/") && !next.startsWith("//"))
    return NextResponse.redirect(`${origin}${next}`);
  return NextResponse.redirect(`${origin}${user.role === "admin" ? "/admin" : "/"}`);
}
