import { faqItems } from "@/lib/mock-data";

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-black tracking-tight">Preguntas frecuentes</h1>
      <p className="mt-3 text-zinc-600">Todo lo que necesitás saber sobre envíos, pagos, stock y cambios.</p>

      <div className="mt-8 space-y-3">
        {faqItems.map((item) => (
          <details key={item.question} className="rounded-lg border border-zinc-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">{item.question}</summary>
            <p className="mt-2 text-sm text-zinc-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
