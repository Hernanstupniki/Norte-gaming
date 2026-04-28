import { ProductsAdminClient } from "@/components/admin/products-admin-client";

export const metadata = {
  title: "Admin - Productos",
  robots: "noindex, nofollow",
};

export default function AdminProductsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <section className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Catálogo</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">Panel de productos</h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600 md:text-base">
          Alta, edición y control de stock en una sola vista operativa.
        </p>
      </section>
      <ProductsAdminClient />
    </div>
  );
}
