"use client";

import Link from "next/link";
import { useStore } from "@/context/store-context";
import { formatARS } from "@/lib/utils";
import { buildProductWhatsAppHref } from "@/lib/whatsapp";
import { Product } from "@/types";
import { ProductThumbnail } from "./product-thumbnail";

const badgeStyles: Record<string, string> = {
  oferta: "bg-red-600 text-white",
  destacado: "bg-black text-white",
  nuevo: "bg-zinc-200 text-zinc-900",
  "mas-vendido": "bg-white text-zinc-900 border border-zinc-300",
  "sin-stock": "bg-red-100 text-red-700 border border-red-300",
};

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, auth, favorites, toggleFavorite } = useStore();
  const isFavorite = favorites.includes(product.id);
  const whatsappHref = buildProductWhatsAppHref(product);
  const outOfStock = product.stock <= 0;

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border-2 border-black/10 bg-white p-3 sm:p-4 shadow-[6px_6px_0_#17171712] transition hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#17171720]">
      <Link href={`/producto/${product.slug}`} className="block space-y-3">
        <ProductThumbnail label={product.name} imageSrc={product.images[0]} className="h-44" />
        <div className="min-h-7 flex flex-wrap content-start gap-2">
          {product.badges.map((badge) => (
            <span
              key={badge}
              className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${badgeStyles[badge]}`}
            >
              {badge.replace("-", " ")}
            </span>
          ))}
        </div>
        <div className="min-h-24 space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{product.brand}</p>
          <h3 className="line-clamp-2 text-base font-semibold text-zinc-950">{product.name}</h3>
          <p className="line-clamp-2 text-xs text-zinc-600">{product.shortDescription}</p>
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col justify-end space-y-3">
        <div className="min-h-28">
          {product.previousPrice ? (
            <p className="text-xs text-zinc-500 line-through">{formatARS(product.previousPrice)}</p>
          ) : null}
          <p className="text-2xl font-bold text-zinc-950">{formatARS(product.price)}</p>
          {product.installments ? <p className="text-xs text-zinc-600">{product.installments}</p> : null}
          <p className={`mt-1 text-xs ${outOfStock ? "font-semibold text-red-600" : "text-zinc-500"}`}>
            {outOfStock ? "Sin stock" : `Stock: ${product.stock}`}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-end">
          <button
            type="button"
            onClick={() => addToCart(product.id, product)}
            disabled={outOfStock}
            className="w-full rounded-lg border-2 border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 hover:bg-zinc-900 active:translate-y-[2px] active:scale-[0.99] disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-zinc-600 sm:flex-1"
          >
            {outOfStock ? "Sin stock" : "Agregar"}
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-lg border-2 border-[#25D366] bg-[#25D366] px-3 py-2 text-center text-xs font-semibold uppercase tracking-widest text-black transition duration-150 hover:brightness-95 active:translate-y-[2px] active:scale-[0.99] sm:w-auto"
          >
            {outOfStock ? "Consultar por WhatsApp" : "WhatsApp"}
          </a>
          {auth.isLoggedIn ? (
            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              className="w-full rounded-lg border-2 border-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-950 transition duration-150 hover:bg-zinc-100 active:translate-y-[2px] active:scale-[0.99] sm:w-auto"
            >
              {isFavorite ? "Guardado" : "Guardar"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
