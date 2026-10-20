import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/** After email/password login on the client, decide where to go based on role. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next");
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (user.role === "admin" && !next) return NextResponse.redirect(`${origin}/admin`);
  if (next && next.startsWith("/") && !next.startsWith("//"))
    return NextResponse.redirect(`${origin}${next}`);
  return NextResponse.redirect(`${origin}/`);
}
