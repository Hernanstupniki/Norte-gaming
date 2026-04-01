import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryGrid } from "@/components/home/category-grid";
import { FaqPreview } from "@/components/home/faq-preview";
import { Hero } from "@/components/home/hero";
import { ProductShowcase } from "@/components/home/product-showcase";
import { PromoBanner } from "@/components/home/promo-banner";
import { TrustGrid } from "@/components/home/trust-grid";
import { products } from "@/lib/mock-data";

export default function HomePage() {
  const featured = products.filter((item) => item.isFeatured).slice(0, 4);
  const offers = products.filter((item) => item.badges.includes("oferta")).slice(0, 4);
  const launchPicks = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  return (
    <>
      <Hero />
      <BrandStrip />
      <CategoryGrid />
      <ProductShowcase
        eyebrow="Selección"
        title="Productos destacados"
        description="Lo mejor del catálogo Norte Gaming para subir el nivel de tu setup."
        products={featured}
      />
      <ProductShowcase
        eyebrow="Descuentos"
        title="Ofertas activas"
        description="Promociones por tiempo limitado con financiación."
        products={offers}
      />
      <PromoBanner />
      <ProductShowcase
        eyebrow="Lanzamiento"
        title="Recomendados para empezar"
        description="Selección curada para los primeros pedidos de Norte Gaming."
        products={launchPicks}
      />
      <TrustGrid />
      <FaqPreview />
    </>
  );
}
