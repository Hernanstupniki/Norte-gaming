import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-zinc-950 bg-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div>
          <p className="text-lg font-black uppercase tracking-[0.2em]">Norte Gaming</p>
          <p className="mt-3 text-sm text-zinc-600">
            Periféricos gamer premium con productos originales, precio competitivo y atención personalizada.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]">Navegación</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li><Link href="/tienda">Tienda</Link></li>
            <li><Link href="/categorias">Categorías</Link></li>
            <li><Link href="/nosotros">Nosotros</Link></li>
            <li><Link href="/faq">Preguntas frecuentes</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]">Contacto</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>
              WhatsApp:{" "}
              <a
                href="https://wa.me/5493757658938"
                target="_blank"
                rel="noreferrer"
                className="underline-offset-2 hover:underline"
              >
                +54 9 3757-658938
              </a>
            </li>
            <li>
              Instagram:{" "}
              <a
                href="https://www.instagram.com/nortegaming_"
                target="_blank"
                rel="noreferrer"
                className="underline-offset-2 hover:underline"
              >
                @nortegaming_
              </a>
            </li>
            <li>Mail: NorteGamingba@gmail.com</li>
            <li>Envíos: toda Argentina</li>
            <li>Soporte: Lun a Sáb 10 a 19 hs</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]">Pagos y envíos</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>Mercado Pago</li>
            <li>Tarjeta y transferencia</li>
            <li>Correo Argentino / Andreani / OCA</li>
            <li>Retiro en punto de entrega</li>
          </ul>
          <input
            placeholder="Tu email para novedades"
            className="mt-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="border-t border-zinc-200 px-4 py-4 text-center text-xs uppercase tracking-[0.2em] text-zinc-500">
        Norte Gaming © 2026 - Tienda online de periféricos gamer.
      </div>
    </footer>
  );
}
