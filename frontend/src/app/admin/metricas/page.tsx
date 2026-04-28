"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminProductItem, adminListProducts } from "@/lib/admin-api";

const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

type CategoryMetric = {
  name: string;
  count: number;
};

export default function AdminMetricasPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await adminListProducts();
        if (!cancelled) {
          setProducts(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar métricas.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const inactive = total - active;
    const outOfStock = products.filter((p) => p.stock <= 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
    const inventoryValue = products.reduce((acc, p) => {
      const price = Number(p.currentPrice || 0);
      return acc + p.stock * (Number.isFinite(price) ? price : 0);
    }, 0);
    const totalSold = products.reduce((acc, p) => acc + Number((p as { soldCount?: number }).soldCount || 0), 0);
    
    // Calcular ganancias totales y por producto
    const totalRevenue = products.reduce((acc, p) => {
      const price = Number(p.currentPrice || 0);
      const sold = Number((p as { soldCount?: number }).soldCount || 0);
      const revenue = price * sold;
      return acc + (Number.isFinite(revenue) ? revenue : 0);
    }, 0);
    const productsWithSales = products.filter((p) => Number((p as { soldCount?: number }).soldCount || 0) > 0).length;
    const avgRevenue = productsWithSales > 0 ? totalRevenue / productsWithSales : 0;

    const byCategoryMap = new Map<string, number>();
    for (const product of products) {
      const category = product.category?.name || "Sin categoría";
      byCategoryMap.set(category, (byCategoryMap.get(category) || 0) + 1);
    }
    const byCategory: CategoryMetric[] = [...byCategoryMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const topSold = [...products]
      .map((p) => ({
        ...p,
        revenue: Number(p.currentPrice || 0) * Number((p as { soldCount?: number }).soldCount || 0),
      }))
      .sort((a, b) => Number((b as { soldCount?: number }).soldCount || 0) - Number((a as { soldCount?: number }).soldCount || 0))
      .slice(0, 6);

    return {
      total,
      active,
      inactive,
      outOfStock,
      lowStock,
      totalUnits,
      inventoryValue,
      totalSold,
      totalRevenue,
      avgRevenue,
      productsWithSales,
      byCategory,
      topSold,
    };
  }, [products]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Métricas</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Panel de métricas</h2>
        <p className="mt-2 text-sm text-zinc-600 md:text-base">
          Resumen de catálogo, stock y rendimiento para tomar decisiones rápidas.
        </p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">Cargando métricas...</div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">{error}</div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Productos totales</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">{metrics.total}</p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Unidades en stock</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">{metrics.totalUnits}</p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Valor inventario</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">{formatArs(metrics.inventoryValue)}</p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Unidades vendidas</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">{metrics.totalSold}</p>
            </article>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Ganancias totales</p>
              <p className="mt-2 text-3xl font-black text-emerald-900">{formatArs(metrics.totalRevenue)}</p>
            </article>
            <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Ganancia promedio</p>
              <p className="mt-2 text-3xl font-black text-blue-900">{formatArs(metrics.avgRevenue)}</p>
              <p className="mt-1 text-xs text-blue-600">({metrics.productsWithSales} productos)</p>
            </article>
            <article className="rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-700">Margen promedio</p>
              <p className="mt-2 text-3xl font-black text-purple-900">
                {metrics.avgRevenue > 0 ? ((metrics.avgRevenue / metrics.inventoryValue) * 100).toFixed(1) : "0"}%
              </p>
              <p className="mt-1 text-xs text-purple-600">(ventas vs inventario)</p>
            </article>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Activos</p>
              <p className="mt-2 text-2xl font-black text-emerald-900">{metrics.active}</p>
            </article>
            <article className="rounded-2xl border border-zinc-300 bg-zinc-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-700">Inactivos</p>
              <p className="mt-2 text-2xl font-black text-zinc-900">{metrics.inactive}</p>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Stock bajo</p>
              <p className="mt-2 text-2xl font-black text-amber-900">{metrics.lowStock}</p>
            </article>
            <article className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-700">Sin stock</p>
              <p className="mt-2 text-2xl font-black text-red-900">{metrics.outOfStock}</p>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-zinc-950">Top productos por ventas</h3>
              <div className="mt-4 space-y-3">
                {metrics.topSold.map((product) => {
                  const soldCount = Number((product as { soldCount?: number }).soldCount || 0);
                  const revenue = (product as { revenue?: number }).revenue || 0;
                  const price = Number(product.currentPrice || 0);
                  return (
                    <div key={product.id} className="rounded-lg border border-zinc-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-900">{product.name}</p>
                          <p className="text-xs text-zinc-500">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-600">{soldCount} unidades</p>
                          <p className="text-sm font-bold text-emerald-700">{formatArs(revenue)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-zinc-600">
                        <span>Precio: {formatArs(price)}</span>
                        <span>
                          {soldCount > 0 ? (
                            <span className="inline-block rounded bg-zinc-100 px-2 py-1">
                              {((revenue / (revenue || 1)) * 100).toFixed(0)}% de ingresos
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {metrics.topSold.length === 0 ? (
                  <p className="text-sm text-zinc-500">Sin datos de ventas todavía.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-zinc-950">Distribución por categoría</h3>
              <div className="mt-4 space-y-3">
                {metrics.byCategory.map((category) => {
                  const width = metrics.total > 0 ? Math.max(8, Math.round((category.count / metrics.total) * 100)) : 0;
                  return (
                    <div key={category.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-semibold text-zinc-800">{category.name}</p>
                        <p className="text-zinc-600">{category.count}</p>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100">
                        <div className="h-2 rounded-full bg-zinc-900" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
                {metrics.byCategory.length === 0 ? (
                  <p className="text-sm text-zinc-500">No hay categorías para mostrar.</p>
                ) : null}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
