"use client";

import { useEffect, useState } from "react";
import { formatARS } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string | number;
  shippingCost: string | number;
  discountTotal: string | number;
  total: string | number;
  notes?: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  address: {
    recipient: string;
    phone: string;
    street: string;
    number: string;
    floor?: string | null;
    apartment?: string | null;
    city: string;
    province: string;
    postalCode: string;
  };
  shippingMethod: { name: string };
  items: OrderItem[];
  payments: Array<{ method: string; status: string }>;
  coupon?: { code: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "Pendiente",   color: "bg-yellow-100 text-yellow-800" },
  PAID:       { label: "Pagado",      color: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Procesando",  color: "bg-blue-100 text-blue-800" },
  SHIPPED:    { label: "Enviado",     color: "bg-indigo-100 text-indigo-800" },
  DELIVERED:  { label: "Entregado",   color: "bg-emerald-100 text-emerald-800" },
  CANCELED:   { label: "Cancelado",   color: "bg-red-100 text-red-800" },
};

export default function AdminOrdenesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/proxy/orders/admin/all", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar las órdenes."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.user.email.toLowerCase().includes(q) ||
      `${o.user.firstName} ${o.user.lastName}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Admin</p>
        <h2 className="mt-1 text-2xl font-black text-zinc-950">Órdenes</h2>
        <p className="mt-1 text-sm text-zinc-500">{orders.length} orden{orders.length !== 1 ? "es" : ""} en total</p>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Buscar por número, nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 px-2 text-sm text-zinc-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
          Cargando órdenes...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          No hay órdenes{search ? " que coincidan con la búsqueda" : ""}.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((order) => {
          const st = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-zinc-100 text-zinc-700" };
          const isOpen = expanded === order.id;
          const addr = order.address;
          const addressStr = `${addr.street} ${addr.number}${addr.floor ? `, piso ${addr.floor}` : ""}${addr.apartment ? ` dpto ${addr.apartment}` : ""}, ${addr.city}, ${addr.province} (CP ${addr.postalCode})`;

          return (
            <div key={order.id} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-black text-zinc-900">{order.orderNumber}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                  <span className="text-xs text-zinc-400">
                    {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-zinc-900">{formatARS(Number(order.total))}</p>
                    <p className="text-xs text-zinc-400">{order.user.firstName} {order.user.lastName}</p>
                  </div>
                  <svg className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Detail panel */}
              {isOpen && (
                <div className="border-t border-zinc-100 px-5 py-4 space-y-5">
                  {/* Cliente + dirección */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Cliente</p>
                      <p className="text-sm font-bold text-zinc-900">{order.user.firstName} {order.user.lastName}</p>
                      <p className="text-xs text-zinc-500">{order.user.email}</p>
                      <p className="text-xs text-zinc-500">{addr.phone}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Dirección de entrega</p>
                      <p className="text-sm text-zinc-700">{addr.recipient}</p>
                      <p className="text-xs text-zinc-500">{addressStr}</p>
                    </div>
                  </div>

                  {/* Envío + Pago */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Envío</p>
                      <p className="text-sm text-zinc-700">{order.shippingMethod.name}</p>
                    </div>
                    {order.payments.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Pago</p>
                        {order.payments.map((p, i) => (
                          <p key={i} className="text-sm text-zinc-700">{p.method} — <span className="text-zinc-400">{p.status}</span></p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Productos */}
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Productos</p>
                    <div className="overflow-hidden rounded-xl border border-zinc-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-zinc-50 text-xs text-zinc-500">
                            <th className="px-3 py-2 text-left font-bold">Producto</th>
                            <th className="px-3 py-2 text-left font-bold">SKU</th>
                            <th className="px-3 py-2 text-center font-bold">Cant.</th>
                            <th className="px-3 py-2 text-right font-bold">P. unit.</th>
                            <th className="px-3 py-2 text-right font-bold">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id} className="border-t border-zinc-100">
                              <td className="px-3 py-2 font-medium text-zinc-900">{item.productName}</td>
                              <td className="px-3 py-2 text-zinc-400">{item.productSku}</td>
                              <td className="px-3 py-2 text-center text-zinc-700">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-zinc-700">{formatARS(Number(item.unitPrice))}</td>
                              <td className="px-3 py-2 text-right font-bold text-zinc-900">{formatARS(Number(item.totalPrice))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-1 text-sm">
                      <div className="flex justify-between text-zinc-500">
                        <span>Subtotal</span><span>{formatARS(Number(order.subtotal))}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>Envío</span>
                        <span>{Number(order.shippingCost) === 0 ? "Gratis" : formatARS(Number(order.shippingCost))}</span>
                      </div>
                      {Number(order.discountTotal) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Descuento{order.coupon ? ` (${order.coupon.code})` : ""}</span>
                          <span>-{formatARS(Number(order.discountTotal))}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-black text-zinc-900">
                        <span>Total</span><span>{formatARS(Number(order.total))}</span>
                      </div>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                      <span className="font-bold">Notas: </span>{order.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
