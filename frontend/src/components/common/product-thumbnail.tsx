import Image from "next/image";
import { resolvePublicImageUrl } from "@/lib/public-image-url";
import { cn } from "@/lib/utils";

interface ProductThumbnailProps {
  label?: string;
  imageSrc?: string;
  sizes?: string;
  className?: string;
}

export function ProductThumbnail({ label, imageSrc, sizes, className }: ProductThumbnailProps) {
  const safeLabel = (label || "Imagen de producto").trim();
  const normalizedImageSrc = resolvePublicImageUrl(imageSrc);
  const normalizedSafeLabel = resolvePublicImageUrl(safeLabel);
  const isValidSource = (value?: string) => {
    if (!value) return false;
    return /^https?:\/\//i.test(value) || value.startsWith("/");
  };

  const source = isValidSource(normalizedImageSrc)
    ? normalizedImageSrc
    : isValidSource(normalizedSafeLabel)
      ? normalizedSafeLabel
      : undefined;

  const isRemoteSource = Boolean(source && /^https?:\/\//i.test(source));

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white",
        className,
      )}
    >
      {source ? (
        <Image
          src={source}
          alt={safeLabel}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
          unoptimized={isRemoteSource}
          className="object-contain"
          priority
        />
      ) : (
        <>
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,#d4d4d8_1px,transparent_1px),linear-gradient(to_bottom,#d4d4d8_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -left-7 top-4 h-14 w-14 rounded-full border-2 border-red-500/70" />
          <div className="absolute -bottom-6 right-6 h-16 w-16 rotate-12 border-2 border-black/60" />
          <div className="relative flex h-full min-h-40 items-center justify-center p-4 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-700">{safeLabel}</p>
          </div>
        </>
      )}
    </div>
  );
}
