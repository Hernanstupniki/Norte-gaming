"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { useEffect, useState } from "react";
import { adminListUsers } from "@/lib/admin-api";

const navItems = [
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/ventas", label: "Registrar ventas" },
  { href: "/admin/metricas", label: "Métricas" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/ordenes", label: "Órdenes" },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await adminListUsers({ page: 1, limit: 1 });
        if (mounted) setUserCount(res.total ?? 0);
      } catch {
        if (mounted) setUserCount(null);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm md:p-4 lg:sticky lg:top-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Panel Admin</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 md:text-3xl">Norte Gaming</h1>
          <p className="mt-2 text-xs text-zinc-600 md:text-sm">Gestión centralizada del catálogo.</p>

          <div className="mt-4 rounded-xl border border-zinc-900 bg-zinc-950 p-3 text-white shadow-sm md:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Cuentas de clientes</p>
                <h2 className="mt-1 text-lg font-black tracking-tight">Gestionar usuarios</h2>
                <p className="mt-1 text-xs text-zinc-300">Ver datos, editar perfiles y activar o desactivar cuentas.</p>
              </div>
              <div className="rounded-lg bg-white/10 px-2 py-1 text-sm font-mono">{userCount === null ? '—' : userCount}</div>
            </div>
            <Link
              href="/admin/usuarios"
              className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-bold text-zinc-950 transition hover:bg-zinc-100"
            >
              Abrir panel de usuarios
            </Link>
          </div>

          <nav className="mt-4 space-y-1 md:mt-5 md:space-y-2" aria-label="Secciones del panel">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-lg px-2 py-1.5 text-xs font-semibold transition md:px-3 md:py-2 md:text-sm ${
                    isActive
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 hidden">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500">Cuentas</div>
                  <div className="text-sm font-semibold">Clientes</div>
                </div>
                <div className="text-sm font-mono text-zinc-700">{userCount === null ? '—' : userCount}</div>
              </div>
              <div className="mt-2">
                <Link href="/admin/usuarios" className="text-xs text-zinc-700 hover:underline">Ir a gestión de usuarios</Link>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-zinc-200 pt-3 md:mt-6 md:pt-4">
            <AdminLogoutButton />
          </div>
        </aside>

        <main className="space-y-4 md:space-y-6">{children}</main>
      </div>
    </div>
  );
}
