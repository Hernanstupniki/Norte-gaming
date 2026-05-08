"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/store-context";
import {
  getMyOrders,
  getMyProfile,
  MyOrderItem,
  updateMyProfile,
  UserProfile,
} from "@/lib/user-api";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export function AccountPanel() {
  const router = useRouter();
  const { auth, logout, cartProducts, subtotal } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<MyOrderItem[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!auth.isLoggedIn || !auth.accessToken) {
      router.push("/login");
      return;
    }

    let cancelled = false;

    const loadAccount = async () => {
      setLoading(true);
      setError(null);

      try {
        const [profileData, ordersData] = await Promise.all([
          getMyProfile(auth.accessToken),
          getMyOrders(auth.accessToken),
        ]);

        if (cancelled) return;

        setProfile(profileData);
        setFirstName(profileData.firstName || "");
        setLastName(profileData.lastName || "");
        setPhone(profileData.phone || "");
        setOrders(ordersData || []);
      } catch (loadError) {
        if (cancelled) return;
        const errorMsg =
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar tu panel personal";
        
        // If it's an unauthorized error, redirect to login
        if (errorMsg.includes("401") || errorMsg.toLowerCase().includes("unauthorized")) {
          logout();
          void router.push("/login");
          return;
        }
        
        setError(errorMsg);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, [auth.accessToken, auth.isLoggedIn, router]);

  const displayedOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const onSubmitProfile = async (event: FormEvent) => {
    event.preventDefault();

    if (!auth.accessToken) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateMyProfile(auth.accessToken, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
      });

      setProfile(updated);
      setNotice("Tus datos se guardaron correctamente.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar tu información",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!auth.isLoggedIn) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Mi cuenta</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
          Panel personal
        </h1>
        <p className="mt-2 text-zinc-600">
          Gestioná tu información, revisá tu carrito y seguí tus compras desde un solo lugar.
        </p>
      </section>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="space-y-6">
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-black text-zinc-950">Datos personales</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Editá tu información básica para futuras compras.
            </p>

            {loading ? (
              <p className="mt-4 text-sm text-zinc-500">Cargando datos...</p>
            ) : (
              <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmitProfile}>
                <input
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Nombre"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Apellido"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Teléfono"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  disabled
                  value={profile?.email || auth.email || ""}
                  placeholder="Email"
                  className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500"
                />

                <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg border-2 border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-800"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </form>
            )}
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-black text-zinc-950">Seguimiento de envíos</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Estado de tus pedidos activos. El código de seguimiento aparece cuando el pedido es despachado.
            </p>
            <div className="mt-4 space-y-3">
              {orders.filter((o) => !["DELIVERED", "CANCELED"].includes(o.status)).length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">No tenés envíos activos por el momento.</p>
                </div>
              ) : (
                orders
                  .filter((o) => !["DELIVERED", "CANCELED"].includes(o.status))
                  .map((order) => {
                    const STATUS: Record<string, { label: string; color: string }> = {
                      PENDING:    { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800" },
                      PAID:       { label: "Pagado",     color: "bg-green-100 text-green-800" },
                      PROCESSING: { label: "Procesando", color: "bg-blue-100 text-blue-800" },
                      SHIPPED:    { label: "Enviado",    color: "bg-indigo-100 text-indigo-800" },
                    };
                    const st = STATUS[order.status] ?? { label: order.status, color: "bg-zinc-100 text-zinc-700" };
                    return (
                      <div key={order.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-sm text-zinc-900">{order.orderNumber}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <p className="text-xs text-zinc-500 truncate">
                            {order.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}
                          </p>
                        )}
                        {order.trackingCode ? (
                          <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                            <svg className="h-4 w-4 shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                            <div>
                              <p className="text-xs font-black text-indigo-700">
                                {order.logisticStatus ? `${order.logisticStatus} · ` : ""}Código: {order.trackingCode}
                              </p>
                              <p className="text-xs text-indigo-500">Usá este código para rastrear tu paquete en el sitio del correo.</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400">El código de seguimiento aparecerá cuando el pedido sea despachado.</p>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </article>
        </section>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-black text-zinc-950">Mi carrito</h2>
            <p className="mt-3 text-sm text-zinc-600">
              Productos: <strong>{cartProducts.reduce((acc, item) => acc + item.quantity, 0)}</strong>
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Total: <strong>{formatARS(subtotal)}</strong>
            </p>
            <Link
              href="/carrito"
              className="mt-4 inline-flex rounded-md border-2 border-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-900"
            >
              Ver carrito completo
            </Link>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-black text-zinc-950">Mis pedidos</h2>
            {loading ? (
              <p className="mt-3 text-sm text-zinc-500">Cargando pedidos...</p>
            ) : displayedOrders.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">Aún no tenés pedidos registrados.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {displayedOrders.map((order) => {
                  const STATUS_MAP: Record<string, { label: string; color: string }> = {
                    PENDING:    { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800" },
                    PAID:       { label: "Pagado",     color: "bg-green-100 text-green-800" },
                    PROCESSING: { label: "Procesando", color: "bg-blue-100 text-blue-800" },
                    SHIPPED:    { label: "Enviado",    color: "bg-indigo-100 text-indigo-800" },
                    DELIVERED:  { label: "Entregado",  color: "bg-emerald-100 text-emerald-800" },
                    CANCELED:   { label: "Cancelado",  color: "bg-red-100 text-red-800" },
                  };
                  const st = STATUS_MAP[order.status] ?? { label: order.status, color: "bg-zinc-100 text-zinc-700" };
                  return (
                    <li key={order.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-black text-zinc-900">{order.orderNumber ?? `#${order.id.slice(0, 8).toUpperCase()}`}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <p className="text-xs text-zinc-500 truncate">
                          {order.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>{new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                        {order.total && (
                          <span className="font-bold text-zinc-700">
                            {Number(order.total).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-black text-zinc-950">Datos de cuenta</h2>
            <p className="mt-3 text-sm text-zinc-600">
              Nombre: <strong>{profile?.firstName || auth.name || "-"}</strong>
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Email: <strong>{profile?.email || auth.email || "-"}</strong>
            </p>
          </article>
        </aside>
      </div>
    </main>
  );
}
