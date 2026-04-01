import Link from "next/link";
import { faqItems } from "@/lib/mock-data";
import { SectionTitle } from "@/components/common/section-title";

export function FaqPreview() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
      <SectionTitle
        eyebrow="Ayuda"
        title="Preguntas frecuentes"
        description="Respuestas claras para comprar con confianza."
      />
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {faqItems.slice(0, 4).map((item) => (
          <details key={item.question} className="rounded-lg border border-zinc-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">{item.question}</summary>
            <p className="mt-2 text-sm text-zinc-600">{item.answer}</p>
          </details>
        ))}
      </div>
      <div className="mt-5">
        <Link
          href="/faq"
          className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-700"
        >
          Ver FAQ completa
        </Link>
      </div>
    </section>
  );
}
