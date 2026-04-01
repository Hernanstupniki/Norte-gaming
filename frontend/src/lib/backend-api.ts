import { Category, Product } from "@/types";
import {
  ApiProduct,
  mapApiCategoryToCategory,
  mapApiProductToProduct,
  mapApiReviewToCardReview,
} from "@/lib/backend-mappers";

interface ProductsResponse {
  data: ApiProduct[];
}

export interface CreateOrderRequest {
  addressId: string;
  shippingMethodId: string;
  couponCode?: string;
  notes?: string;
}

export interface CreateOrderResponse {
  orderNumber: string;
  id: string;
  total: number;
  createdAt: string;
}

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }
  return (await response.json()) as T;
};

export const fetchCatalogProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${getApiBaseUrl()}/products`, {
    cache: "no-store",
  });

  const payload = await parseJson<ProductsResponse>(response);
  return payload.data.map(mapApiProductToProduct);
};

export const fetchCatalogCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${getApiBaseUrl()}/categories`, {
    cache: "no-store",
  });

  const payload = await parseJson<Array<{ name: string; slug: string; description?: string }>>(response);
  const mapped = payload.map(mapApiCategoryToCategory);

  const deduped = new Map(mapped.map((category) => [category.slug, category]));
  return [...deduped.values()];
};

export const fetchCatalogBrands = async (): Promise<string[]> => {
  const response = await fetch(`${getApiBaseUrl()}/brands`, {
    cache: "no-store",
  });

  const payload = await parseJson<Array<{ name: string }>>(response);
  return payload.map((brand) => brand.name);
};

export const fetchProductDetailBySlug = async (slug: string) => {
  const response = await fetch(`${getApiBaseUrl()}/products/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  const payload = await parseJson<ApiProduct>(response);

  return {
    product: mapApiProductToProduct(payload),
    reviewComments: (payload.reviews || []).map(mapApiReviewToCardReview),
  };
};

export const createOrder = async (
  token: string,
  orderData: CreateOrderRequest,
): Promise<CreateOrderResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/orders/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error(`Error creando orden: ${response.status}`);
  }

  return parseJson<CreateOrderResponse>(response);
};
