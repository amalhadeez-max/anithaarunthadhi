import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Accessories that fit your exact vehicle — delivered to your door.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </CardContent>
    </Card>
  );
}
