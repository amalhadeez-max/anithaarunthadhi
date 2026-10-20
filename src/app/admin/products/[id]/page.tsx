import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        videos: { orderBy: { sortOrder: "asc" } },
        compat: true,
      },
    }),
    prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();
  const specs = Object.entries((product.specs as Record<string, string>) ?? {}).map(([key, value]) => ({
    key,
    value: String(value),
  }));
  return (
    <>
      <PageHeader title={`Edit: ${product.name}`} description={`SKU ${product.sku}`} />
      <ProductForm
        brands={brands}
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          brandId: product.brandId,
          categoryId: product.categoryId,
          description: product.description,
          specs,
          price: toNumber(product.price),
          discountPrice: product.discountPrice ? toNumber(product.discountPrice) : null,
          stock: product.stock,
          isActive: product.isActive,
          images: product.images.map((i) => i.url),
          videos: product.videos.map((v) => ({ kind: v.kind as "upload" | "youtube", url: v.url })),
          variantIds: product.compat.map((c) => c.vehicleVariantId),
        }}
      />
    </>
  );
}
