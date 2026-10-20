"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { GoogleIcon } from "./google-icon";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const [oauthLoading, setOauthLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const schema = mode === "login" ? loginSchema : signupSchema;
  const form = useForm<SignupInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", fullName: "", phone: "" },
  });

  async function signInWithGoogle() {
    setOauthLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { access_type: "offline", prompt: "select_account" } },
    });
    if (error) {
      toast.error(error.message);
      setOauthLoading(false);
    }
  }

  async function onSubmit(values: SignupInput | LoginInput) {
    const supabase = createClient();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error)
        return toast.error(
          error.message === "Invalid login credentials" ? "Incorrect email or password" : error.message,
        );
      toast.success("Welcome back!");
      router.replace(`/auth/redirect${next ? `?next=${encodeURIComponent(next)}` : ""}`);
      router.refresh();
    } else {
      const v = values as SignupInput;
      const { data, error } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          data: { full_name: v.fullName, phone: v.phone || undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return toast.error(error.message);
      if (data.session) {
        toast.success("Account created!");
        router.replace("/auth/redirect");
        router.refresh();
      } else {
        setEmailSent(true);
      }
    }
  }

  if (emailSent) {
    return (
      <div className="rounded-xl border bg-emerald-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-emerald-900">Check your inbox</h2>
        <p className="mt-2 text-sm text-emerald-800">
          We sent a confirmation link to <strong>{form.getValues("email")}</strong>. Click it to finish
          creating your account.
        </p>
      </div>
    );
  }

  const { register, handleSubmit, formState } = form;

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        onClick={signInWithGoogle}
        loading={oauthLoading}
      >
        {!oauthLoading && <GoogleIcon />}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {mode === "signup" && (
          <>
            <FormField
              label="Full name"
              htmlFor="fullName"
              error={formState.errors.fullName?.message}
              required
            >
              <Input id="fullName" autoComplete="name" placeholder="Arun Kumar" {...register("fullName")} />
            </FormField>
            <FormField label="Phone (optional)" htmlFor="phone" error={formState.errors.phone?.message}>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98400 00000"
                {...register("phone")}
              />
            </FormField>
          </>
        )}
        <FormField label="Email" htmlFor="email" error={formState.errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </FormField>
        <FormField label="Password" htmlFor="password" error={formState.errors.password?.message} required>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            {...register("password")}
          />
        </FormField>
        <Button type="submit" className="h-11 w-full" loading={formState.isSubmitting}>
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link
              href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-medium text-foreground underline"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-medium text-foreground underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
