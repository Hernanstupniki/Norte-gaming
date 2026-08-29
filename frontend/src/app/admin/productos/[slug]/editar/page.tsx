"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminGetProductBySlug, AdminProductItem } from "@/lib/admin-api";
import { ProductForm } from "@/components/admin/product-form";

export default function AdminEditProductPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<AdminProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await adminGetProductBySlug(params.slug);
        if (!cancelled) setProduct(found);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error && "status" in err && (err as { status?: number }).status === 404
              ? "Producto no encontrado."
              : `No se pudo cargar el producto: ${err instanceof Error ? err.message : "Error desconocido"}`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Catálogo</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
              {product ? `Editar: ${product.name}` : "Editar producto"}
            </h1>
          </div>
          <Link
            href="/admin/productos"
            className="text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-900"
          >
            ← Volver al listado
          </Link>
        </div>
      </section>

      {loading ? <p className="text-sm text-zinc-600">Cargando producto...</p> : null}
      {error ? <div className="rounded-lg bg-red-100 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-800">{error}</div> : null}
      {!loading && product ? <ProductForm product={product} /> : null}
    </div>
  );
}
