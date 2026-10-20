import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, Package, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const profile = await requireUser("/profile");
  return (
    <div className="container max-w-3xl py-6 md:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My profile</h1>
          <p className="text-sm text-muted-foreground">Manage your personal details and default address.</p>
        </div>
        <div className="flex items-center gap-2">
          {profile.role === "admin" && (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">
                <ShieldCheck /> Admin
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">
              <Package /> Orders
            </Link>
          </Button>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut /> Sign out
            </Button>
          </form>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Personal details</CardTitle>
            <Badge variant={profile.role === "admin" ? "brand" : "secondary"} className="capitalize">
              {profile.role}
            </Badge>
          </div>
          <CardDescription>Your email is linked to your login and cannot be changed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
