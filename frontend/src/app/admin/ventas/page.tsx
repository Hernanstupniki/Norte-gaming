"use client";

import { useEffect, useState } from "react";
import { AdminProductItem, adminListProducts, adminUpdateProductSoldCount } from "@/lib/admin-api";

interface SaleRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  timestamp: Date;
}

export default function AdminVentasPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);

  // Cargar productos
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await adminListProducts();
        if (!cancelled) {
          setProducts(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error cargando productos");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedProductId || !quantity) {
      setError("Selecciona producto y cantidad");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError("Cantidad debe ser mayor a 0");
      return;
    }

    setSubmitting(true);

    try {
      const product = products.find((p) => p.id === selectedProductId);
      if (!product) {
        setError("Producto no encontrado");
        return;
      }

      const currentSoldCount = Number((product as { soldCount?: number }).soldCount || 0);
      const newSoldCount = currentSoldCount + qty;

      await adminUpdateProductSoldCount(selectedProductId, newSoldCount);

      // Agregar a historial de ventas
      const newSale: SaleRecord = {
        id: `${Date.now()}`,
        productId: selectedProductId,
        productName: product.name,
        quantity: qty,
        timestamp: new Date(),
      };

      setSales([newSale, ...sales]);
      setSuccess(`✓ Registrado: ${product.name} x${qty}`);
      setSelectedProductId("");
      setQuantity("");

      // Recargar productos para ver cambios
      const result = await adminListProducts();
      setProducts(result.data);

      // Limpiar mensaje de éxito
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error registrando venta");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Ventas</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Registrar ventas</h2>
        <p className="mt-2 text-sm text-zinc-600 md:text-base">
          Anota aquí los productos que vendiste para actualizar tus ganancias.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">{success}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="product" className="block text-sm font-semibold text-zinc-900">
              Producto vendido
            </label>
            <select
              id="product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={loading}
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            >
              <option value="">Selecciona un producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold text-blue-700">Precio actual:</p>
              <p className="mt-1 text-lg font-bold text-blue-900">
                ${Number(selectedProduct.currentPrice).toLocaleString("es-AR")}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="quantity" className="block text-sm font-semibold text-zinc-900">
              Cantidad vendida
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ej: 2"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>

          {selectedProduct && quantity && !isNaN(parseInt(quantity)) ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700">Ganancia estimada:</p>
              <p className="mt-1 text-lg font-bold text-emerald-900">
                ${(Number(selectedProduct.currentPrice) * parseInt(quantity)).toLocaleString("es-AR")}
              </p>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedProductId || !quantity}
          className="mt-4 w-full rounded-lg bg-zinc-950 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Registrando..." : "Registrar venta"}
        </button>
      </form>

      {sales.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-zinc-950">Ventas registradas hoy</h3>
          <div className="mt-4 space-y-2">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{sale.productName}</p>
                  <p className="text-xs text-zinc-500">{sale.timestamp.toLocaleTimeString("es-AR")}</p>
                </div>
                <p className="text-sm font-bold text-zinc-900">x{sale.quantity}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
