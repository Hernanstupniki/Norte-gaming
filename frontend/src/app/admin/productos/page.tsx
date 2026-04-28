import { ProductsAdminClient } from "@/components/admin/products-admin-client";

export const metadata = {
  title: "Admin - Productos",
  robots: "noindex, nofollow",
};

export default function AdminProductsPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Panel de administración</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">Gestioná productos sin perder el hilo</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 md:text-base">
            Cargá productos, revisá stock, editá información y detectá rápido lo que necesita atención.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-600">
            <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1">Crear nuevo</span>
            <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1">Editar catálogo</span>
            <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1">Controlar stock</span>
          </div>
        </div>

        <aside className="rounded-3xl border border-zinc-200 bg-zinc-950 p-6 text-white shadow-sm md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">Flujo recomendado</p>
          <ol className="mt-4 space-y-3 text-sm text-zinc-300">
            <li>
              <span className="font-semibold text-white">1.</span> Tocá <span className="font-semibold text-white">Nuevo producto</span> para empezar limpio.
            </li>
            <li>
              <span className="font-semibold text-white">2.</span> Usá <span className="font-semibold text-white">Gestionar</span> para buscar, editar o borrar.
            </li>
            <li>
              <span className="font-semibold text-white">3.</span> Prestá atención a productos con stock bajo o sin stock.
            </li>
          </ol>
        </aside>
      </section>
      <ProductsAdminClient />
    </div>
  );
}
