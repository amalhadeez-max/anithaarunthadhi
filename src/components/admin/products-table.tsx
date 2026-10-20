"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Eye, EyeOff, Package } from "lucide-react";
import { bulkSetProductsActive, deleteProduct } from "@/actions/products";
import { formatINR } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "./confirm-button";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  compatCount: number;
};

export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));

  async function bulk(active: boolean) {
    setBusy(true);
    const res = await bulkSetProductsActive([...selected], active);
    setBusy(false);
    if (res.ok) {
      toast.success(res.message);
      setSelected(new Set());
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2 text-sm">
          <span className="px-2 font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulk(true)} loading={busy}>
            <Eye /> Activate
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulk(false)} loading={busy}>
            <EyeOff /> Deactivate
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(c) => setSelected(c ? new Set(rows.map((r) => r.id)) : new Set())}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">Brand / Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="hidden text-center sm:table-cell">Compat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id} data-state={selected.has(p.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(p.id)}
                    onCheckedChange={(c) =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (c) n.add(p.id);
                        else n.delete(p.id);
                        return n;
                      })
                    }
                    aria-label={`Select ${p.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border bg-neutral-50">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="m-auto h-5 w-5 text-neutral-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="line-clamp-1 font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{p.sku}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm md:table-cell">
                  <div>{p.brand}</div>
                  <div className="text-xs text-muted-foreground">{p.category}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.discountPrice ? (
                    <>
                      <div className="font-medium">{formatINR(p.discountPrice)}</div>
                      <div className="text-xs text-muted-foreground line-through">{formatINR(p.price)}</div>
                    </>
                  ) : (
                    <div className="font-medium">{formatINR(p.price)}</div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={
                      p.stock === 0
                        ? "font-semibold text-destructive"
                        : p.stock <= LOW_STOCK_THRESHOLD
                          ? "font-semibold text-amber-600"
                          : ""
                    }
                  >
                    {p.stock}
                  </span>
                </TableCell>
                <TableCell className="hidden text-center text-sm sm:table-cell">{p.compatCount}</TableCell>
                <TableCell>
                  <Badge variant={p.isActive ? "success" : "secondary"}>
                    {p.isActive ? "Active" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm" aria-label="View in store">
                      <Link href={`/products/${p.slug}`} target="_blank">
                        <Eye />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm" aria-label="Edit">
                      <Link href={`/admin/products/${p.id}`}>
                        <Pencil />
                      </Link>
                    </Button>
                    <ConfirmButton
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label="Delete"
                      title={`Delete ${p.name}?`}
                      description="If the product appears in past orders it will be deactivated instead."
                      confirmLabel="Delete"
                      action={() => deleteProduct(p.id)}
                    >
                      <Trash2 />
                    </ConfirmButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No products match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
