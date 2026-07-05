"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { ProductThumbnail } from "@/components/common/product-thumbnail";
import { ProductCard } from "@/components/common/product-card";
import { useStore } from "@/context/store-context";
import { formatARS } from "@/lib/utils";

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
  const router = useRouter();
  const safeImages = product.images.length > 0 ? product.images : ["Imagen principal"];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImage = safeImages[selectedImageIndex] ?? safeImages[0];
  const hasMultipleImages = safeImages.length > 1;
  const { addToCart } = useStore();
  const outOfStock = product.stock <= 0;
  const shortDescription = product.shortDescription?.trim() || product.description;
  const fullDescription = product.description?.trim();

  const goToPreviousImage = () => {
    setSelectedImageIndex((current) => (current === 0 ? safeImages.length - 1 : current - 1));
  };

  const goToNextImage = () => {
    setSelectedImageIndex((current) => (current === safeImages.length - 1 ? 0 : current + 1));
  };

  const shippingEta = useMemo(
    () =>
      outOfStock
        ? "Sin stock por el momento. Consultá disponibilidad con nuestro equipo."
        : product.freeShipping
          ? "Envío gratis a todo el país con demora estimada de 1 semana."
          : "Envíos a todo el país con demora estimada de 1 semana.",
    [outOfStock, product.stock, product.freeShipping],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-800 transition-colors" aria-label="Inicio">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </Link>
        <span>›</span>
        <Link href={`/catalogo?categoria=${encodeURIComponent(product.category)}`} className="capitalize hover:text-zinc-800 transition-colors">{product.category}</Link>
        <span>›</span>
        <Link href={`/catalogo?marca=${encodeURIComponent(product.brand)}`} className="hover:text-zinc-800 transition-colors">{product.brand}</Link>
        <span>›</span>
        <span className="text-zinc-900 font-medium truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative">
            <ProductThumbnail
              label={product.name}
              imageSrc={selectedImage}
              className="h-96 border-2 border-black"
            />
            {hasMultipleImages ? (
              <>
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-zinc-300 bg-white text-zinc-900 shadow-md transition hover:scale-[1.03] hover:border-zinc-900 hover:shadow-lg sm:left-4"
                  aria-label="Imagen anterior"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M12.5 4.5L7 10l5.5 5.5"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goToNextImage}
                  className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-zinc-300 bg-white text-zinc-900 shadow-md transition hover:scale-[1.03] hover:border-zinc-900 hover:shadow-lg sm:right-4"
                  aria-label="Imagen siguiente"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M7.5 4.5L13 10l-5.5 5.5"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            ) : null}
          </div>
          {hasMultipleImages ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {safeImages.map((image, index) => {
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition flex-shrink-0 ${
                      selectedImageIndex === index
                        ? "border-black ring-2 ring-black/20"
                        : "border-zinc-300 hover:border-zinc-500"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                    aria-current={selectedImageIndex === index}
                  >
                    <ProductThumbnail
                      label={`Imagen ${index + 1}`}
                      imageSrc={image}
                      sizes="64px"
                      className="h-full w-full rounded-md border-0"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-red-600 font-bold">{product.brand}</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">{product.name}</h1>
          <p className="text-sm text-zinc-600">{shortDescription}</p>

          <div>
            {product.previousPrice ? (
              <p className="text-sm text-zinc-500 line-through">{formatARS(product.previousPrice)}</p>
            ) : null}
            <p className="text-4xl font-black text-zinc-950">{formatARS(product.price)}</p>
            {product.installments ? <p className="text-sm text-zinc-600">{product.installments}</p> : null}
            <p className={outOfStock ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-green-600"}>
              {outOfStock ? "Sin stock" : "Stock disponible"}
            </p>
            {product.freeShipping && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.5 3A1.5 1.5 0 005 4.5v.75H3.5A1.5 1.5 0 002 6.75v7A1.5 1.5 0 003.5 15.25h.293a2.25 2.25 0 004.414 0h3.586a2.25 2.25 0 004.414 0h.293A1.5 1.5 0 0018 13.75v-3.19a1.5 1.5 0 00-.44-1.06l-2.56-2.56A1.5 1.5 0 0013.94 6.5H13V4.5A1.5 1.5 0 0011.5 3h-5zM6.5 4.5h5V9H6.5V4.5zM5 10.5v3.5H4.207a2.25 2.25 0 00-.457-.75H5v-2.75zM13 7.75h.94l2.56 2.56v.44H13V7.75z" />
                </svg>
                Envío gratis
              </span>
            )}
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
            <button
              type="button"
              onClick={() => {
                addToCart(product.id, product);
                router.push("/checkout");
              }}
              disabled={outOfStock}
              className="rounded-md border-2 border-black bg-black px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-zinc-600"
            >
              {outOfStock ? "Sin stock" : "Comprar"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Envíos */}
            <div className="flex flex-col items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <svg className="h-7 w-7 shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-zinc-900">Envíos a todo el país</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">{product.freeShipping ? "Envío gratis con demora estimada de 1 semana." : "Demora estimada de 1 semana."}</p>
              </div>
            </div>
            {/* Medios de pago */}
            <div className="flex flex-col items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <svg className="h-7 w-7 shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-zinc-900">Medios de pago</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">Mercado Pago, tarjetas y transferencia.</p>
              </div>
            </div>
            {/* Retiro */}
            <div className="flex flex-col items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <svg className="h-7 w-7 shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-zinc-900">Retiro en Posadas</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">Retiro disponible solo en Posadas, Misiones.</p>
              </div>
            </div>
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
              <li
                key={spec.label}
                className="flex flex-col gap-1 rounded border border-zinc-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-semibold">{spec.label}</span>
                <span className="break-words text-zinc-600 sm:text-right">{spec.value}</span>
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
