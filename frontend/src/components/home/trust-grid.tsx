import { benefitItems } from "@/lib/mock-data";
import { SectionTitle } from "@/components/common/section-title";

export function TrustGrid() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6">
      <SectionTitle
        eyebrow="Confianza"
        title="Comprá con respaldo real"
        description="Norte Gaming combina precio competitivo con servicio humano y productos originales en cada compra."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-5">
        {benefitItems.map((item) => (
          <div key={item.title} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-zinc-900">{item.title}</h3>
            <p className="mt-2 text-sm text-zinc-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
