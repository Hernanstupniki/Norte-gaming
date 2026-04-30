"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchCatalogBrands, fetchCatalogCategories, fetchCatalogProducts } from "@/lib/backend-api";
import { formatARS } from "@/lib/utils";
import { ProductCard } from "@/components/common/product-card";
import { useStore } from "@/context/store-context";
import { Category, Product } from "@/types";

type SortMode = "destacados" | "precio-asc" | "precio-desc" | "mas-vendidos" | "nuevos";

const normalizeCategorySlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const toCanonicalCategorySlug = (value: string) => {
  const normalized = normalizeCategorySlug(value).replace(/-gamer$/, "");

  // Group keyboard variants like "teclados-gamer" under the single "teclados" category.
  if (normalized.includes("teclad")) {
    return "teclados";
  }

  if (normalized.includes("auricular")) {
    return "auriculares";
  }

  if (normalized.includes("mousepad")) {
    return "mousepads";
  }

  if (normalized === "mouse" || normalized === "mouses") {
    return "mouse";
  }

  return normalized;
};

export function Storefront() {
  const params = useSearchParams();
  const { auth, favorites, setCatalogProducts } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("categoria") || "all");
  const [brand, setBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState(950000);
  const [priceLimit, setPriceLimit] = useState(950000);
  const [sort, setSort] = useState<SortMode>("destacados");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const closeMobileFilters = () => {
    setMobileFiltersOpen(false);
  };

  const onlySaved =
    params.get("guardados") === "true" || params.get("favoritos") === "true";

  useEffect(() => {
    setCategory(params.get("categoria") || "all");
    setSearch(params.get("q") || "");
  }, [params]);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [catalogProducts, catalogCategories, catalogBrands] = await Promise.all([
          fetchCatalogProducts(),
          fetchCatalogCategories(),
          fetchCatalogBrands(),
        ]);

        if (!isMounted) {
          return;
        }

        const maxProductPrice = Math.max(...catalogProducts.map((item) => item.price), 950000);

        const inferredBrands = [...new Set(catalogProducts.map((product) => product.brand))];
        const mergedBrands = [...new Set([...catalogBrands, ...inferredBrands])].sort();

        const inferredCategories = [...new Set(catalogProducts.map((product) => product.category))]
          .map((slug) => ({
            slug: toCanonicalCategorySlug(slug),
            name: toCanonicalCategorySlug(slug)
              .split("-")
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" "),
            description: `Productos de ${toCanonicalCategorySlug(slug)}`,
            heroLabel: toCanonicalCategorySlug(slug),
          }));

        const mergedCategoriesMap = new Map(
          [...catalogCategories, ...inferredCategories].map((category) => [
            toCanonicalCategorySlug(category.slug),
            {
              ...category,
              slug: toCanonicalCategorySlug(category.slug),
              name:
                toCanonicalCategorySlug(category.slug) === "teclados"
                  ? "Teclados"
                  : category.name,
            },
          ]),
        );

        const mergedCategories = [...mergedCategoriesMap.values()].sort((a, b) =>
          a.name.localeCompare(b.name, "es-AR"),
        );

        setProducts(catalogProducts);
        setCategories(mergedCategories);
        setBrands(mergedBrands);
        setPriceLimit(maxProductPrice);
        setMaxPrice(maxProductPrice);
        setCatalogProducts(catalogProducts);
      } catch {
        if (!isMounted) {
          return;
        }
        setLoadError("No pudimos cargar el catálogo desde el backend.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [setCatalogProducts]);

  const filtered = useMemo(() => {
    let result = products.filter((product) => {
      const matchSearch = `${product.name} ${product.brand} ${product.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchCategory =
        category === "all" ||
        toCanonicalCategorySlug(product.category) === toCanonicalCategorySlug(category);
      const matchBrand = brand === "all" || product.brand === brand;
      const matchPrice = product.price <= maxPrice;
      const matchFavorite = !onlySaved || favorites.includes(product.id);
      return matchSearch && matchCategory && matchBrand && matchPrice && matchFavorite;
    });

    switch (sort) {
      case "precio-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "precio-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "mas-vendidos":
        result = [...result].sort((a, b) => b.sold - a.sold);
        break;
      case "nuevos":
        result = [...result].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
        break;
      default:
        result = [...result].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
    }

    return result;
  }, [brand, category, maxPrice, onlySaved, favorites, products, search, sort]);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 md:grid-cols-[280px_1fr] md:px-6">
      <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((current) => !current)}
          className="flex w-full items-center justify-between md:hidden"
          aria-expanded={mobileFiltersOpen}
          aria-label="Mostrar filtros"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Filtros</span>
          <span className="text-sm font-bold text-zinc-700">{mobileFiltersOpen ? "-" : "+"}</span>
        </button>
        <p className="hidden text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 md:block">Filtros</p>
        <div className={`mt-4 space-y-4 ${mobileFiltersOpen ? "block" : "hidden"} md:block`}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Buscar</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  closeMobileFilters();
                }
              }}
              placeholder="Mouse, teclado, marca..."
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Categoría</label>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                closeMobileFilters();
              }}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="all">Todas</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Marca</label>
            <select
              value={brand}
              onChange={(event) => {
                setBrand(event.target.value);
                closeMobileFilters();
              }}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="all">Todas</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Precio máximo: {formatARS(maxPrice)}
            </label>
            <input
              type="range"
              min={10000}
              max={priceLimit}
              step={10000}
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              onMouseUp={closeMobileFilters}
              onTouchEnd={closeMobileFilters}
              className="mt-2 w-full accent-red-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Ordenar por</label>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortMode);
                closeMobileFilters();
              }}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="destacados">Destacados</option>
              <option value="precio-asc">Precio menor a mayor</option>
              <option value="precio-desc">Precio mayor a menor</option>
              <option value="mas-vendidos">Recomendados</option>
              <option value="nuevos">Nuevos</option>
            </select>
          </div>
        </div>
      </aside>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">
            {onlySaved ? "Tus guardados" : "Catálogo Norte Gaming"}
          </h1>
          <p className="text-sm text-zinc-600">{filtered.length} productos encontrados</p>
        </div>

        {loadError ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {loadError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">
            Cargando productos...
          </div>
        ) : null}

        {!isLoading && onlySaved && !auth.isLoggedIn ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-zinc-600">
            Tenés que iniciar sesión para ver y guardar productos.
          </div>
        ) : null}

        {!isLoading && (!onlySaved || auth.isLoggedIn) && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-zinc-600">
            No encontramos productos con esos filtros.
          </div>
        ) : null}

        {!isLoading && (!onlySaved || auth.isLoggedIn) && filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
