import Link from "next/link";

export function PromoBanner() {
  const phone = (process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "5493757658938").replace(/\D/g, "");
  const message = encodeURIComponent("Hola! Quiero que me avisen cuando este disponible la opcion 'Arma tu setup'.");
  const whatsappHref = `https://wa.me/${phone}?text=${message}`;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <div className="relative overflow-hidden rounded-2xl border-2 border-black bg-zinc-900 p-8 text-white shadow-[10px_10px_0_#11111140]">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#ffffff22_1px,transparent_1px),linear-gradient(to_bottom,#ffffff22_1px,transparent_1px)] [background-size:14px_14px]" />
        <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">Proximamente</p>
            <h3 className="mt-2 text-3xl font-black leading-tight">
              Arma tu setup ideal en 3 pasos
            </h3>
            <p className="mt-3 text-sm text-zinc-300">
              Estamos preparando un configurador para combinar mouse, teclado, auriculares y accesorios en un solo lugar.
            </p>
          </div>
          <div className="flex flex-wrap justify-start gap-3 md:justify-end">
            <Link
              href="/tienda"
              className="rounded-md border-2 border-red-600 bg-red-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white"
            >
              Ver catalogo
            </Link>
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border-2 border-white bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-widest text-white"
            >
              Quiero aviso
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
