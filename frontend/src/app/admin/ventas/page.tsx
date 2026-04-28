"use client";

import { useEffect, useState } from "react";
import { AdminProductItem, adminListProducts, adminRegisterSale, adminGetSalesHistory } from "@/lib/admin-api";

interface SaleRecord {
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

export default function AdminVentasPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);

  // Cargar productos y historial de ventas
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
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
          setError(err instanceof Error ? err.message : "Error cargando datos");
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

      const price = Number(product.currentPrice || 0);

      await adminRegisterSale(selectedProductId, qty, price);

      setSuccess(`✓ Registrado: ${product.name} x${qty}`);
      setSelectedProductId("");
      setQuantity("");

      // Recargar productos e historial de ventas
      const [productsResult, salesResult] = await Promise.all([
        adminListProducts(),
        adminGetSalesHistory(),
      ]);
      setProducts(productsResult.data);
      setSales(salesResult);

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
    <section className="space-y-4 md:space-y-6">
      <header className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Ventas</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">Registrar ventas</h2>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600 md:text-base">
          Anota aquí los productos que vendiste para actualizar tus ganancias.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-700 shadow-sm">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4 text-xs sm:text-sm text-emerald-700 shadow-sm">{success}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="grid gap-3 sm:gap-4 grid-cols-1">
          <div>
            <label htmlFor="product" className="block text-xs sm:text-sm font-semibold text-zinc-900">
              Producto vendido
            </label>
            <select
              id="product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={loading}
              className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-zinc-950 focus:outline-none"
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
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 sm:p-3">
              <p className="text-xs font-semibold text-blue-700">Precio actual:</p>
              <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-bold text-blue-900">
                ${Number(selectedProduct.currentPrice).toLocaleString("es-AR")}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="quantity" className="block text-xs sm:text-sm font-semibold text-zinc-900">
              Cantidad vendida
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ej: 2"
              className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>

          {selectedProduct && quantity && !isNaN(parseInt(quantity)) ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 sm:p-3">
              <p className="text-xs font-semibold text-emerald-700">Ganancia estimada:</p>
              <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-bold text-emerald-900">
                ${(Number(selectedProduct.currentPrice) * parseInt(quantity)).toLocaleString("es-AR")}
              </p>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedProductId || !quantity}
          className="mt-3 sm:mt-4 w-full rounded-lg bg-zinc-950 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Registrando..." : "Registrar venta"}
        </button>
      </form>

      {sales.length > 0 ? (
        <section className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="text-base sm:text-lg font-black text-zinc-950">Historial de ventas</h3>
          <div className="mt-3 sm:mt-4 space-y-2">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between gap-2 sm:gap-3 rounded-lg border border-zinc-200 px-2.5 sm:px-3 py-1.5 sm:py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-semibold text-zinc-900">{sale.product?.name || "Producto eliminado"}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(sale.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-xs text-zinc-600">x{sale.quantity}</p>
                  <p className="text-xs sm:text-sm font-bold text-emerald-700">
                    ${Number(sale.totalPrice).toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
