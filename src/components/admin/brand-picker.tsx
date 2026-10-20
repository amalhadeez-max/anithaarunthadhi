"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BrandPicker({
  brands,
  value,
  param = "brand",
}: {
  brands: { id: string; name: string }[];
  value?: string;
  param?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => {
        const next = new URLSearchParams(sp.toString());
        next.set(param, v);
        next.delete("page");
        router.push(`${pathname}?${next.toString()}`);
      }}
    >
      <SelectTrigger className="w-full bg-white sm:w-64">
        <SelectValue placeholder="Select a brand…" />
      </SelectTrigger>
      <SelectContent>
        {brands.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
