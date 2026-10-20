import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { BrandFormDialog } from "@/components/admin/brand-form";
import { BrandsTable } from "@/components/admin/brands-table";
import { Button } from "@/components/ui/button";

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const sp = await searchParams;
  const showDeleted = sp.deleted === "1";
  const brands = await prisma.brand.findMany({
    where: showDeleted ? {} : { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { segments: true, _count: { select: { products: true, models: true } } },
  });
  const rows = brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl,
    sortOrder: b.sortOrder,
    isActive: b.isActive,
    segments: b.segments.map((s) => s.segment),
    productCount: b._count.products,
    modelCount: b._count.models,
    deletedAt: b.deletedAt?.toISOString() ?? null,
  }));
  return (
    <>
      <PageHeader
        title="Brands / Models"
        description="Brands shown on the home grid. Manage models, years and types under Vehicle Variants."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={showDeleted ? "/admin/brands" : "/admin/brands?deleted=1"}>
                {showDeleted ? "Hide deleted" : "Show deleted"}
              </Link>
            </Button>
            <BrandFormDialog />
          </>
        }
      />
      <BrandsTable rows={rows} />
    </>
  );
}
