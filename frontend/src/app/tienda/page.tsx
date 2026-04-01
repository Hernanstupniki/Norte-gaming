import { Suspense } from "react";
import { Storefront } from "@/components/shop/storefront";

export default function TiendaPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-14">Cargando catálogo...</div>}>
      <Storefront />
    </Suspense>
  );
}
