"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/store-context";
import {
  getMyCart,
  getMyOrders,
  getMyProfile,
  MyCartResponse,
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
  const { auth, logout } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<MyCartResponse | null>(null);
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
        const [profileData, cartData, ordersData] = await Promise.all([
          getMyProfile(auth.accessToken),
          getMyCart(auth.accessToken),
          getMyOrders(auth.accessToken),
        ]);

        if (cancelled) return;

        setProfile(profileData);
        setFirstName(profileData.firstName || "");
        setLastName(profileData.lastName || "");
        setPhone(profileData.phone || "");
        setCart(cartData);
        setOrders(ordersData || []);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar tu panel personal",
        );
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
              Esta sección se integrará más adelante para que puedas seguir cada envío en tiempo real.
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
              Próximamente: estado del paquete, historial por orden y link de tracking del correo.
            </div>
          </article>
        </section>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-black text-zinc-950">Mi carrito</h2>
            {loading ? (
              <p className="mt-3 text-sm text-zinc-500">Cargando carrito...</p>
            ) : (
              <>
                <p className="mt-3 text-sm text-zinc-600">
                  Productos: <strong>{cart?.totalItems || 0}</strong>
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Total: <strong>{formatARS(Number(cart?.subtotal || 0))}</strong>
                </p>
                <Link
                  href="/carrito"
                  className="mt-4 inline-flex rounded-md border-2 border-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-900"
                >
                  Ver carrito completo
                </Link>
              </>
            )}
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-black text-zinc-950">Mis pedidos</h2>
            {loading ? (
              <p className="mt-3 text-sm text-zinc-500">Cargando pedidos...</p>
            ) : displayedOrders.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">Aún no tenés pedidos registrados.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                {displayedOrders.map((order) => (
                  <li key={order.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="font-semibold">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-zinc-600">Estado: {order.status}</p>
                    <p className="text-zinc-600">
                      Fecha: {new Date(order.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </li>
                ))}
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
            <p className="mt-1 text-sm text-zinc-600">
              Rol: <strong>{profile?.role || auth.role || "CLIENT"}</strong>
            </p>
          </article>
        </aside>
      </div>
    </main>
  );
}
