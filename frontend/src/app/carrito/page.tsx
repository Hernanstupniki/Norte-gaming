"use client";

import Link from "next/link";
import { useStore } from "@/context/store-context";
import { formatARS } from "@/lib/utils";
import { buildCartWhatsAppHref } from "@/lib/whatsapp";

export default function CarritoPage() {
  const { cartProducts, updateQuantity, removeFromCart, subtotal } = useStore();
  const whatsappHref = buildCartWhatsAppHref(cartProducts, subtotal);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-black tracking-tight">Carrito</h1>
      <p className="mt-2 text-zinc-600">Revisá tus productos antes de confirmar la compra.</p>

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
          <section className="space-y-3">
            {cartProducts.map(({ product, quantity }) => (
              <article key={product.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{product.brand}</p>
                    <h2 className="text-lg font-bold text-zinc-950">{product.name}</h2>
                    <p className="text-sm text-zinc-600">{formatARS(product.price)}</p>
                  </div>
                  <div className="inline-flex items-center overflow-hidden rounded border border-black">
                    <button
                      type="button"
                      className="px-3 py-2 text-sm"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                    >
                      -
                    </button>
                    <span className="px-3 py-2 text-sm">{quantity}</span>
                    <button
                      type="button"
                      className="px-3 py-2 text-sm"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="font-bold text-zinc-950">{formatARS(product.price * quantity)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(product.id)}
                  className="mt-3 text-xs font-semibold uppercase tracking-widest text-red-600"
                >
                  Eliminar
                </button>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-xl border-2 border-black bg-white p-5 shadow-[6px_6px_0_#11111118]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Resumen</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-zinc-600">Total</span>
              <span className="text-2xl font-black">{formatARS(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-600">Productos originales | Envíos a todo el país | Atención rápida por WhatsApp.</p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-5 block rounded-md border-2 border-[#25D366] bg-[#25D366] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-black"
            >
              Coordinar compra por WhatsApp
            </a>
            <Link
              href="/checkout"
              className="mt-2 block rounded-md border-2 border-zinc-300 bg-white px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-zinc-700"
            >
              Ver resumen
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
