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
  trackingCode?: string | null;
  logisticStatus?: string | null;
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

const STATUS_OPTIONS = [
  { value: "PENDING",    label: "Pendiente",   color: "bg-yellow-100 text-yellow-800" },
  { value: "PAID",       label: "Pagado",       color: "bg-green-100 text-green-800" },
  { value: "PROCESSING", label: "Procesando",   color: "bg-blue-100 text-blue-800" },
  { value: "SHIPPED",    label: "Enviado",      color: "bg-indigo-100 text-indigo-800" },
  { value: "DELIVERED",  label: "Entregado",    color: "bg-emerald-100 text-emerald-800" },
  { value: "CANCELED",   label: "Cancelado",    color: "bg-red-100 text-red-800" },
];

const statusInfo = (s: string) => STATUS_OPTIONS.find((o) => o.value === s) ?? { label: s, color: "bg-zinc-100 text-zinc-700" };

export default function AdminOrdenesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Per-order edit state
  const [editStatus, setEditStatus] = useState<Record<string, string>>({});
  const [editTracking, setEditTracking] = useState<Record<string, string>>({});
  const [editCarrier, setEditCarrier] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/proxy/orders/admin/all", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Order[]) => {
        setOrders(Array.isArray(data) ? data : []);
        const st: Record<string, string> = {};
        const tr: Record<string, string> = {};
        const ca: Record<string, string> = {};
        (Array.isArray(data) ? data : []).forEach((o) => {
          st[o.id] = o.status;
          tr[o.id] = o.trackingCode ?? "";
          ca[o.id] = o.logisticStatus ?? "";
        });
        setEditStatus(st);
        setEditTracking(tr);
        setEditCarrier(ca);
      })
      .catch(() => setError("No se pudieron cargar las órdenes."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (id: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/proxy/orders/admin/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus[id],
          trackingCode: editTracking[id] || undefined,
          logisticStatus: editCarrier[id] || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) => prev.map((o) => o.id === id
        ? { ...o, status: editStatus[id], trackingCode: editTracking[id] || null, logisticStatus: editCarrier[id] || null }
        : o
      ));
      setSaveMsg((prev) => ({ ...prev, [id]: "✓ Guardado" }));
      setTimeout(() => setSaveMsg((prev) => ({ ...prev, [id]: "" })), 2500);
    } catch {
      setSaveMsg((prev) => ({ ...prev, [id]: "Error al guardar" }));
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string, orderNumber: string) => {
    if (!confirm(`¿Eliminar la orden ${orderNumber}? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/proxy/orders/admin/${id}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {
      alert("No se pudo eliminar la orden.");
    } finally {
      setDeleting(null);
    }
  };

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
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          No hay órdenes{search ? " que coincidan con la búsqueda" : ""}.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((order) => {
          const st = statusInfo(order.status);
          const isOpen = expanded === order.id;
          const addr = order.address;
          const addressStr = `${addr.street} ${addr.number}${addr.floor ? `, piso ${addr.floor}` : ""}${addr.apartment ? ` dpto ${addr.apartment}` : ""}, ${addr.city}, ${addr.province} (CP ${addr.postalCode})`;

          return (
            <div key={order.id} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {/* Header */}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-black text-zinc-900">{order.orderNumber}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                  {order.trackingCode && (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                      📦 {order.trackingCode}
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">
                    {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-zinc-900">{formatARS(Number(order.total))}</p>
                    <p className="text-xs text-zinc-400">{order.user.firstName} {order.user.lastName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(order.id, order.orderNumber); }}
                    disabled={deleting === order.id}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-40"
                  >
                    {deleting === order.id ? "..." : "Eliminar"}
                  </button>
                  <svg className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Detail */}
              {isOpen && (
                <div className="border-t border-zinc-100 px-5 py-4 space-y-5">

                  {/* Estado + tracking */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Gestión del pedido</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Estado</label>
                        <select
                          value={editStatus[order.id] ?? order.status}
                          onChange={(e) => setEditStatus((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Código de tracking</label>
                        <input
                          type="text"
                          placeholder="Ej: OCA123456789"
                          value={editTracking[order.id] ?? ""}
                          onChange={(e) => setEditTracking((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Empresa de envío</label>
                        <input
                          type="text"
                          placeholder="Ej: OCA, Andreani, Correo"
                          value={editCarrier[order.id] ?? ""}
                          onChange={(e) => setEditCarrier((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSave(order.id)}
                        disabled={saving === order.id}
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-700 disabled:opacity-50"
                      >
                        {saving === order.id ? "Guardando..." : "Guardar cambios"}
                      </button>
                      {(() => {
                        const phone = addr.phone?.replace(/\D/g, "");
                        if (!phone) return null;
                        const st = STATUS_OPTIONS.find((s) => s.value === (editStatus[order.id] ?? order.status));
                        const tracking = editTracking[order.id] ?? order.trackingCode ?? "";
                        const carrier = editCarrier[order.id] ?? order.logisticStatus ?? "";
                        const msg = [
                          `Hola ${order.user.firstName}, te escribimos de Norte Gaming 🎮`,
                          `Tu pedido *${order.orderNumber}* fue actualizado: *${st?.label ?? order.status}*`,
                          tracking ? `📦 Código de seguimiento: *${tracking}*${carrier ? ` (${carrier})` : ""}` : "",
                          "Cualquier consulta estamos acá 👋",
                        ].filter(Boolean).join("\n");
                        const waUrl = `https://wa.me/54${phone}?text=${encodeURIComponent(msg)}`;
                        return (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-green-700 hover:bg-green-100"
                          >
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                          </a>
                        );
                      })()}
                      {saveMsg[order.id] && (
                        <span className={`text-xs font-bold ${saveMsg[order.id].startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                          {saveMsg[order.id]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cliente + dirección */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Cliente</p>
                      <p className="text-sm font-bold text-zinc-900">{order.user.firstName} {order.user.lastName}</p>
                      <p className="text-xs text-zinc-500">{order.user.email}</p>
                      <p className="text-xs text-zinc-500">{addr.phone}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Dirección</p>
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
