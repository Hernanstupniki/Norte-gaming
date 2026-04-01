import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/shop/product-detail-client";
import { fetchCatalogProducts, fetchProductDetailBySlug } from "@/lib/backend-api";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await fetchProductDetailBySlug(slug);

  if (!detail) {
    notFound();
  }

  const catalogProducts = await fetchCatalogProducts().catch(() => []);

  const related = catalogProducts
    .filter((item) => item.category === detail.product.category && item.id !== detail.product.id)
    .slice(0, 4);

  return (
    <ProductDetailClient
      product={detail.product}
      related={related}
      reviewComments={detail.reviewComments}
    />
  );
}
