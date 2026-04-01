export default function ContactoPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-black tracking-tight">Contacto</h1>
      <p className="mt-2 text-zinc-600">Estamos para asesorarte antes y después de tu compra.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
          <input placeholder="Nombre" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          <input type="email" placeholder="Email" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          <input placeholder="Asunto" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          <textarea placeholder="Mensaje" rows={6} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          <button className="rounded-md border-2 border-black bg-black px-4 py-3 text-xs font-bold uppercase tracking-widest text-white">
            Enviar consulta
          </button>
        </form>

        <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-xl font-bold">Canales de atención</h2>
          <p className="text-sm text-zinc-600">
            WhatsApp:{" "}
            <a href="https://wa.me/5493757658938" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              +54 9 3757-658938
            </a>
          </p>
          <p className="text-sm text-zinc-600">Email: NorteGamingba@gmail.com</p>
          <p className="text-sm text-zinc-600">
            Instagram:{" "}
            <a href="https://www.instagram.com/nortegaming_" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              @nortegaming_
            </a>
          </p>
          <p className="text-sm text-zinc-600">Horario: Lunes a Sábado de 10:00 a 19:00</p>
          <div className="mt-5 rounded-lg border border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
            Mapa mock de ubicación / punto de retiro
          </div>
        </div>
      </div>
    </main>
  );
}
