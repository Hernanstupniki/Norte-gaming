import { brands } from "@/lib/mock-data";

export function BrandStrip() {
  const looped = [...brands, ...brands];

  return (
    <section className="border-y border-zinc-200 bg-zinc-50 py-8">
      <div className="mx-auto w-full max-w-7xl overflow-hidden px-4 md:px-6">
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
          Productos originales
        </p>
        <div className="marquee">
          <div className="marquee-track">
            {looped.map((brand, index) => (
              <span key={`${brand}-${index}`} className="brand-chip">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
