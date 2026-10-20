"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tags, Trash2 } from "lucide-react";
import type { Segment } from "@prisma/client";
import { upsertCategory, deleteCategory } from "@/actions/products";
import { slugify } from "@/lib/utils";
import { SEGMENTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function CategoryManager({
  categories,
}: {
  categories: { id: string; name: string; slug: string; segment: Segment | null; count: number }[];
}) {
  const [name, setName] = useState("");
  const [segment, setSegment] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tags /> Categories
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
          <DialogDescription>
            Group products (Helmets, Seat Covers, Tarpaulins…). Optionally tie a category to a segment.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setBusy(true);
            const res = await upsertCategory({
              name,
              slug: slugify(name),
              segment: segment === "all" ? null : segment,
              sortOrder: categories.length,
            });
            setBusy(false);
            if (res.ok) {
              toast.success(res.message);
              setName("");
              router.refresh();
            } else toast.error(res.error);
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category"
            className="h-9"
          />
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              {SEGMENTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" className="h-9" loading={busy}>
            Add
          </Button>
        </form>
        <ul className="max-h-72 divide-y overflow-y-auto rounded-md border">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="flex-1">{c.name}</span>
              {c.segment && (
                <Badge variant="secondary">{SEGMENTS.find((s) => s.value === c.segment)?.label}</Badge>
              )}
              <span className="text-xs text-muted-foreground">{c.count}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                aria-label="Delete"
                disabled={c.count > 0}
                onClick={async () => {
                  const res = await deleteCategory(c.id);
                  if (res.ok) {
                    toast.success(res.message);
                    router.refresh();
                  } else toast.error(res.error);
                }}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
