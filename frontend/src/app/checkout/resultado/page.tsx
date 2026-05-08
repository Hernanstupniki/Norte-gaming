import Link from "next/link";

type CheckoutResultPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const getParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export default async function CheckoutResultPage({ searchParams }: CheckoutResultPageProps) {
  const params = searchParams ? await searchParams : {};
  const status = getParam(params.status) || "pending";
  const order = getParam(params.order);
  const paymentId = getParam(params.payment_id);

  const isSuccess = status === "success";
  const isFailure = status === "failure";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12 md:px-6">
      <section className="w-full rounded-2xl border-2 border-black bg-white p-8 shadow-[8px_8px_0_#11111118]">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Pago Mercado Pago</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          {isSuccess ? "Compra confirmada" : isFailure ? "Pago rechazado" : "Pago en revisión"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          {isSuccess
            ? "Si el pago quedó aprobado, tu orden ya fue registrada y debería reflejarse en tu cuenta."
            : isFailure
              ? "El pago no pudo completarse. Podés volver al carrito e intentar de nuevo o elegir otro medio de pago."
              : "El pedido quedó generado y Mercado Pago puede tardar unos minutos en confirmar el estado final."}
        </p>

        <div className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          {order ? <p>Orden: {order}</p> : null}
          {paymentId ? <p>Pago: {paymentId}</p> : null}
          <p>Estado: {status}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/mi-cuenta"
            className="rounded-md border-2 border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
          >
            Ver mi cuenta
          </Link>
          <Link
            href="/tienda"
            className="rounded-md border-2 border-zinc-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-700"
          >
            Seguir comprando
          </Link>
        </div>
      </section>
    </main>
  );
}