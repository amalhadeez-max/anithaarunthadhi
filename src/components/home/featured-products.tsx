import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCard as ProductCardT } from "@/types";
import { ProductCard } from "@/components/products/product-card";
import { SectionHeading } from "./section-heading";

export function FeaturedProducts({ products }: { products: ProductCardT[] }) {
  if (products.length === 0) return null;
  return (
    <section className="container pt-10 md:pt-12" aria-labelledby="featured-h">
      <SectionHeading
        id="featured-h"
        title="Featured Products"
        subtitle="Premium quality products for your vehicle"
        action={
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium hover:text-brand">
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:gap-[18px] lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 2} />
        ))}
      </div>
    </section>
  );
}
