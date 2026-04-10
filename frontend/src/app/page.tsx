import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryGrid } from "@/components/home/category-grid";
import { Hero } from "@/components/home/hero";
import { ProductShowcase } from "@/components/home/product-showcase";
import { TrustGrid } from "@/components/home/trust-grid";
import { fetchCatalogProducts } from "@/lib/backend-api";

export default async function HomePage() {
  const products = await fetchCatalogProducts();

  const featured = products.filter((item) => item.isFeatured).slice(0, 4);
  const activeOffers = products.filter((item) => Boolean(item.previousPrice)).slice(0, 4);
  const fallbackOffers = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const offers = activeOffers.length > 0 ? activeOffers : fallbackOffers;

  return (
    <>
      <Hero />
      <BrandStrip />
      <CategoryGrid />
      <ProductShowcase
        eyebrow="Destacados"
        title="Periféricos gamer seleccionados de verdad"
        description="Mouse, teclados, auriculares y monitores elegidos para mejorar tu setup con rendimiento real."
        products={featured}
      />
      <ProductShowcase
        eyebrow="Ofertas"
        title="Ofertas activas"
        description="Oportunidades reales en productos originales, con stock y precio claro sin vueltas."
        products={offers}
      />
      <TrustGrid />
    </>
  );
}
