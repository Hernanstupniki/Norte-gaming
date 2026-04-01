import Link from "next/link";
import { ProductThumbnail } from "@/components/common/product-thumbnail";

const badges = ["Mejor precio", "Productos originales", "Envío rápido", "Atención personalizada"];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,#d4d4d8_1px,transparent_1px),linear-gradient(to_bottom,#d4d4d8_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-20">
        <div>
          <p className="inline-flex border border-zinc-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
            Norte Gaming / Argentina
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-zinc-950 md:text-5xl">
            Los mejores periféricos gaming al mejor precio
          </h1>
          <p className="mt-5 max-w-xl text-base text-zinc-600 md:text-lg">
            Productos originales, rendimiento competitivo y compra simple. Equipá tu setup con marcas seleccionadas y atención personalizada.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/tienda"
              className="rounded-md border-2 border-red-600 bg-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[4px_4px_0_#111] transition hover:-translate-y-0.5"
            >
              Ver catálogo
            </Link>
            <Link
              href="/nosotros"
              className="rounded-md border-2 border-black bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-950 shadow-[4px_4px_0_#111] transition hover:-translate-y-0.5"
            >
              Conocer más
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <ProductThumbnail
            label="Setup Norte Gaming"
            imageSrc="/hero-teclado.jpg"
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-80 border-2 border-black shadow-[12px_12px_0_#11111115]"
          />
          <div className="absolute -left-4 top-4 rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0_#111]">
            Setup Ready
          </div>
          <div className="absolute -bottom-4 right-5 rounded-md border-2 border-red-600 bg-red-600 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#111]">
            Envio gratis +$150.000
          </div>
        </div>
      </div>

    </section>
  );
}
