import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">404</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Producto o página no encontrada</h1>
      <p className="mt-3 text-zinc-600">Puede que el link haya cambiado o el producto no esté disponible.</p>
      <Link
        href="/tienda"
        className="mt-6 rounded-md border-2 border-black bg-black px-4 py-3 text-xs font-bold uppercase tracking-widest text-white"
      >
        Volver al catálogo
      </Link>
    </main>
  );
}
