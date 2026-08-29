"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  adminDeleteProduct,
  adminListProducts,
  AdminProductItem,
} from "@/lib/admin-api";

type ListFilter = "all" | "active" | "low-stock" | "out-of-stock";

const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export function ProductsManageClient() {
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalProducts = products.length;
  const differentTypesCount = new Set(products.map((item) => item.categoryId)).size;
  const inStockProducts = products.filter((item) => item.stock > 0).length;
  const outOfStockProducts = products.filter((item) => item.stock <= 0).length;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (listFilter === "active") return product.isActive;
      if (listFilter === "low-stock") return product.stock > 0 && product.stock <= 5;
      if (listFilter === "out-of-stock") return product.stock <= 0;
      return true;
    });
  }, [listFilter, products]);

  const loadProducts = async (query = "") => {
    setLoadingProducts(true);
    try {
      const result = await adminListProducts(query);
      setProducts(result.data);
      setSessionInvalid(false);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message.includes("401")) {
        setSessionInvalid(true);
      }
      setError(`No se pudo cargar el listado: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const handleDelete = async (product: AdminProductItem) => {
    const confirmed = window.confirm(`Eliminar producto: ${product.name}?`);
    if (!confirmed) return;

    try {
      await adminDeleteProduct(product.id);
      await loadProducts(search);
    } catch (err) {
      setError(`No se pudo eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadProducts(search);
  };

  if (sessionInvalid) {
    return (
      <div className="mx-auto max-w-md rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Panel de acceso</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-zinc-950">Sesión expirada</h2>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600">Volvé a iniciar sesión para seguir usando el panel.</p>
        <a href="/admin/login" className="mt-4 sm:mt-6 inline-block rounded-lg bg-black px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white">
          Ir al login
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {[
          { label: "Total", value: totalProducts },
          { label: "Diferentes tipos", value: differentTypesCount },
          { label: "En stock", value: inStockProducts },
          { label: "Sin stock", value: outOfStockProducts },
        ].map((stat) => (
          <article key={stat.label} className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">{stat.label}</p>
            <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-black leading-none text-zinc-950">{stat.value}</p>
          </article>
        ))}
      </div>

      {error ? <div className="rounded-lg bg-red-100 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-800">{error}</div> : null}

      <div className="space-y-4 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-zinc-950">Listado de productos</h3>
            <p className="text-xs sm:text-sm text-zinc-600">
              Mostrando {filteredProducts.length} de {products.length} productos.
            </p>
          </div>
          <Link
            href="/admin/productos/nuevo"
            className="w-full sm:w-auto rounded-md border border-black bg-black px-3 py-2 text-center text-xs sm:text-sm font-semibold text-white"
          >
            Nuevo producto
          </Link>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtros de stock">
          {[
            { id: "all", label: "Todos" },
            { id: "active", label: "Activos" },
            { id: "low-stock", label: "Stock bajo" },
            { id: "out-of-stock", label: "Sin stock" },
          ].map((filter) => {
            const active = listFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setListFilter(filter.id as ListFilter)}
                aria-pressed={active}
                className={`rounded-full px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-widest transition ${
                  active
                    ? "border border-black bg-black text-white"
                    : "border border-zinc-300 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o descripción"
            className="w-full min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-zinc-900"
          />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-md bg-black px-3 py-2 text-xs sm:text-sm font-semibold text-white">Buscar</button>
            <button
              type="button"
              onClick={async () => {
                setSearch("");
                await loadProducts("");
              }}
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-700"
            >
              Limpiar
            </button>
          </div>
        </form>

        {loadingProducts ? <p className="text-sm text-zinc-600">Cargando productos...</p> : null}

        <div className="space-y-3 md:hidden">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className={`rounded-xl border border-zinc-200 bg-zinc-50 p-3 ${product.stock <= 0 ? "bg-red-50/60" : product.stock <= 5 ? "bg-amber-50/60" : "bg-zinc-50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-950">{product.name}</p>
                  <p className="text-xs text-zinc-600">SKU: {product.sku}</p>
                  <p className="mt-1 text-xs text-zinc-600">{product.brand?.name || "-"} · {product.category?.name || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-600">Stock</p>
                  <p className="text-sm font-bold text-zinc-950">{product.stock}</p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-zinc-600">Precio</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {product.currentPrice !== null && product.currentPrice !== undefined
                      ? formatArs(Number(product.currentPrice))
                      : "Sin definir"}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    product.isActive ? "bg-zinc-100 text-zinc-800" : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {product.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href={`/admin/productos/${product.slug}/editar`}
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold text-zinc-700"
                  aria-label={`Editar ${product.name}`}
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(product)}
                  className="flex-1 rounded-md border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700"
                  aria-label={`Eliminar ${product.name}`}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}

          {filteredProducts.length === 0 && !loadingProducts ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500">
              No hay productos para mostrar.
            </p>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 md:block">
          <table className="w-full min-w-[720px] border-collapse text-xs sm:text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-2 sm:px-3 py-2">Nombre</th>
                <th className="px-2 sm:px-3 py-2">SKU</th>
                <th className="px-2 sm:px-3 py-2">Marca</th>
                <th className="px-2 sm:px-3 py-2">Categoría</th>
                <th className="px-2 sm:px-3 py-2">Precio</th>
                <th className="px-2 sm:px-3 py-2">Stock</th>
                <th className="px-2 sm:px-3 py-2">Estado</th>
                <th className="px-2 sm:px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className={`border-t border-zinc-200 ${product.stock <= 0 ? "bg-red-50/40" : product.stock <= 5 ? "bg-amber-50/40" : ""}`}
                >
                  <td className="px-2 sm:px-3 py-2 font-medium text-zinc-900">{product.name}</td>
                  <td className="px-2 sm:px-3 py-2 text-zinc-700">{product.sku}</td>
                  <td className="px-2 sm:px-3 py-2 text-zinc-700">{product.brand?.name || "-"}</td>
                  <td className="px-2 sm:px-3 py-2 text-zinc-700">{product.category?.name || "-"}</td>
                  <td className="px-2 sm:px-3 py-2 text-zinc-700">
                    {product.currentPrice !== null && product.currentPrice !== undefined
                      ? formatArs(Number(product.currentPrice))
                      : "Sin definir"}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-zinc-700">
                    <span
                      className={`inline-flex min-w-12 justify-center rounded-full px-2 py-1 text-xs font-semibold ${
                        product.stock <= 0
                          ? "bg-red-100 text-red-700"
                          : product.stock <= 5
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-zinc-700">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        product.isActive ? "bg-zinc-100 text-zinc-800" : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                      <Link href={`/admin/productos/${product.slug}/editar`} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] sm:text-xs font-semibold text-zinc-700" aria-label={`Editar ${product.name}`}>Editar</Link>
                      <button type="button" onClick={() => void handleDelete(product)} className="rounded-md border border-red-300 px-2 py-1 text-[11px] sm:text-xs font-semibold text-red-700" aria-label={`Eliminar ${product.name}`}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !loadingProducts ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-zinc-500">No hay productos para mostrar.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
