"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { ProductThumbnail } from "@/components/common/product-thumbnail";
import { ProductCard } from "@/components/common/product-card";
import { useStore } from "@/context/store-context";
import { formatARS } from "@/lib/utils";
import { buildProductWhatsAppHref } from "@/lib/whatsapp";

interface ProductDetailClientProps {
  product: Product;
  related: Product[];
  reviewComments: Array<{ name: string; rating: number; comment: string; verified: boolean }>;
}

export function ProductDetailClient({
  product,
  related,
  reviewComments,
}: ProductDetailClientProps) {
  const safeImages = product.images.length > 0 ? product.images : ["Imagen principal"];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImage = safeImages[selectedImageIndex] ?? safeImages[0];
  const [variant, setVariant] = useState("Negro");
  const { addToCart, auth, favorites, toggleFavorite } = useStore();
  const isFavorite = favorites.includes(product.id);
  const whatsappHref = buildProductWhatsAppHref(product);
  const outOfStock = product.stock <= 0;
  const shortDescription = product.shortDescription?.trim() || product.description;
  const fullDescription = product.description?.trim();

  const goToPreviousImage = () => {
    setSelectedImageIndex((current) =>
      current === 0 ? safeImages.length - 1 : current - 1,
    );
  };

  const goToNextImage = () => {
    setSelectedImageIndex((current) =>
      current === safeImages.length - 1 ? 0 : current + 1,
    );
  };

  const shippingEta = useMemo(
    () =>
      outOfStock
        ? "Sin stock por el momento. Consultá disponibilidad por WhatsApp."
        : "Envíos a todo el país con demora estimada de 1 semana.",
    [outOfStock, product.stock],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <ProductThumbnail
            label={product.name}
            imageSrc={selectedImage}
            className="h-96 border-2 border-black"
          />
          {safeImages.length > 1 ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousImage}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                aria-label="Imagen anterior"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={goToNextImage}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                aria-label="Imagen siguiente"
              >
                &gt;
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{product.brand}</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">{product.name}</h1>
          <p className="text-sm text-zinc-600">{shortDescription}</p>

          <div>
            {product.previousPrice ? (
              <p className="text-sm text-zinc-500 line-through">{formatARS(product.previousPrice)}</p>
            ) : null}
            <p className="text-4xl font-black text-zinc-950">{formatARS(product.price)}</p>
            {product.installments ? <p className="text-sm text-zinc-600">{product.installments}</p> : null}
            <p className={outOfStock ? "text-sm font-semibold text-red-600" : "text-sm text-zinc-600"}>
              {outOfStock ? "Sin stock" : `Stock disponible: ${product.stock}`}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Variante</label>
            <select
              value={variant}
              onChange={(event) => setVariant(event.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              <option>Negro</option>
              <option>Blanco</option>
              <option>Gris grafito</option>
            </select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => addToCart(product.id, product)}
              disabled={outOfStock}
              className="rounded-md border-2 border-red-700 bg-red-600 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-zinc-600"
            >
              {outOfStock ? "Sin stock" : "Agregar al carrito"}
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border-2 border-[#1FA855] bg-[#25D366] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-black"
            >
              {outOfStock ? "Consultar stock por WhatsApp" : "Comprar por WhatsApp"}
            </a>
          </div>

          {auth.isLoggedIn ? (
            <div className="grid gap-2 sm:grid-cols-1">
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                className="rounded-md border-2 border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-900"
              >
                {isFavorite ? "Deshacer guardado" : "Guardar"}
              </button>
            </div>
          ) : null}

          <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            <p>Envíos: {shippingEta}</p>
            <p>Pagos: distintos medios de pago disponibles (Mercado Pago, tarjetas y transferencia).</p>
            <p>Retiro: disponible solo en Posadas, Misiones.</p>
          </div>
        </div>
      </div>

      {fullDescription && fullDescription !== shortDescription ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-zinc-950">Descripción completa</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-700">{fullDescription}</p>
        </section>
      ) : null}

      <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">Especificaciones técnicas</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            {product.specs.map((spec) => (
              <li key={spec.label} className="flex justify-between rounded border border-zinc-200 bg-white px-3 py-2">
                <span className="font-semibold">{spec.label}</span>
                <span>{spec.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold">Reseñas</h2>
          <div className="mt-4 space-y-3">
            {reviewComments.length === 0 ? (
              <p className="text-sm text-zinc-600">Todavía no hay reseñas para este producto.</p>
            ) : (
              reviewComments.map((review) => (
                <article key={`${review.name}-${review.comment}`} className="rounded border border-zinc-200 bg-white p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-zinc-500">
                    <span>{review.name}</span>
                    <span>{"★".repeat(review.rating)}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-700">{review.comment}</p>
                  {review.verified ? <p className="mt-2 text-[11px] text-green-700">Compra verificada</p> : null}
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black">Productos relacionados</h2>
          <Link href="/tienda" className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
            Ver más
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
