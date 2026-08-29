import Link from "next/link";
import { Product } from "@/types";
import { resolvePublicImageUrl } from "@/lib/public-image-url";
import { formatARS } from "@/lib/utils";

const DisplayIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path strokeLinecap="round" d="M9 20h6M12 16v4" />
  </svg>
);

const ProcessorIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path strokeLinecap="round" d="M9 3.5v2.5M12 3.5v2.5M15 3.5v2.5M9 18v2.5M12 18v2.5M15 18v2.5M3.5 9h2.5M3.5 12h2.5M3.5 15h2.5M18 9h2.5M18 12h2.5M18 15h2.5" />
  </svg>
);

const GpuIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2.5" y="7" width="19" height="9" rx="1.5" />
    <circle cx="8" cy="11.5" r="2" />
    <circle cx="14.5" cy="11.5" r="2" />
    <path strokeLinecap="round" d="M5 16v2.5M19 16v2.5" />
  </svg>
);

const MemoryIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="6" width="18" height="9" rx="1" />
    <path strokeLinecap="round" d="M6 15v3M9 15v3M12 15v3M15 15v3M18 15v3" />
  </svg>
);

const StorageIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path strokeLinecap="round" d="M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6" />
    <path strokeLinecap="round" d="M4 12c0 1.657 3.582 3 8 3s8-1.343 8-3" />
  </svg>
);

const GenericSpecIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const specIconFor = (label: string) => {
  const normalized = label.toLowerCase();
  if (/procesador|cpu|processor/.test(normalized)) return <ProcessorIcon />;
  if (/gráfica|grafica|gpu|video/.test(normalized)) return <GpuIcon />;
  if (/pantalla|display|screen/.test(normalized)) return <DisplayIcon />;
  if (/ram|memoria/.test(normalized)) return <MemoryIcon />;
  if (/ssd|hdd|almacenamiento|disco|storage/.test(normalized)) return <StorageIcon />;
  return <GenericSpecIcon />;
};

export function ImportedProductCard({ product }: { product: Product }) {
  const imageSrc = resolvePublicImageUrl(product.images[0]);
  const specs = product.specs.filter((spec) => spec.value.trim().length > 0).slice(0, 4);

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:-translate-y-0.5 hover:border-zinc-700"
    >
      <div className="relative flex h-[140px] items-center justify-center overflow-hidden bg-zinc-900">
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

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">{product.brand}</p>
          <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white">{product.name}</h3>
        </div>

        {specs.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-zinc-400">
            {specs.map((spec, index) => (
              <span key={`${spec.label}-${index}`} className="flex items-center gap-1">
                {specIconFor(spec.label)}
                {spec.value}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-1">
          {product.price !== undefined ? (
            <p className="text-lg font-bold text-white">{formatARS(product.price)}</p>
          ) : (
            <p className="text-lg font-bold text-white">Consultar precio</p>
          )}
          {product.installments && product.price !== undefined ? (
            <p className="text-[11px] text-zinc-500">{product.installments}</p>
          ) : null}

          <p className="mt-2.5 flex items-center gap-1.5 border-t border-zinc-800 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-red-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
            Bajo reserva
          </p>
        </div>
      </div>
    </Link>
  );
}
