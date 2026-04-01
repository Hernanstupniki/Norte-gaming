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
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Panel Admin</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">Norte Gaming</h1>
          </div>
          <AdminLogoutButton />
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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

      {children}
    </div>
  );
}
