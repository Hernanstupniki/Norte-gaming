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
  variants?: string[];
  viewCount: number;
}

export interface AdminProductsResponse {
  data: AdminProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserItem {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface AdminUsersResponse {
  data: AdminUserItem[];
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

export const adminUpdateProductSoldCount = async (
  productId: string,
  newSoldCount: number,
) => {
  const response = await fetch(getAdminProxyUrl(`products/${productId}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ soldCount: newSoldCount }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to update sales count"));
  }

  return response.json();
};

export const adminRegisterSale = async (
  productId: string,
  quantity: number,
  unitPrice: number,
) => {
  const response = await fetch(getAdminProxyUrl("products/admin/register-sale"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, quantity, unitPrice }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to register sale"));
  }

  return response.json();
};

export const adminGetSalesHistory = async () => {
  const response = await fetch(getAdminProxyUrl("products/admin/sales-history"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to fetch sales history"));
  }

  return response.json();
};

export const adminGetMostViewedProducts = async (limit = 10) => {
  const response = await fetch(
    `${getAdminProxyUrl("products/admin/most-viewed")}?limit=${limit}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to fetch most viewed products"));
  }

  return (await response.json()) as AdminProductItem[];
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

export const adminListUsers = async (params: { page?: number; limit?: number; q?: string } = {}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const q = params.q ? `&search=${encodeURIComponent(params.q)}` : "";
  const response = await fetch(`${getAdminProxyUrl(`users`)}?page=${page}&limit=${limit}${q}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to fetch users"));
  }

  return (await response.json()) as AdminUsersResponse;
};

export const adminSetUserStatus = async (userId: string, isActive: boolean) => {
  const response = await fetch(getAdminProxyUrl(`users/${userId}/status`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to update user status"));
  }

  return response.json() as Promise<AdminUserItem>;
};

export const adminGetUserById = async (userId: string) => {
  const response = await fetch(getAdminProxyUrl(`users/${userId}`), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to fetch user'));
  }
  return response.json() as Promise<AdminUserItem>;
};

export const adminUpdateUser = async (userId: string, payload: Partial<AdminUserItem>) => {
  const body: any = {};
  if (payload.firstName !== undefined) body.firstName = payload.firstName;
  if (payload.lastName !== undefined) body.lastName = payload.lastName;
  if (payload.phone !== undefined) body.phone = payload.phone;
  if (payload.role !== undefined) body.role = payload.role;
  if (payload.isActive !== undefined) body.isActive = payload.isActive;

  const response = await fetch(getAdminProxyUrl(`users/${userId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to update user'));
  }

  return response.json() as Promise<AdminUserItem>;
};

export const adminGetProductBySlug = async (slug: string) => {
  const response = await fetch(getAdminProxyUrl(`products/admin/by-slug/${encodeURIComponent(slug)}`));
  if (!response.ok) {
    const err = new Error('Not found');
    // @ts-ignore
    err.status = response.status;
    throw err;
  }
  return response.json() as Promise<AdminProductItem>;
};

export const adminGetProductBySku = async (sku: string) => {
  const response = await fetch(getAdminProxyUrl(`products/admin/by-sku/${encodeURIComponent(sku)}`));
  if (!response.ok) {
    const err = new Error('Not found');
    // @ts-ignore
    err.status = response.status;
    throw err;
  }
  return response.json() as Promise<AdminProductItem>;
};
