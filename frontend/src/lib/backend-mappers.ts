import { Category, Product, ProductBadge } from "@/types";

interface ApiBrand {
  name: string;
  slug: string;
}

interface ApiCategory {
  name: string;
  slug: string;
  description?: string;
}

interface ApiProductImage {
  url?: string | null;
  alt?: string | null;
}

interface ApiProductSpec {
  name: string;
  value: string;
}

export interface ApiReview {
  rating: number;
  comment: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  currentPrice: string | number;
  previousPrice?: string | number | null;
  stock: number;
  soldCount: number;
  isFeatured?: boolean;
  isOnOffer?: boolean;
  brand: ApiBrand;
  category: ApiCategory;
  specs: ApiProductSpec[];
  images: ApiProductImage[];
  createdAt?: string;
  reviews?: ApiReview[];
}

const toBadges = (apiProduct: ApiProduct): ProductBadge[] => {
  const badges: ProductBadge[] = [];

  if (Number(apiProduct.stock) <= 0) {
    badges.push("sin-stock");
  }

  if (apiProduct.isOnOffer || Number(apiProduct.previousPrice || 0) > Number(apiProduct.currentPrice)) {
    badges.push("oferta");
  }

  if (apiProduct.isFeatured) {
    badges.push("destacado");
  }

  if (apiProduct.soldCount >= 100) {
    badges.push("mas-vendido");
  }

  if (apiProduct.createdAt) {
    const createdAt = new Date(apiProduct.createdAt).getTime();
    const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    if (ageDays <= 45) {
      badges.push("nuevo");
    }
  }

  return badges;
};

const toInstallments = (_price: number) => "Medios de pago disponibles";

export const mapApiProductToProduct = (apiProduct: ApiProduct): Product => {
  const price = Number(apiProduct.currentPrice);
  const previousPrice = apiProduct.previousPrice ? Number(apiProduct.previousPrice) : undefined;

  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    name: apiProduct.name,
    brand: apiProduct.brand.name,
    category: apiProduct.category.slug || apiProduct.category.name,
    price,
    previousPrice,
    stock: apiProduct.stock,
    installments: toInstallments(price),
    badges: toBadges(apiProduct),
    shortDescription: apiProduct.shortDescription,
    description: apiProduct.description,
    specs: (apiProduct.specs || []).map((spec) => ({
      label: spec.name,
      value: spec.value,
    })),
    images:
      apiProduct.images?.length > 0
        ? apiProduct.images
            .map((image) => image.url || "")
            .filter((url) => url.length > 0)
        : [],
    rating: apiProduct.reviews?.length
      ? Number(
          (
            apiProduct.reviews.reduce((acc, review) => acc + review.rating, 0) /
            apiProduct.reviews.length
          ).toFixed(1),
        )
      : 4.8,
    reviewCount: apiProduct.reviews?.length ?? 0,
    sold: apiProduct.soldCount,
    isFeatured: Boolean(apiProduct.isFeatured),
  };
};

export const mapApiCategoryToCategory = (apiCategory: ApiCategory): Category => {
  const slug = apiCategory.slug || apiCategory.name;
  return {
    slug,
    name: apiCategory.name,
    description: apiCategory.description || `Productos de ${apiCategory.name}`,
    heroLabel: apiCategory.name,
  };
};

export const mapApiReviewToCardReview = (review: ApiReview) => {
  const firstName = review.user?.firstName || "Cliente";
  const lastName = review.user?.lastName || "";
  return {
    name: `${firstName} ${lastName}`.trim(),
    rating: review.rating,
    comment: review.comment,
    verified: true,
  };
};
