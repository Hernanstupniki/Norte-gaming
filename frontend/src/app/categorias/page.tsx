import Link from "next/link";
import { categories, products } from "@/lib/mock-data";
import { ProductCard } from "@/components/common/product-card";

export default function CategoriasPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-black tracking-tight text-zinc-950">Categorías</h1>
      <p className="mt-3 text-zinc-600">Elegí una categoría y encontrá periféricos para cada estilo de juego.</p>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/tienda?categoria=${category.slug}`}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-950"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-red-600">{category.heroLabel}</p>
            <h2 className="mt-2 text-xl font-bold">{category.name}</h2>
            <p className="mt-2 text-sm text-zinc-600">{category.description}</p>
          </Link>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-black">Recomendados por categoría</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
