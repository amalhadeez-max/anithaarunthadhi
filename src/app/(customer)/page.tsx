import { getSiteSettings } from "@/lib/settings";
import { getActiveBrands, getFeaturedProducts, getRecentReviews } from "@/lib/catalogue";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { VehicleFinder } from "@/components/home/vehicle-finder";
import { CategoryCards } from "@/components/home/category-cards";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrandStrip } from "@/components/home/brand-strip";
import { TrustBanner } from "@/components/home/trust-banner";
import { Testimonials } from "@/components/home/testimonials";
import { Newsletter } from "@/components/home/newsletter";

export default async function HomePage() {
  const [s, brands, featured, reviews] = await Promise.all([
    getSiteSettings(),
    getActiveBrands().catch(() => []),
    getFeaturedProducts(4).catch(() => []),
    getRecentReviews(6).catch(() => []),
  ]);

  return (
    <>
      <HeroCarousel />
      <VehicleFinder brands={brands} />
      <CategoryCards />
      <FeaturedProducts products={featured} />
      <BrandStrip brands={brands} />
      <TrustBanner />

      <section className="container flex flex-col gap-8 pt-8 lg:flex-row lg:gap-10" aria-label="Customers and newsletter">
        <Testimonials items={reviews} />
        <Newsletter />
      </section>

      {s.homeDescription && (
        <section className="container pt-10">
          <p className="mx-auto max-w-3xl text-center text-[15px] leading-7 text-neutral-600">{s.homeDescription}</p>
        </section>
      )}
    </>
  );
}
