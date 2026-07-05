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
  { href: "/admin/envios", label: "Zonas de envío" },
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

  const [navOpen, setNavOpen] = useState(false);
  const activeLabel = navItems.find((item) => pathname === item.href)?.label ?? "Menú";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm md:p-4 lg:sticky lg:top-6">
          {/* Header siempre visible */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Panel Admin</p>
              <h1 className="mt-1 text-xl font-black tracking-tight text-zinc-950 md:text-3xl md:mt-2">Norte Gaming</h1>
            </div>
            {/* Botón hamburguesa solo en mobile */}
            <button
              type="button"
              onClick={() => setNavOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 lg:hidden"
            >
              {navOpen ? "✕ Cerrar" : `☰ ${activeLabel}`}
            </button>
          </div>
          <p className="mt-1 hidden text-xs text-zinc-600 md:mt-2 md:block md:text-sm">Gestión centralizada del catálogo.</p>

          {/* Nav: siempre visible en lg, colapsable en mobile */}
          <nav
            className={`space-y-1 md:space-y-2 lg:mt-5 lg:block ${navOpen ? "mt-3 block" : "hidden lg:block"}`}
            aria-label="Secciones del panel"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
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
            <div className="border-t border-zinc-200 pt-3">
              <AdminLogoutButton />
            </div>
          </nav>
        </aside>

        <main className="space-y-4 md:space-y-6">{children}</main>
      </div>
    </div>
  );
}
