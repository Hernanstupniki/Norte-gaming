import Link from "next/link";
import { Product } from "@/types";

interface HeroProps {
  products?: Product[];
}

function GamingCard({ product, index }: { product: Product; index: number }) {
  const num = String(index + 1).padStart(3, "0");
  const label = product.previousPrice ? "OFERTA" : product.isFeatured ? "DESTACADO" : "DISPONIBLE";
  const image = product.images[0];

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-sm border border-zinc-700 bg-black transition-transform hover:-translate-y-1"
    >
      {/* Corner decorations */}
      <span className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-red-600" />
      <span className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-red-600" />
      <span className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-red-600" />
      <span className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-red-600" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
          <span className="text-red-600">─</span> Norte Gaming <span className="text-red-600">─</span>
        </p>
        <span className="font-mono text-xs font-bold text-zinc-600">{num}</span>
      </div>

      {/* Product name */}
      <div className="px-5 pt-3">
        <h2 className="text-2xl font-black uppercase leading-tight tracking-tight text-white md:text-3xl">
          {product.name}
        </h2>
      </div>

      {/* Image */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-6">
        {/* Red dots decoration */}
        <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-1">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-red-600 opacity-70" />
          ))}
        </div>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-44 w-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-44 w-full" />
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <p className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-red-500">
          <span className="h-px w-4 bg-red-500" />
          {label}
        </p>
        <p className="mb-4 text-xs text-zinc-400 line-clamp-1">{product.shortDescription || product.name}</p>
        <span className="block w-full rounded-sm border-2 border-red-600 bg-red-600 py-2.5 text-center text-xs font-black uppercase tracking-widest text-white transition-colors group-hover:bg-red-700">
          Comprar ahora
        </span>
      </div>
    </Link>
  );
}

export function Hero({ products = [] }: HeroProps) {
  const cards = products.slice(0, 3);

  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,#d4d4d8_1px,transparent_1px),linear-gradient(to_bottom,#d4d4d8_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
        {/* Title */}
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex border border-zinc-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
              Norte Gaming / Argentina
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-zinc-950 md:text-4xl">
              Equipá tu setup con<br className="hidden sm:block" /> productos originales
            </h1>
          </div>
          <Link
            href="/tienda"
            className="self-start rounded-md border-2 border-red-600 bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[4px_4px_0_#111] transition hover:-translate-y-0.5 sm:self-auto"
          >
            Ver todos
          </Link>
        </div>

        {/* Cards */}
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((product, i) => (
              <GamingCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-sm border border-zinc-700 bg-zinc-900" />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["Productos originales", "Envíos a todo el país", "Atención directa"].map((b) => (
            <span key={b} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
