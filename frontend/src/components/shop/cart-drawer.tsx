"use client";

import Link from "next/link";
import { useStore } from "@/context/store-context";
import { formatARS } from "@/lib/utils";
import { buildCartWhatsAppHref } from "@/lib/whatsapp";

export function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartProducts,
    updateQuantity,
    removeFromCart,
    subtotal,
  } = useStore();
  const whatsappHref = buildCartWhatsAppHref(cartProducts, subtotal);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition ${
          isCartOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden border-l-2 border-black bg-white p-6 transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-widest">Tu carrito</h3>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-md border-2 border-black px-2 py-1 text-xs font-bold uppercase"
          >
            Cerrar
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-4 pr-1 [touch-action:pan-y]">
          {cartProducts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">
              Tu carrito está vacío. Explorá el catálogo para sumar periféricos.
            </p>
          ) : (
            cartProducts.map(({ product, quantity }) => (
              <div key={product.id} className="rounded-xl border border-zinc-200 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{product.brand}</p>
                <p className="text-sm font-semibold text-zinc-950">{product.name}</p>
                <p className="text-sm font-bold">{formatARS(product.price)}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center overflow-hidden rounded border border-black">
                    <button
                      type="button"
                      className="px-2 py-1 text-sm"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-sm">{quantity}</span>
                    <button
                      type="button"
                      className="px-2 py-1 text-sm"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-xs uppercase tracking-widest text-red-600"
                    onClick={() => removeFromCart(product.id)}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 shrink-0 border-t-2 border-black bg-white pt-4">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-zinc-600">Subtotal</span>
            <span className="text-lg font-bold text-zinc-950">{formatARS(subtotal)}</span>
          </div>
          <div className="grid gap-2">
            <Link
              href="/carrito"
              onClick={closeCart}
              className="rounded-lg border-2 border-black px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest text-zinc-950"
            >
              Ver carrito
            </Link>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="rounded-lg border-2 border-zinc-400 bg-zinc-100 px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest text-zinc-700"
            >
              Ver resumen
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              onClick={closeCart}
              className="rounded-lg border-2 border-[#25D366] bg-[#25D366] px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest text-black"
            >
              Coordinar por WhatsApp
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
