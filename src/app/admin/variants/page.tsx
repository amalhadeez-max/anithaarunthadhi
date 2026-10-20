import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { BrandPicker } from "@/components/admin/brand-picker";
import { ModelCard, ModelFormDialog } from "@/components/admin/variant-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { Car } from "lucide-react";

export default async function AdminVariantsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand: brandId } = await searchParams;
  const brands = await prisma.brand.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, segments: true },
  });
  const selected = brandId ? brands.find((b) => b.id === brandId) : undefined;

  const models = selected
    ? await prisma.vehicleModel.findMany({
        where: { brandId: selected.id },
        orderBy: [{ segment: "asc" }, { name: "asc" }],
        include: {
          variants: { select: { id: true, year: true, vehicleType: true }, orderBy: { year: "asc" } },
          _count: { select: { variants: true } },
        },
      })
    : [];
  const compatCounts = selected
    ? await prisma.productVariantCompat.groupBy({
        by: ["vehicleVariantId"],
        where: { variant: { model: { brandId: selected.id } } },
        _count: true,
      })
    : [];
  const compatByVariant = new Map(compatCounts.map((c) => [c.vehicleVariantId, c._count]));

  const segments = selected?.segments.map((s) => s.segment) ?? [];

  return (
    <>
      <PageHeader
        title="Vehicle Variants"
        description="Pick a brand, then manage its models, year ranges and vehicle types. Products are linked to these variants."
        actions={selected ? <ModelFormDialog brandId={selected.id} segments={segments} /> : undefined}
      />
      <div className="mb-4">
        <Suspense>
          <BrandPicker brands={brands} value={selected?.id} />
        </Suspense>
      </div>
      {!selected ? (
        <EmptyState
          icon={<Car />}
          title="Select a brand"
          description="Choose a brand above to view and edit its models and variants."
        />
      ) : models.length === 0 ? (
        <EmptyState
          icon={<Car />}
          title={`No models for ${selected.name}`}
          description="Add the first model, then bulk-add its year range."
          action={<ModelFormDialog brandId={selected.id} segments={segments} />}
        />
      ) : (
        <div className="space-y-3">
          {models.map((m) => (
            <ModelCard
              key={m.id}
              brandId={selected.id}
              segments={segments}
              model={{
                id: m.id,
                name: m.name,
                slug: m.slug,
                segment: m.segment,
                imageUrl: m.imageUrl,
                isActive: m.isActive,
                variants: m.variants,
                compatCount: m.variants.reduce((n, v) => n + (compatByVariant.get(v.id) ?? 0), 0),
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
