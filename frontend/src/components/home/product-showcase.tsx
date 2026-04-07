import { Product } from "@/types";
import { SectionTitle } from "@/components/common/section-title";
import { ProductCard } from "@/components/common/product-card";

interface ProductShowcaseProps {
  title: string;
  eyebrow: string;
  description: string;
  products: Product[];
}

export function ProductShowcase({
  title,
  eyebrow,
  description,
  products,
}: ProductShowcaseProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
      <SectionTitle eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
