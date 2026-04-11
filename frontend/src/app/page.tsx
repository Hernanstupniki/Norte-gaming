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
        title="Variedad en periféricos gamer"
        description="Mouse, teclados, auriculares y monitores originales para armar tu setup a tu medida."
        products={featured}
      />
      <ProductShowcase
        eyebrow="Ofertas"
        title="Ofertas activas"
        description="Productos en oferta por tiempo limitado."
        products={offers}
      />
      <TrustGrid />
    </>
  );
}
