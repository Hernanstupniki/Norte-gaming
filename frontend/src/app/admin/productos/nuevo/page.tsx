import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = {
  title: "Admin - Nuevo producto",
  robots: "noindex, nofollow",
};

export default function AdminNewProductPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Catálogo</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">Nuevo producto</h1>
          </div>
          <Link
            href="/admin/productos"
            className="text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-900"
          >
            ← Volver al listado
          </Link>
        </div>
      </section>
      <ProductForm />
    </div>
  );
}
