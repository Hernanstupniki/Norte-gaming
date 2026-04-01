import { CreateProductDto } from "@/types/backend";

interface CreateProductResponse {
  id: string;
  slug: string;
  [key: string]: unknown;
}

export interface AdminProductItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  currentPrice: string | number;
  previousPrice?: string | number | null;
  sku: string;
  stock: number;
  isFeatured: boolean;
  isOnOffer: boolean;
  isActive: boolean;
  brandId: string;
  categoryId: string;
  brand?: { id: string; name: string };
  category?: { id: string; name: string };
  images?: Array<{ url: string; alt?: string | null }>;
  specs?: Array<{ name: string; value: string }>;
}

export interface AdminProductsResponse {
  data: AdminProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const getAdminProxyUrl = (path: string) => `/api/admin/proxy/${path}`;

const readApiError = async (response: Response, fallback: string) => {
  const error = await response.json().catch(() => ({}));
  const rawMessage = Array.isArray(error?.message)
    ? error.message.join(" | ")
    : error?.message;
  return rawMessage || `${fallback} (${response.status})`;
};

export const adminCreateProduct = async (
  productData: CreateProductDto,
): Promise<CreateProductResponse> => {
  const response = await fetch(getAdminProxyUrl("products"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Error creating product"));
  }

  return response.json();
};

export const adminLoginUser = async (
  email: string,
  password: string,
): Promise<{ accessToken: string }> => {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  const data = await response.json();
  const accessToken = data?.tokens?.accessToken;

  if (!accessToken) {
    throw new Error("Login response missing access token");
  }

  return { accessToken };
};

export const adminGetBrands = async () => {
  const response = await fetch(getAdminProxyUrl("brands/admin/all"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to fetch brands"));
  }

  return response.json();
};

export const adminCreateBrand = async (payload: {
  name: string;
  description?: string;
}) => {
  const response = await fetch(getAdminProxyUrl("brands"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to create brand"));
  }

  return response.json();
};

export const adminGetCategories = async () => {
  const response = await fetch(getAdminProxyUrl("categories/admin/all"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to fetch categories"));
  }

  return response.json();
};

export const adminUploadProductImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(getAdminProxyUrl("uploads/product-image"), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Error uploading image"));
  }

  return response.json() as Promise<{ filename: string; url: string }>;
};

export const adminListProducts = async (query = "") => {
  const encoded = encodeURIComponent(query.trim());
  const response = await fetch(
    `${getAdminProxyUrl("products/admin/all")}?limit=100${encoded ? `&q=${encoded}` : ""}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to fetch products"));
  }

  return (await response.json()) as AdminProductsResponse;
};

export const adminUpdateProduct = async (
  productId: string,
  productData: CreateProductDto,
) => {
  const response = await fetch(getAdminProxyUrl(`products/${productId}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to update product"));
  }

  return response.json();
};

export const adminDeleteProduct = async (productId: string) => {
  const response = await fetch(getAdminProxyUrl(`products/${productId}`), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to delete product"));
  }

  return response.json();
};
