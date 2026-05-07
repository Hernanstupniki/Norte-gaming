"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/store-context";
import { formatARS } from "@/lib/utils";
import {
  addMyCartItem,
  clearMyCart,
  createMyAddress,
  createOrder,
  createPayment,
  getMyAddresses,
  getShippingMethods,
  ShippingMethod,
  UserAddress,
} from "@/lib/backend-api";

type AddressForm = {
  recipient: string;
  phone: string;
  street: string;
  number: string;
  floor: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
  reference: string;
};

const emptyAddressForm: AddressForm = {
  recipient: "",
  phone: "",
  street: "",
  number: "",
  floor: "",
  apartment: "",
  city: "",
  province: "Misiones",
  postalCode: "",
  reference: "",
};

const addressFields: Array<{ key: keyof AddressForm; label: string }> = [
  { key: "recipient", label: "Nombre y apellido" },
  { key: "phone", label: "Teléfono" },
  { key: "street", label: "Calle" },
  { key: "number", label: "Número" },
  { key: "floor", label: "Piso" },
  { key: "apartment", label: "Departamento" },
  { key: "city", label: "Ciudad" },
  { key: "province", label: "Provincia" },
  { key: "postalCode", label: "Código postal" },
  { key: "reference", label: "Referencia" },
];

const paymentMethods = [
  { id: "mercado-pago", label: "Mercado Pago", provider: "Mercado Pago", method: "Mercado Pago" },
  { id: "transferencia", label: "Transferencia bancaria", provider: "Transferencia", method: "Transferencia bancaria" },
  { id: "efectivo", label: "Efectivo / retiro", provider: "Efectivo", method: "Efectivo o retiro" },
];

export default function CheckoutPage() {
  const { cartProducts, subtotal, auth, clearCart } = useStore();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(paymentMethods[0].id);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddressForm);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => method.id === selectedPaymentMethodId) ?? paymentMethods[0],
    [selectedPaymentMethodId],
  );

  const selectedShippingMethod = shippingMethods.find((method) => method.id === selectedShippingMethodId);

  useEffect(() => {
    if (!auth.isLoggedIn || !auth.accessToken) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([getMyAddresses(auth.accessToken), getShippingMethods()])
      .then(([loadedAddresses, loadedShippingMethods]) => {
        if (cancelled) {
          return;
        }

        setAddresses(loadedAddresses);
        setShippingMethods(loadedShippingMethods);

        const primaryAddress = loadedAddresses.find((address) => address.isPrimary) ?? loadedAddresses[0];
        setSelectedAddressId(primaryAddress ? primaryAddress.id : "new");

        const firstShippingMethod = loadedShippingMethods[0];
        setSelectedShippingMethodId(firstShippingMethod ? firstShippingMethod.id : "");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar el checkout");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [auth.accessToken, auth.isLoggedIn]);

  const handleConfirmPurchase = async () => {
    if (!auth.isLoggedIn || !auth.accessToken) {
      setErrorMessage("Tenés que iniciar sesión para finalizar la compra.");
      return;
    }

    if (cartProducts.length === 0) {
      setErrorMessage("El carrito está vacío.");
      return;
    }

    if (!selectedShippingMethodId) {
      setErrorMessage("Elegí un método de envío.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let addressId = selectedAddressId;

      if (selectedAddressId === "new") {
        if (
          !addressForm.recipient ||
          !addressForm.phone ||
          !addressForm.street ||
          !addressForm.number ||
          !addressForm.city ||
          !addressForm.province ||
          !addressForm.postalCode
        ) {
          throw new Error("Completá los datos de dirección para seguir.");
        }

        const createdAddress = await createMyAddress(auth.accessToken, {
          recipient: addressForm.recipient,
          phone: addressForm.phone,
          street: addressForm.street,
          number: addressForm.number,
          floor: addressForm.floor || undefined,
          apartment: addressForm.apartment || undefined,
          city: addressForm.city,
          province: addressForm.province,
          postalCode: addressForm.postalCode,
          reference: addressForm.reference || undefined,
          isPrimary: addresses.length === 0,
        });

        addressId = createdAddress.id;
        setAddresses((previous) => [...previous, createdAddress]);
      }

      await clearMyCart(auth.accessToken);
      for (const item of cartProducts) {
        await addMyCartItem(auth.accessToken, item.product.id, item.quantity);
      }

      const order = await createOrder(auth.accessToken, {
        addressId,
        shippingMethodId: selectedShippingMethodId,
        notes: notes.trim() || undefined,
      });

      const paymentResponse = await createPayment(auth.accessToken, {
          orderId: order.id,
          provider: selectedPaymentMethod.provider,
          method: selectedPaymentMethod.method,
          amount: order.total,
          currency: "ARS",
          externalReference: order.orderNumber,
          metadata: {
            checkoutSource: "frontend",
            paymentMethodId: selectedPaymentMethod.id,
            shippingMethodId: selectedShippingMethodId,
          },
        });

      if (selectedPaymentMethod.id === "mercado-pago" && paymentResponse.initPoint) {
        clearCart();
        window.location.assign(paymentResponse.initPoint);
        return;
      }

      clearCart();
      setSuccessMessage(
        paymentResponse.message || `Tu compra quedó registrada. Número de orden: ${order.orderNumber}.`,
      );
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo finalizar la compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-black tracking-tight">Checkout</h1>
      <p className="mt-2 text-zinc-600">
        Elegí dirección, envío y método de pago para confirmar tu compra sin salir de la tienda.
      </p>

      {errorMessage ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      ) : null}

      {cartProducts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
          <p className="text-zinc-600">No hay productos en el carrito.</p>
          <Link
            href="/tienda"
            className="mt-4 inline-flex rounded-md border-2 border-black px-4 py-2 text-xs font-semibold uppercase tracking-widest"
          >
            Ir a tienda
          </Link>
        </div>
      ) : !auth.isLoggedIn ? (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8">
          <h2 className="text-xl font-bold text-zinc-950">Necesitás iniciar sesión</h2>
          <p className="mt-2 text-sm text-zinc-600">
            La compra directa usa tu carrito y tus datos guardados para generar la orden y el pago.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-md border-2 border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white"
          >
            Ingresar
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">Tu compra</h2>
              <div className="mt-4 space-y-3">
                {cartProducts.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="max-w-[260px] text-zinc-700">{product.name} x{quantity}</span>
                    <span className="font-semibold text-zinc-900">{formatARS(product.price * quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Dirección</label>
                <select
                  value={selectedAddressId}
                  onChange={(event) => setSelectedAddressId(event.target.value)}
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="new">Nueva dirección</option>
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.recipient} - {address.street} {address.number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Envío</label>
                <select
                  value={selectedShippingMethodId}
                  onChange={(event) => setSelectedShippingMethodId(event.target.value)}
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  disabled={isLoading}
                >
                  <option value="">Seleccionar método</option>
                  {shippingMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name} - {formatARS(Number(method.cost))}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedAddressId === "new" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {addressFields.map(({ key, label }) => (
                  <label key={key} className="text-sm">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                      {label}
                    </span>
                    <input
                      value={addressForm[key]}
                      onChange={(event) =>
                        setAddressForm((previous) => ({
                          ...previous,
                          [key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2"
                    />
                  </label>
                ))}
              </div>
            ) : null}

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Método de pago</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethodId(method.id)}
                    className={`rounded-md border px-3 py-3 text-left text-sm transition ${
                      selectedPaymentMethodId === method.id
                        ? "border-black bg-black text-white"
                        : "border-zinc-300 bg-white text-zinc-700"
                    }`}
                  >
                    <span className="block font-semibold">{method.label}</span>
                    <span className="block text-xs opacity-80">Orden + pago registrado</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Notas</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2"
                placeholder="Indicaciones de entrega, horario, referencias o aclaraciones de pago."
              />
            </label>

            <p className="text-sm text-zinc-600">
              Vas a confirmar una orden con {selectedPaymentMethod.label.toLowerCase()} y {selectedShippingMethod ? selectedShippingMethod.name.toLowerCase() : "el envío elegido"}.
            </p>
          </section>

          <aside className="h-fit rounded-xl border-2 border-black bg-white p-5 shadow-[6px_6px_0_#11111118]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total estimado</p>
            <p className="mt-3 text-3xl font-black">
              {formatARS(subtotal + (selectedShippingMethod ? Number(selectedShippingMethod.cost) : 0))}
            </p>

            <div className="mt-4 space-y-2 text-sm text-zinc-600">
              <p>Subtotal: {formatARS(subtotal)}</p>
              <p>Envío: {selectedShippingMethod ? formatARS(Number(selectedShippingMethod.cost)) : formatARS(0)}</p>
              <p>Pago: {selectedPaymentMethod.label}</p>
            </div>

            <button
              type="button"
              onClick={handleConfirmPurchase}
              disabled={isSubmitting || isLoading}
              className="mt-5 block w-full rounded-md border-2 border-black bg-black px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-zinc-600"
            >
              {isSubmitting ? "Confirmando..." : "Confirmar compra"}
            </button>

            <Link
              href="/carrito"
              className="mt-2 block rounded-md border-2 border-zinc-300 bg-white px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-zinc-700"
            >
              Volver al carrito
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
