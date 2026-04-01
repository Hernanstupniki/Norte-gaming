import { ProductsAdminClient } from "@/components/admin/products-admin-client";

export const metadata = {
  title: "Admin - Crear producto",
  robots: "noindex, nofollow",
};

export default function AdminProductsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-6">
        <h1 className="text-4xl font-black tracking-tight text-zinc-950">Panel de administración</h1>
        <p className="mt-2 text-zinc-600">Gestiona productos de tu catálogo</p>
      </div>
      <ProductsAdminClient />
    </div>
  );
}
