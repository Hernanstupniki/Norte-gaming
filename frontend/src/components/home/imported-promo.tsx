import Link from "next/link";

export function ImportedPromo() {
  return (
    <section className="relative overflow-hidden border-y border-zinc-800 bg-black">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-4 py-14 md:px-6">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-red-500">
          <span className="h-px w-8 bg-red-600/60" />
          Importados a pedido
        </p>
        <h2 className="text-3xl font-black uppercase leading-none tracking-tight text-white md:text-4xl">
          MacBooks · Notebooks Gaming · Ultrabooks
        </h2>
        <p className="max-w-xl text-sm text-zinc-400">
          Conseguimos equipos seleccionados especialmente para vos.
        </p>
        <Link
          href="/importados"
          className="mt-2 inline-flex items-center gap-2 rounded-sm border-2 border-white bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[3px_3px_0_#000] transition hover:shadow-[1px_1px_0_#000]"
        >
          Ver importados →
        </Link>
      </div>
    </section>
  );
}
