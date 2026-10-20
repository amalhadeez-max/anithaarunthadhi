"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Car, RotateCcw } from "lucide-react";
import { BrandFormDialog, type BrandRow } from "./brand-form";
import { ConfirmButton } from "./confirm-button";
import { deleteBrand, toggleBrandActive, restoreBrand } from "@/actions/brands";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEGMENTS } from "@/lib/constants";

export type BrandTableRow = BrandRow & { productCount: number; modelCount: number; deletedAt: string | null };

export function BrandsTable({ rows }: { rows: BrandTableRow[] }) {
  const router = useRouter();
  return (
    <div className="rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Logo</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead className="hidden md:table-cell">Segments</TableHead>
            <TableHead className="hidden text-center sm:table-cell">Models</TableHead>
            <TableHead className="hidden text-center sm:table-cell">Products</TableHead>
            <TableHead className="hidden text-center md:table-cell">Order</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((b) => (
            <TableRow key={b.id} className={b.deletedAt ? "opacity-50" : ""}>
              <TableCell>
                <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-white">
                  {b.logoUrl ? (
                    <Image
                      src={b.logoUrl}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs font-bold">
                      {b.name[0]}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-muted-foreground">
                  /{b.slug}
                  {b.deletedAt ? " · deleted" : ""}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {b.segments.map((s) => (
                    <Badge key={s} variant="secondary">
                      {SEGMENTS.find((x) => x.value === s)?.label}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="hidden text-center sm:table-cell">{b.modelCount}</TableCell>
              <TableCell className="hidden text-center sm:table-cell">{b.productCount}</TableCell>
              <TableCell className="hidden text-center md:table-cell">{b.sortOrder}</TableCell>
              <TableCell>
                <Switch
                  checked={b.isActive}
                  disabled={Boolean(b.deletedAt)}
                  aria-label={`Toggle ${b.name}`}
                  onCheckedChange={async (v) => {
                    const res = await toggleBrandActive(b.id, v);
                    if (res.ok) {
                      toast.success(res.message);
                      router.refresh();
                    } else toast.error(res.error);
                  }}
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button asChild variant="ghost" size="icon-sm" aria-label="Manage models & variants">
                    <Link href={`/admin/variants?brand=${b.id}`}>
                      <Car />
                    </Link>
                  </Button>
                  <BrandFormDialog brand={b} />
                  {b.deletedAt ? (
                    <ConfirmButton
                      variant="ghost"
                      size="icon-sm"
                      title={`Restore ${b.name}?`}
                      confirmLabel="Restore"
                      action={() => restoreBrand(b.id)}
                      aria-label="Restore"
                    >
                      <RotateCcw />
                    </ConfirmButton>
                  ) : (
                    <ConfirmButton
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      title={`Delete ${b.name}?`}
                      description={
                        b.productCount > 0
                          ? `⚠ This brand has ${b.productCount} product(s). Deletion will be blocked until they are reassigned or removed.`
                          : "The brand will be hidden from the store (soft delete). You can restore it later."
                      }
                      confirmLabel="Delete"
                      action={() => deleteBrand(b.id)}
                      aria-label="Delete"
                    >
                      <Trash2 />
                    </ConfirmButton>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                No brands yet. Add your first brand.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
