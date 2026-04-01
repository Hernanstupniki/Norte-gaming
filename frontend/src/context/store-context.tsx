"use client";

import {
  useCallback,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { products } from "@/lib/mock-data";
import { getWishlistProductIds, logoutUser, toggleWishlist, UserSession } from "@/lib/user-api";
import { CartItem, Product } from "@/types";

interface AuthState {
  isLoggedIn: boolean;
  userId: string;
  role: "ADMIN" | "CLIENT" | "";
  accessToken: string;
  refreshToken: string;
  name: string;
  email: string;
}

interface StoreContextValue {
  cart: CartItem[];
  favorites: string[];
  isCartOpen: boolean;
  auth: AuthState;
  favoriteNotice: string | null;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (productId: string, productData?: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleFavorite: (productId: string) => void;
  dismissFavoriteNotice: () => void;
  setCatalogProducts: (catalogProducts: Product[]) => void;
  login: (session: UserSession) => void;
  logout: () => void;
  cartCount: number;
  favoritesCount: number;
  cartProducts: Array<{ product: Product; quantity: number }>;
  subtotal: number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const STORAGE_KEY = "norte-gaming-store";

interface PersistedStore {
  cart: CartItem[];
  favorites: string[];
  auth: AuthState;
}

const defaultPersistedStore: PersistedStore = {
  cart: [],
  favorites: [],
  auth: {
    isLoggedIn: false,
    userId: "",
    role: "",
    accessToken: "",
    refreshToken: "",
    name: "",
    email: "",
  },
};

const getPersistedStore = (): PersistedStore => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultPersistedStore;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    return {
      cart: parsed.cart ?? [],
      favorites: parsed.favorites ?? [],
      auth: parsed.auth ?? defaultPersistedStore.auth,
    };
  } catch {
    return defaultPersistedStore;
  }
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(defaultPersistedStore.cart);
  const [favorites, setFavorites] = useState<string[]>(defaultPersistedStore.favorites);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>(defaultPersistedStore.auth);
  const [favoriteNotice, setFavoriteNotice] = useState<string | null>(null);
  const [productCatalog, setProductCatalog] = useState<Record<string, Product>>(
    () =>
      Object.fromEntries(
        products.map((product) => [product.id, product]),
      ),
  );
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    startTransition(() => {
      const persistedStore = getPersistedStore();
      setCart(persistedStore.cart);
      setFavorites(persistedStore.favorites);
      setAuth(persistedStore.auth);
      setHasHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const payload = JSON.stringify({ cart, favorites, auth });
    window.localStorage.setItem(STORAGE_KEY, payload);
  }, [auth, cart, favorites, hasHydrated]);

  const setCatalogProducts = useCallback((catalogProducts: Product[]) => {
    setProductCatalog((previous) => ({
      ...previous,
      ...Object.fromEntries(catalogProducts.map((product) => [product.id, product])),
    }));
  }, []);

  const addToCart = (productId: string, productData?: Product) => {
    if (productData) {
      setProductCatalog((previous) => ({
        ...previous,
        [productData.id]: productData,
      }));
    }

    setCart((previous) => {
      const existing = previous.find((item) => item.productId === productId);
      if (existing) {
        return previous.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...previous, { productId, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((previous) => previous.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((previous) =>
      previous.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const toggleFavorite = (productId: string) => {
    const isCurrentlyFavorite = favorites.includes(productId);
    setFavoriteNotice(
      isCurrentlyFavorite
        ? "Producto eliminado de guardados"
        : "Producto guardado",
    );

    if (auth.accessToken) {
      void toggleWishlist(auth.accessToken, productId)
        .then((favoriteIds) => {
          setFavorites(favoriteIds);
        })
        .catch(() => {
          setFavoriteNotice("No se pudo actualizar guardados");
          setFavorites((previous) =>
            previous.includes(productId)
              ? previous.filter((id) => id !== productId)
              : [...previous, productId],
          );
        });
      return;
    }

    setFavorites((previous) =>
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId],
    );
  };

  useEffect(() => {
    if (!favoriteNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFavoriteNotice(null);
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [favoriteNotice]);

  const login = (session: UserSession) => {
    const normalizedName = `${session.user.firstName} ${session.user.lastName}`.trim();
    setAuth({
      isLoggedIn: true,
      userId: session.user.id,
      role: session.user.role,
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      email: session.user.email,
      name: normalizedName || "Cliente",
    });

    void getWishlistProductIds(session.tokens.accessToken)
      .then((favoriteIds) => setFavorites(favoriteIds))
      .catch(() => {
        // Si falla la sincronización, mantenemos favoritos locales.
      });
  };

  const logout = () => {
    const accessToken = auth.accessToken;
    if (accessToken) {
      void logoutUser(accessToken).catch(() => {
        // Si falla en backend, igual cerramos sesión local.
      });
    }

    setAuth({
      isLoggedIn: false,
      userId: "",
      role: "",
      accessToken: "",
      refreshToken: "",
      email: "",
      name: "",
    });
  };

  const cartProducts = useMemo(
    () =>
      cart
        .map((item) => ({
          quantity: item.quantity,
          product: productCatalog[item.productId],
        }))
        .filter((entry): entry is { product: Product; quantity: number } =>
          Boolean(entry.product),
        ),
    [cart, productCatalog],
  );

  const subtotal = useMemo(
    () =>
      cartProducts.reduce(
        (sum, entry) => sum + entry.product.price * entry.quantity,
        0,
      ),
    [cartProducts],
  );

  const value: StoreContextValue = {
    cart,
    favorites,
    isCartOpen,
    auth,
    favoriteNotice,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleFavorite,
    dismissFavoriteNotice: () => setFavoriteNotice(null),
    setCatalogProducts,
    login,
    logout,
    cartCount: cartProducts.reduce((acc, entry) => acc + entry.quantity, 0),
    favoritesCount: favorites.length,
    cartProducts,
    subtotal,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
};
