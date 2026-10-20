"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function OrdersFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const set = (patch: Record<string, string>) => {
    const n = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v && v !== "all") n.set(k, v);
      else n.delete(k);
    }
    n.delete("page");
    router.push(`${pathname}?${n.toString()}`);
  };
  return (
    <form
      className="mb-4 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        set({
          q: String(fd.get("q") ?? ""),
          from: String(fd.get("from") ?? ""),
          to: String(fd.get("to") ?? ""),
        });
      }}
    >
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={sp.get("q") ?? ""}
          placeholder="Order #, customer name or email"
          className="h-9 bg-white pl-8"
        />
      </div>
      <Select value={sp.get("status") ?? "all"} onValueChange={(v) => set({ status: v })}>
        <SelectTrigger className="h-9 w-44 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sp.get("method") ?? "all"} onValueChange={(v) => set({ method: v })}>
        <SelectTrigger className="h-9 w-36 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any payment</SelectItem>
          <SelectItem value="razorpay">Razorpay</SelectItem>
          <SelectItem value="cod">COD</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        name="from"
        defaultValue={sp.get("from") ?? ""}
        className="h-9 w-36 bg-white"
        aria-label="From date"
      />
      <Input
        type="date"
        name="to"
        defaultValue={sp.get("to") ?? ""}
        className="h-9 w-36 bg-white"
        aria-label="To date"
      />
      <Button type="submit" size="sm" className="h-9">
        Apply
      </Button>
      {sp.toString() && (
        <Button type="button" size="sm" variant="ghost" className="h-9" onClick={() => router.push(pathname)}>
          Reset
        </Button>
      )}
    </form>
  );
}
