"use client";

import Link from "next/link";
import { useStore } from "@/context/store-context";
import { formatARS } from "@/lib/utils";
import { buildCartWhatsAppHref } from "@/lib/whatsapp";

export default function CheckoutPage() {
  const { cartProducts, subtotal } = useStore();
  const whatsappHref = buildCartWhatsAppHref(cartProducts, subtotal);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-black tracking-tight">Coordinar compra</h1>
      <p className="mt-2 text-zinc-600">
        Para cerrar la venta, te redirigimos a WhatsApp con el resumen del carrito.
      </p>

      {cartProducts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
          <p className="text-zinc-600">No hay productos en el carrito.</p>
          <Link
            href="/tienda"
            className="mt-4 inline-flex rounded-md border-2 border-black px-4 py-2 text-xs font-semibold uppercase tracking-widest"
          >
            Ir a tienda
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">Resumen para WhatsApp</h2>
            <div className="mt-4 space-y-3">
              {cartProducts.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="max-w-[260px] text-zinc-700">{product.name} x{quantity}</span>
                  <span className="font-semibold text-zinc-900">{formatARS(product.price * quantity)}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-zinc-600">
              Al tocar el botón, se abre WhatsApp con un mensaje prearmado para coordinar pago, envío y disponibilidad.
            </p>
          </section>

          <aside className="h-fit rounded-xl border-2 border-black bg-white p-5 shadow-[6px_6px_0_#11111118]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total estimado</p>
            <p className="mt-3 text-3xl font-black">{formatARS(subtotal)}</p>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-5 block rounded-md border-2 border-[#25D366] bg-[#25D366] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-black"
            >
              Coordinar por WhatsApp
            </a>

            <Link
              href="/carrito"
              className="mt-2 block rounded-md border-2 border-zinc-300 bg-white px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-zinc-700"
            >
              Volver al carrito
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
