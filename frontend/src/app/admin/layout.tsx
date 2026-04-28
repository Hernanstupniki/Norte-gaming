"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

const navItems = [
  { href: "/admin/productos", label: "Productos" },
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
    <div className="min-h-screen bg-zinc-100/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Panel Admin</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">Norte Gaming</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Catálogo, productos, categorías y pedidos en un mismo lugar. Usá la navegación para ir directo a cada área.
            </p>
          </div>
          <AdminLogoutButton />
        </div>

        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Secciones del panel">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border border-black bg-black text-white"
                    : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}
