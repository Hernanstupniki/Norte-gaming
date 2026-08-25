import Link from "next/link";
import { fetchCatalogProducts } from "@/lib/backend-api";
import { ImportedProductCard } from "@/components/importados/imported-product-card";

const FEATURES = [
  {
    title: "A pedido",
    description: "Traemos tu equipo a solicitud.",
    icon: (
      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
      </svg>
    ),
  },
  {
    title: "100% originales",
    description: "Equipos nuevos y sellados.",
    icon: (
      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M11.484 2.17a.75.75 0 011.032 0 11.209 11.209 0 007.877 3.08.75.75 0 01.722.515 12.74 12.74 0 01.635 3.985c0 5.942-4.064 10.933-9.563 12.348a.749.749 0 01-.374 0C6.314 20.683 2.25 15.692 2.25 9.75c0-1.39.223-2.73.635-3.985a.75.75 0 01.722-.516l.143.001c2.996 0 5.718-1.17 7.734-3.08zm3.094 8.016a.75.75 0 10-1.156-.956l-3.66 4.392-1.95-1.95a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.108-.056l4.218-5.06z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Asesoramiento",
    description: "Te ayudamos a elegir el ideal para vos.",
    icon: (
      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a8 8 0 00-8 8v5a3 3 0 003 3h1a2 2 0 002-2v-3a2 2 0 00-2-2H6v-1a6 6 0 0112 0v1h-2a2 2 0 00-2 2v3a2 2 0 002 2h1a3 3 0 003-3v-5a8 8 0 00-8-8z" />
      </svg>
    ),
  },
];

export default async function ImportadosPage() {
  const products = await fetchCatalogProducts().catch(() => []);
  const importedProducts = products.filter(
    (product) => product.category.toLowerCase() === "importados",
  );

  return (
    <>
      <section className="relative overflow-hidden border-t border-zinc-800 bg-black">
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-red-500">
              <span className="h-px w-8 bg-red-600/60" />
              Norte Gaming
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
              Importados
            </h1>
            <p className="mt-3 max-w-md text-base text-zinc-400">
              Notebooks y MacBooks.
              <br />
              Consultá disponibilidad: tecnología de afuera, directa a tu casa.
            </p>
          </div>

          <div className="grid grid-cols-1 divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center gap-1.5 px-5 py-5 text-center">
                <span className="text-red-500">{feature.icon}</span>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white">{feature.title}</p>
                <p className="text-xs leading-tight text-zinc-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black pb-16">
        <div className="mx-auto w-full max-w-7xl px-4 pt-10 md:px-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center gap-3 border-l-2 border-red-600 pl-3">
              <h2 className="whitespace-nowrap text-base font-black uppercase tracking-[0.2em] text-white">
                Notebooks a pedido
              </h2>
            </div>
            <span className="h-px flex-1 bg-zinc-800" />
            <Link
              href="/importados"
              className="whitespace-nowrap text-sm font-bold uppercase tracking-widest text-red-500 transition hover:text-red-400"
            >
              Ver todos →
            </Link>
          </div>

          {importedProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-10 text-center text-zinc-500">
              Todavía no hay productos importados cargados.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,200px)] sm:justify-start sm:gap-4">
              {importedProducts.map((product) => (
                <ImportedProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
