"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminProductItem, adminListProducts, adminGetSalesHistory } from "@/lib/admin-api";

interface SalesRecord {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

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
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsResult, salesResult] = await Promise.all([
          adminListProducts(),
          adminGetSalesHistory(),
        ]);
        if (!cancelled) {
          setProducts(productsResult.data);
          setSales(salesResult);
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

    // Calcular ganancias desde la tabla SalesRecord
    const totalRevenue = sales.reduce((acc, s) => {
      const price = Number(s.totalPrice || 0);
      return acc + (Number.isFinite(price) ? price : 0);
    }, 0);

    const totalSold = sales.reduce((acc, s) => acc + Number(s.quantity || 0), 0);
    const salesWithRevenue = sales.length;
    const avgRevenue = salesWithRevenue > 0 ? totalRevenue / salesWithRevenue : 0;

    const byCategoryMap = new Map<string, number>();
    for (const product of products) {
      const category = product.category?.name || "Sin categoría";
      byCategoryMap.set(category, (byCategoryMap.get(category) || 0) + 1);
    }
    const byCategory: CategoryMetric[] = [...byCategoryMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Top productos por ingresos totales (desde SalesRecord)
    const productRevenueMap = new Map<string, { revenue: number; soldCount: number; name: string; sku: string }>();
    sales.forEach((s) => {
      const productId = s.productId;
      const current = productRevenueMap.get(productId) || {
        revenue: 0,
        soldCount: 0,
        name: s.product?.name || "Producto desconocido",
        sku: s.product?.sku || "N/A",
      };
      current.revenue += Number(s.totalPrice || 0);
      current.soldCount += Number(s.quantity || 0);
      productRevenueMap.set(productId, current);
    });

    const topSold = [...productRevenueMap.entries()]
      .map(([productId, data]) => ({
        id: productId,
        name: data.name,
        sku: data.sku,
        revenue: data.revenue,
        soldCount: data.soldCount,
      }))
      .sort((a, b) => b.revenue - a.revenue)
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
      salesWithRevenue,
      byCategory,
      topSold,
    };
  }, [products, sales]);

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
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Ganancia promedio por venta</p>
              <p className="mt-2 text-3xl font-black text-blue-900">{formatArs(metrics.avgRevenue)}</p>
              <p className="mt-1 text-xs text-blue-600">({metrics.salesWithRevenue} ventas registradas)</p>
            </article>
            <article className="rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-700">Rendimiento ventas</p>
              <p className="mt-2 text-3xl font-black text-purple-900">
                {metrics.inventoryValue > 0 ? ((metrics.totalRevenue / metrics.inventoryValue) * 100).toFixed(1) : "0"}%
              </p>
              <p className="mt-1 text-xs text-purple-600">(ingresos vs inventario)</p>
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
                  const revenue = (product as { revenue?: number }).revenue || 0;
                  const soldCount = (product as { soldCount?: number }).soldCount || 0;
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
                        <span>Precio promedio: {formatArs(revenue / (soldCount || 1))}</span>
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
