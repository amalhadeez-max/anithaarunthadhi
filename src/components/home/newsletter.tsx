"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/actions/messages";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await subscribeNewsletter({ email });
      if (res.ok) {
        toast.success(res.message ?? "Subscribed!");
        setEmail("");
      } else toast.error(res.error ?? "Could not subscribe");
    });
  }

  return (
    <div className="relative flex flex-1 gap-5 self-start overflow-hidden rounded-[10px] bg-ink p-6 text-white md:p-7">
      <Image src="/home/newsletter-engine.webp" alt="" fill sizes="600px" className="object-cover object-right" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink from-[60%] via-ink/60 to-ink/10" />
      <Mail className="relative hidden h-11 w-11 shrink-0 sm:block" strokeWidth={1.5} />
      <div className="relative flex max-w-[460px] flex-1 flex-col gap-2">
        <b className="font-display text-lg font-bold">Subscribe to Our Newsletter</b>
        <p className="text-sm text-neutral-200">Get the latest updates on new products and offers.</p>
        <form onSubmit={submit} className="mt-2 flex flex-col gap-2.5 sm:flex-row">
          <label className="sr-only" htmlFor="nl-email">Email address</label>
          <input
            id="nl-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="h-[38px] flex-1 rounded bg-white px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-[38px] rounded bg-brand px-5 text-sm font-semibold hover:bg-brand-dark disabled:opacity-70"
          >
            {pending ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      </div>
    </div>
  );
}
