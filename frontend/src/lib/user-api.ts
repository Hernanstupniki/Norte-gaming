const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "CLIENT";
}

export interface UserSession {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface WishlistResponse {
  items?: Array<{
    productId?: string;
    product?: { id?: string };
  }>;
}

const getErrorMessage = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => ({}));
  const message = Array.isArray(payload?.message)
    ? payload.message.join(" | ")
    : payload?.message;
  return message || `${fallback} (${response.status})`;
};

const request = async <T>(
  path: string,
  options: RequestInit,
  fallbackError: string,
): Promise<T> => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, options);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallbackError));
  }
  return (await response.json()) as T;
};

export const loginUser = async (email: string, password: string): Promise<UserSession> => {
  return request<UserSession>(
    "/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    "No se pudo iniciar sesión",
  );
};

export const registerUser = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<UserSession> => {
  return request<UserSession>(
    "/auth/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo crear la cuenta",
  );
};

export const forgotPasswordUser = async (email: string): Promise<{ message: string; mockToken?: string }> => {
  return request<{ message: string; mockToken?: string }>(
    "/auth/forgot-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
    "No se pudo enviar la recuperación",
  );
};

export const resetPasswordUser = async (token: string, newPassword: string): Promise<{ message: string }> => {
  return request<{ message: string }>(
    "/auth/reset-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    },
    "No se pudo restablecer la contraseña",
  );
};

export const logoutUser = async (accessToken: string) => {
  return request<{ message: string }>(
    "/auth/logout",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
    "No se pudo cerrar sesión",
  );
};

export const getWishlistProductIds = async (accessToken: string): Promise<string[]> => {
  const response = await request<WishlistResponse>(
    "/wishlist/me",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
    "No se pudo obtener guardados",
  );

  return (response.items || [])
    .map((item) => item.productId || item.product?.id)
    .filter((id): id is string => Boolean(id));
};

export const toggleWishlist = async (accessToken: string, productId: string): Promise<string[]> => {
  const response = await request<{ wishlist?: WishlistResponse }>(
    "/wishlist/me/toggle",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ productId }),
    },
    "No se pudo actualizar guardados",
  );

  return (response.wishlist?.items || [])
    .map((item) => item.productId || item.product?.id)
    .filter((id): id is string => Boolean(id));
};