"use client";

import Link from "next/link";
import { formatARS } from "@/lib/utils";
import { buildAvailabilityWhatsAppHref } from "@/lib/whatsapp";
import { Product } from "@/types";
import { ProductThumbnail } from "./product-thumbnail";

const badgeStyles: Record<string, string> = {
  destacado: "bg-black text-white",
  "mas-vendido": "bg-white text-zinc-900 border border-zinc-300",
  "sin-stock": "bg-red-100 text-red-700 border border-red-300",
  "a-pedido": "bg-red-600 text-white",
};

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border-2 border-black/10 bg-white p-3 sm:p-4 shadow-[6px_6px_0_#17171712] transition hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#17171720]">
      <Link href={`/producto/${product.slug}`} className="block space-y-2.5">
        <ProductThumbnail label={product.name} imageSrc={product.images[0]} className="h-44" />
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{product.brand}</p>
          <h3 className="line-clamp-2 text-base font-semibold text-zinc-950">{product.name}</h3>
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <div>
          {product.previousPrice ? (
            <p className="text-xs text-red-500 line-through">{formatARS(product.previousPrice)}</p>
          ) : null}
          {product.price !== undefined ? (
            <p className="text-2xl font-bold text-zinc-950">{formatARS(product.price)}</p>
          ) : (
            <p className="text-2xl font-bold text-zinc-950">Consultar precio</p>
          )}
          {product.installments ? <p className="text-xs text-zinc-600">{product.installments}</p> : null}
          <p className={`mt-1 text-xs ${outOfStock ? "font-semibold text-red-600" : "text-zinc-500"}`}>
            {outOfStock ? "Sin stock" : "Disponible"}
          </p>
          {product.freeShipping && (
            <p className="mt-1 text-xs font-semibold text-green-600">Envío gratis</p>
          )}
        </div>
        {product.badges.length > 0 ? (
          <div className="mt-auto pt-3 flex flex-wrap gap-2">
            {product.badges.map((badge) => (
              <span
                key={badge}
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${badgeStyles[badge]}`}
              >
                {badge.replace("-", " ")}
              </span>
            ))}
          </div>
        ) : null}
        {product.availability === "order-only" ? (
          <a
            href={buildAvailabilityWhatsAppHref(product)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="mt-3 block w-full rounded-md border-2 border-red-700 bg-red-600 px-3 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-white transition hover:bg-red-700"
          >
            Consultar disponibilidad
          </a>
        ) : null}
      </div>
    </article>
  );
}
