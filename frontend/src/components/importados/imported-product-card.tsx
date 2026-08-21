import Link from "next/link";
import { Product } from "@/types";
import { resolvePublicImageUrl } from "@/lib/public-image-url";

const specSummary = (product: Product) => {
  const values = product.specs
    .slice(0, 2)
    .map((spec) => spec.value)
    .filter((value) => value.trim().length > 0);
  return values.length > 0 ? values.join(" - ") : null;
};

export function ImportedProductCard({ product }: { product: Product }) {
  const imageSrc = resolvePublicImageUrl(product.images[0]);
  const spec = specSummary(product);

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:-translate-y-0.5 hover:border-zinc-700"
    >
      <div className="relative flex h-[135px] items-center justify-center overflow-hidden bg-zinc-900">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="px-3 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            {product.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">{product.brand}</p>
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white">{product.name}</h3>
        {spec ? <p className="text-xs leading-tight text-zinc-500">{spec}</p> : null}
        <p className="mt-auto flex items-center gap-1 pt-2.5 text-xs font-bold uppercase tracking-wider text-red-500">
          <span aria-hidden="true">+</span> A pedido
        </p>
      </div>
    </Link>
  );
}
