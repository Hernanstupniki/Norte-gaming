import { fetchCatalogProducts } from "@/lib/backend-api";
import { ProductCard } from "@/components/common/product-card";

export default async function ImportadosPage() {
  const products = await fetchCatalogProducts().catch(() => []);
  const importedProducts = products.filter(
    (product) => product.category.toLowerCase() === "importados",
  );

  return (
    <>
      <section className="border-b border-zinc-800 bg-black">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-red-500">
            <span className="h-px w-8 bg-red-600/60" />
            Norte Gaming
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
            Importados
          </h1>
          <p className="mt-4 max-w-xl text-sm text-zinc-400">
            Tecnología que conseguimos para vos.
          </p>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            MacBooks, notebooks y productos seleccionados disponibles a pedido.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
        {importedProducts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-zinc-600">
            Todavía no hay productos importados cargados.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {importedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
