import { ProductsAdminClient } from "@/components/admin/products-admin-client";

export const metadata = {
  title: "Admin - Productos",
  robots: "noindex, nofollow",
};

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Catálogo</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Panel de productos</h1>
        <p className="mt-2 text-sm text-zinc-600 md:text-base">
          Alta, edición y control de stock en una sola vista operativa.
        </p>
      </section>
      <ProductsAdminClient />
    </div>
  );
}
