import Link from "next/link";
import { categories } from "@/lib/mock-data";
import { SectionTitle } from "@/components/common/section-title";

export function CategoryGrid() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6">
      <SectionTitle
        eyebrow="Explorar"
        title="Categorías destacadas"
        description="Seleccioná por tipo de periférico y encontrá opciones de entrada, gama media y tope premium."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/tienda?categoria=${category.slug}`}
            className="group rounded-xl border-2 border-black/10 bg-white p-5 shadow-[6px_6px_0_#17171712] transition hover:border-black/40 hover:shadow-[8px_8px_0_#17171720]"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-red-600">{category.heroLabel}</p>
            <h3 className="mt-2 text-xl font-bold text-zinc-950">{category.name}</h3>
            <p className="mt-2 text-sm text-zinc-600">{category.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
