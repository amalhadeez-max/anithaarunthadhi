"use client";
import { useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Download, Search, Upload } from "lucide-react";
import { importProductsCsv } from "@/actions/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProductsToolbar({
  brands,
  categories,
}: {
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v && v !== "all") n.set(k, v);
    else n.delete(k);
    n.delete("page");
    router.push(`${pathname}?${n.toString()}`);
  };

  async function onImport(file: File) {
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await importProductsCsv(fd);
    setImporting(false);
    if (res.ok) {
      toast.success(res.message);
      if (res.data?.errors.length) toast.warning(res.data.errors.slice(0, 3).join("\n"), { duration: 10000 });
      router.refresh();
    } else toast.error(res.error);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <form
        className="relative min-w-48 flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          set("q", (new FormData(e.currentTarget).get("q") as string) ?? "");
        }}
      >
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={sp.get("q") ?? ""}
          placeholder="Search name or SKU…"
          className="h-9 bg-white pl-8"
        />
      </form>
      <Select value={sp.get("brand") ?? "all"} onValueChange={(v) => set("brand", v)}>
        <SelectTrigger className="h-9 w-40 bg-white">
          <SelectValue placeholder="Brand" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All brands</SelectItem>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sp.get("category") ?? "all"} onValueChange={(v) => set("category", v)}>
        <SelectTrigger className="h-9 w-40 bg-white">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sp.get("status") ?? "all"} onValueChange={(v) => set("status", v)}>
        <SelectTrigger className="h-9 w-32 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="hidden">Hidden</SelectItem>
          <SelectItem value="low">Low stock</SelectItem>
        </SelectContent>
      </Select>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
      />
      <Button
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => fileRef.current?.click()}
        loading={importing}
      >
        <Upload /> Import CSV
      </Button>
      <Button asChild variant="outline" size="sm" className="h-9">
        <a href="/api/admin/products/export">
          <Download /> Export CSV
        </a>
      </Button>
    </div>
  );
}
