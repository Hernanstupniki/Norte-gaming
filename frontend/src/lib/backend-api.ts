import { Category, Product } from "@/types";
import {
  ApiProduct,
  mapApiCategoryToCategory,
  mapApiProductToProduct,
  mapApiReviewToCardReview,
  normalizeBrandName,
} from "@/lib/backend-mappers";

interface ProductsResponse {
  data: ApiProduct[];
  page: number;
  limit: number;
  totalPages: number;
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

export interface CreateContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface UserAddress {
  id: string;
  recipient: string;
  phone: string;
  street: string;
  number: string;
  floor?: string | null;
  apartment?: string | null;
  city: string;
  province: string;
  postalCode: string;
  reference?: string | null;
  isPrimary?: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string | null;
  cost: number | string;
  provinces: string[];
  isActive?: boolean;
}

export interface CreateAddressRequest {
  recipient: string;
  phone: string;
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  city: string;
  province: string;
  postalCode: string;
  reference?: string;
  isPrimary?: boolean;
}

export interface CreatePaymentRequest {
  orderId: string;
  provider: string;
  method: string;
  amount: number;
  currency?: string;
  externalReference?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResponse {
  id: string;
  orderId: string;
  provider: string;
  method: string;
  status: string;
  externalReference?: string | null;
  preferenceId?: string | null;
  initPoint?: string | null;
  message?: string;
}

const getApiBaseUrl = () => {
  const explicitServerApi = process.env.INTERNAL_API_URL || process.env.NEXT_INTERNAL_API_URL;

  // En servidor, priorizar URL explícita; si no existe, usar la pública/local.
  if (typeof window === "undefined") {
    return explicitServerApi || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  }

  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
};

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }
  return (await response.json()) as T;
};

export const fetchCatalogProducts = async (): Promise<Product[]> => {
  const allProducts: ApiProduct[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetch(`${getApiBaseUrl()}/products?page=${page}&limit=100`, {
      cache: "no-store",
    });

    const payload = await parseJson<ProductsResponse>(response);
    allProducts.push(...payload.data);
    totalPages = payload.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return allProducts.map(mapApiProductToProduct);
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
  return [...new Set(payload.map((brand) => normalizeBrandName(brand.name)))].sort((a, b) =>
    a.localeCompare(b, "es-AR"),
  );
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

export const getMyAddresses = async (token: string): Promise<UserAddress[]> => {
  const response = await fetch(`${getApiBaseUrl()}/addresses/me`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJson<UserAddress[]>(response);
};

export const createMyAddress = async (
  token: string,
  payload: CreateAddressRequest,
): Promise<UserAddress> => {
  const response = await fetch(`${getApiBaseUrl()}/addresses/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseJson<UserAddress>(response);
};

export const getShippingMethods = async (province?: string): Promise<ShippingMethod[]> => {
  const params = province ? `?province=${encodeURIComponent(province)}` : "";
  const response = await fetch(`${getApiBaseUrl()}/shipping/methods${params}`, {
    cache: "no-store",
  });

  return parseJson<ShippingMethod[]>(response);
};

export const clearMyCart = async (token: string) => {
  const response = await fetch(`${getApiBaseUrl()}/cart/me`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error limpiando carrito: ${response.status}`);
  }

  return response.json();
};

export const addMyCartItem = async (token: string, productId: string, quantity: number) => {
  const response = await fetch(`${getApiBaseUrl()}/cart/me/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!response.ok) {
    throw new Error(`Error agregando producto al carrito: ${response.status}`);
  }

  return response.json();
};

export const createPayment = async (
  token: string,
  payload: CreatePaymentRequest,
): Promise<CreatePaymentResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error registrando pago: ${response.status}`);
  }

  return parseJson<CreatePaymentResponse>(response);
};

export const createContactInquiry = async (payload: CreateContactRequest) => {
  const response = await fetch(`${getApiBaseUrl()}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;

    const message = Array.isArray(errorPayload?.message)
      ? errorPayload?.message.join(". ")
      : errorPayload?.message || `Error enviando consulta: ${response.status}`;

    throw new Error(message);
  }

  return response.json();
};
