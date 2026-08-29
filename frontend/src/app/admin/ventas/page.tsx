"use client";

import { useEffect, useRef, useState } from "react";
import {
  AdminProductItem,
  adminListProducts,
  adminRegisterSale,
  adminGetSalesHistory,
  adminUpdateSale,
  adminDeleteSale,
} from "@/lib/admin-api";

interface SaleRecord {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  createdAt: string;
  product?: { id: string; name: string; sku: string };
}

type EditingState = { saleId: string; quantity: string } | null;

const fmt = (n: string | number) =>
  `$${Number(n).toLocaleString("es-AR")}`;

export default function AdminVentasPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleRecord[]>([]);

  // form
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProductItem | null>(null);
  const [quantity, setQuantity] = useState("");
  const comboRef = useRef<HTMLDivElement>(null);

  // feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // edit inline
  const [editing, setEditing] = useState<EditingState>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
  );

  // Cerrar dropdown al click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = async () => {
    const [productsResult, salesResult] = await Promise.all([
      adminListProducts(),
      adminGetSalesHistory(),
    ]);
    setProducts(productsResult.data);
    setSales(salesResult);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Error cargando datos"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedProduct || !quantity) { setError("Selecciona producto y cantidad"); return; }
    if (selectedProduct.currentPrice === null || selectedProduct.currentPrice === undefined) {
      setError("Este producto no tiene precio definido. Cargale un precio desde el panel de productos antes de registrar la venta.");
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) { setError("Cantidad debe ser mayor a 0"); return; }
    setSubmitting(true);
    try {
      await adminRegisterSale(selectedProduct.id, qty, Number(selectedProduct.currentPrice || 0));
      setSuccess(`✓ Registrado: ${selectedProduct.name} x${qty}`);
      setSelectedProduct(null);
      setSearch("");
      setQuantity("");
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error registrando venta");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (sale: SaleRecord) => {
    setEditing({ saleId: sale.id, quantity: String(sale.quantity) });
    setEditError(null);
  };

  const cancelEdit = () => { setEditing(null); setEditError(null); };

  const saveEdit = async () => {
    if (!editing) return;
    const qty = parseInt(editing.quantity, 10);
    if (isNaN(qty) || qty <= 0) { setEditError("Cantidad inválida"); return; }
    try {
      await adminUpdateSale(editing.saleId, qty);
      setEditing(null);
      setEditError(null);
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error actualizando");
    }
  };

  const handleDelete = async (sale: SaleRecord) => {
    const name = sale.product?.name ?? "este registro";
    if (!confirm(`¿Eliminar "${name} x${sale.quantity}"?`)) return;
    try {
      await adminDeleteSale(sale.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando");
    }
  };

  return (
    <section className="space-y-4 md:space-y-6">
      <header className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Ventas</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">Registrar ventas</h2>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600 md:text-base">
          Anotá los productos vendidos para actualizar tus ganancias.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700 shadow-sm">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-700 shadow-sm">{success}</div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
        {/* Buscador de producto */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-zinc-900 mb-1.5">
            Producto vendido
          </label>
          <div className="relative" ref={comboRef}>
            <input
              type="text"
              placeholder={loading ? "Cargando productos…" : "Buscar por nombre o SKU…"}
              disabled={loading}
              value={selectedProduct ? selectedProduct.name : search}
              onFocus={() => { if (selectedProduct) { setSearch(""); setSelectedProduct(null); } setOpen(true); }}
              onChange={(e) => { setSearch(e.target.value); setSelectedProduct(null); setOpen(true); }}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm focus:border-zinc-950 focus:outline-none"
            />
            {selectedProduct && (
              <button
                type="button"
                onClick={() => { setSelectedProduct(null); setSearch(""); setOpen(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-lg leading-none"
              >
                ×
              </button>
            )}
            {open && !selectedProduct && (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg text-xs sm:text-sm">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-zinc-400">Sin resultados</li>
                ) : (
                  filtered.map((p) => (
                    <li
                      key={p.id}
                      onMouseDown={(e) => { e.preventDefault(); setSelectedProduct(p); setSearch(""); setOpen(false); }}
                      className="cursor-pointer px-3 py-2 hover:bg-zinc-100"
                    >
                      <span className="font-medium text-zinc-900">{p.name}</span>
                      <span className="ml-2 text-zinc-400">SKU: {p.sku}</span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Precio y ganancia estimada */}
        {selectedProduct && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
              <p className="text-xs font-semibold text-blue-700">Precio actual</p>
              <p className="mt-0.5 text-lg font-bold text-blue-900">
                {selectedProduct.currentPrice !== null && selectedProduct.currentPrice !== undefined
                  ? fmt(selectedProduct.currentPrice)
                  : "Sin definir"}
              </p>
            </div>
            {quantity && !isNaN(parseInt(quantity)) && selectedProduct.currentPrice !== null && selectedProduct.currentPrice !== undefined && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                <p className="text-xs font-semibold text-emerald-700">Ganancia estimada</p>
                <p className="mt-0.5 text-lg font-bold text-emerald-900">
                  {fmt(Number(selectedProduct.currentPrice) * parseInt(quantity))}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cantidad */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-zinc-900 mb-1.5">
            Cantidad vendida
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Ej: 2"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm focus:border-zinc-950 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedProduct || !quantity || selectedProduct?.currentPrice === null || selectedProduct?.currentPrice === undefined}
          className="w-full rounded-lg bg-zinc-950 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Registrando…" : "Registrar venta"}
        </button>
      </form>

      {/* Historial */}
      {sales.length > 0 && (
        <section className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="text-base sm:text-lg font-black text-zinc-950 mb-3">Historial de ventas</h3>
          {editError && (
            <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{editError}</p>
          )}
          <div className="space-y-2">
            {sales.map((sale) => {
              const isEditing = editing?.saleId === sale.id;
              return (
                <div key={sale.id} className="flex items-center gap-2 sm:gap-3 rounded-lg border border-zinc-200 px-3 py-2">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-semibold text-zinc-900">
                      {sale.product?.name ?? "Producto eliminado"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(sale.createdAt).toLocaleString("es-AR")}
                    </p>
                  </div>

                  {/* Cantidad editable / total */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={editing.quantity}
                        onChange={(e) => setEditing({ ...editing, quantity: e.target.value })}
                        className="w-16 rounded border border-zinc-300 px-1.5 py-1 text-xs text-center focus:border-zinc-950 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        className="rounded bg-zinc-950 px-2 py-1 text-xs font-semibold text-white hover:bg-zinc-800"
                      >
                        OK
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-zinc-600">x{sale.quantity}</p>
                      <p className="text-xs sm:text-sm font-bold text-emerald-700">{fmt(sale.totalPrice)}</p>
                    </div>
                  )}

                  {/* Acciones */}
                  {!isEditing && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(sale)}
                        title="Editar cantidad"
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(sale)}
                        title="Eliminar registro"
                        className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
