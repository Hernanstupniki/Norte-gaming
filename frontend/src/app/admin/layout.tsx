"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

const navItems = [
  { href: "/admin/productos", label: "Productos" },
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

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Panel Admin</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Norte Gaming</h1>
          <p className="mt-2 text-sm text-zinc-600">Gestión centralizada del catálogo.</p>

          <nav className="mt-5 space-y-2" aria-label="Secciones del panel">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
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

          <div className="mt-6 border-t border-zinc-200 pt-4">
            <AdminLogoutButton />
          </div>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
