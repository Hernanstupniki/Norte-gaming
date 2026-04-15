export default function NosotrosPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-black tracking-tight">Nosotros</h1>
      <p className="mt-3 text-zinc-600">
        Somos del norte de la Argentina, de Misiones. Este proyecto nació con una idea simple: emprender y ofrecer
        periféricos que nosotros mismos usaríamos.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-red-600">Cómo trabajamos</h2>
          <p className="mt-3 text-sm text-zinc-600">
            Seleccionamos productos con foco en calidad, rendimiento y durabilidad. Publicamos stock real y precios claros, sin vueltas.
          </p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-red-600">Qué buscamos</h2>
          <p className="mt-3 text-sm text-zinc-600">
            Buscamos crecer de forma responsable, brindar atención cercana y rápida por WhatsApp, y construir
            confianza compra tras compra.
          </p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-red-600">Nuestro compromiso</h2>
          <p className="mt-3 text-sm text-zinc-600">
            Si algo no está claro, te lo decimos. Si hay demora, te avisamos. Preferimos ser transparentes antes que prometer de más.
          </p>
        </article>
      </section>
    </main>
  );
}
