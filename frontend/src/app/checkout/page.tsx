"use client";

import { useEffect, useRef, useState } from "react";
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
  type ShippingMethod,
  type UserAddress,
} from "@/lib/backend-api";

// ─── Shipping config ──────────────────────────────────────────────────────────

const FREE_SHIPPING_THRESHOLD = 160000;

const SHIPPING_TIERS = [
  { label: "Hasta 1 kg", customerPrice: 11750, realPrice: 23500 },
  { label: "Hasta 5 kg", customerPrice: 14250, realPrice: 28500 },
  { label: "Hasta 10 kg", customerPrice: 20100, realPrice: 40200 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type BuyerForm = { name: string; phone: string };

type AddressForm = {
  street: string;
  number: string;
  floor: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
  reference: string;
};

type FieldErrors = Record<string, string>;

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  {
    id: "mercado-pago",
    label: "Mercado Pago",
    provider: "Mercado Pago",
    method: "Mercado Pago",
    shortDesc: "Tarjeta de crédito, débito o transferencia. Pago 100% protegido.",
    badge: "Recomendado",
    contextMsg:
      "Al confirmar te redirigiremos a Mercado Pago para completar el pago de forma segura. Aceptan tarjetas de crédito, débito y transferencias bancarias.",
  },
  {
    id: "transferencia",
    label: "Transferencia bancaria",
    provider: "Transferencia",
    method: "Transferencia bancaria",
    shortDesc: "Al confirmar te mostramos el alias y CVU para transferir.",
    badge: null,
    contextMsg: "Al confirmar el pedido te mostramos los datos para realizar la transferencia. Envianos el comprobante por WhatsApp y acreditamos en el día.",
  },
  {
    id: "efectivo",
    label: "Efectivo / retiro",
    provider: "Efectivo",
    method: "Efectivo o retiro",
    shortDesc: "Coordinamos la entrega o el retiro personal por WhatsApp.",
    badge: null,
    contextMsg:
      "Al confirmar coordinamos por WhatsApp el lugar y horario de entrega o retiro. No se necesita pago anticipado.",
  },
];

const AR_PROVINCES = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(
  buyer: BuyerForm,
  address: AddressForm,
  isNew: boolean,
  shippingId: string,
): FieldErrors {
  const errors: FieldErrors = {};

  if (buyer.name.trim().length < 3) {
    errors.name = "Ingresá tu nombre completo.";
  }

  if (buyer.phone.replace(/\D/g, "").length < 8) {
    errors.phone = "Ingresá un teléfono válido para poder contactarte por tu pedido.";
  }

  if (isNew) {
    if (!address.street.trim()) errors.street = "Ingresá el nombre de la calle.";
    if (!address.number.trim()) errors.number = "Ingresá el número de calle.";
    if (!address.city.trim()) errors.city = "Ingresá tu ciudad o localidad.";
    if (!address.postalCode.trim()) errors.postalCode = "Ingresá tu código postal.";
  }

  if (!shippingId) {
    errors.shipping = "Elegí un método de envío para continuar.";
  }

  return errors;
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  error,
  optional,
  type = "text",
  readOnly,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  error?: string;
  optional?: boolean;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
          {label}
          {optional && (
            <span className="ml-1 font-normal normal-case tracking-normal text-zinc-400">
              (opcional)
            </span>
          )}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
            readOnly
              ? "cursor-default border-zinc-200 bg-zinc-50 text-zinc-500"
              : error
                ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200"
                : "border-zinc-300 bg-white hover:border-zinc-400 focus:border-zinc-900 focus:ring-zinc-100"
          }`}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  n,
  title,
  muted,
}: {
  n: number;
  title: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${
          muted ? "bg-zinc-300 text-zinc-600" : "bg-zinc-900"
        }`}
      >
        {n}
      </span>
      <h2
        className={`text-sm font-black uppercase tracking-[0.15em] ${
          muted ? "text-zinc-500" : "text-zinc-800"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { cartProducts, subtotal, auth, clearCart } = useStore();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [buyerForm, setBuyerForm] = useState<BuyerForm>({ name: "", phone: "" });
  const [addressForm, setAddressForm] = useState<AddressForm>({
    street: "",
    number: "",
    floor: "",
    apartment: "",
    city: "",
    province: "Misiones",
    postalCode: "",
    reference: "",
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(PAYMENT_METHODS[0].id);
  const [notes, setNotes] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {});
  };
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponInput, setCouponInput] = useState<string>("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponLabel, setCouponLabel] = useState<string>("");
  const [couponError, setCouponError] = useState<string>("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successOrderTotal, setSuccessOrderTotal] = useState<number>(0);
  const [successPaymentId, setSuccessPaymentId] = useState<string>("");

  const buyerRef = useRef<HTMLElement>(null);
  const addressRef = useRef<HTMLElement>(null);
  const shippingRef = useRef<HTMLElement>(null);

  const selectedPayment =
    PAYMENT_METHODS.find((m) => m.id === selectedPaymentId) ?? PAYMENT_METHODS[0];
  const selectedShipping = shippingMethods.find((m) => m.id === selectedShippingId);
  const isNew = selectedAddressId === "new";
  const isRetiroMethod = selectedShipping
    ? Number(selectedShipping.cost) === 0 && selectedShipping.name.toLowerCase() !== "envío gratis"
    : false;
  const isPaidShipping = selectedShipping ? Number(selectedShipping.cost) > 0 : false;
  // Customer pays 50% of shipping cost; real cost stays in DB for reference
  const shippingCost = isPaidShipping && subtotal < FREE_SHIPPING_THRESHOLD
    ? SHIPPING_TIERS[0].customerPrice
    : selectedShipping ? Number(selectedShipping.cost) : 0;
  const total = subtotal + shippingCost - couponDiscount;

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/coupons/preview?code=${encodeURIComponent(couponInput.trim())}&amount=${subtotal}`
      );
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.message || "Cupón inválido");
        setCouponDiscount(0);
        setCouponCode("");
        setCouponLabel("");
      } else {
        setCouponDiscount(data.discount);
        setCouponCode(couponInput.trim().toUpperCase());
        setCouponLabel(`${data.name} · -${formatARS(data.discount)}`);
        setCouponError("");
      }
    } catch {
      setCouponError("No se pudo verificar el cupón");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponInput("");
    setCouponDiscount(0);
    setCouponLabel("");
    setCouponError("");
  };

  // Province derived from the selected or new address
  const activeProvince = isNew
    ? addressForm.province
    : (addresses.find((a) => a.id === selectedAddressId)?.province ?? "");

  useEffect(() => {
    if (auth.name) {
      setBuyerForm((prev) => ({ ...prev, name: prev.name || auth.name }));
    }
  }, [auth.name]);

  // Load saved addresses on mount
  useEffect(() => {
    if (!auth.isLoggedIn || !auth.accessToken) return;
    let cancelled = false;
    setIsLoading(true);

    getMyAddresses(auth.accessToken)
      .then((loadedAddresses) => {
        if (cancelled) return;
        setAddresses(loadedAddresses);
        const primary = loadedAddresses.find((a) => a.isPrimary) ?? loadedAddresses[0];
        if (primary) {
          setSelectedAddressId(primary.id);
          setBuyerForm((prev) => ({
            name: prev.name || primary.recipient,
            phone: prev.phone || primary.phone,
          }));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const is401 = err instanceof Error && err.message.includes("401");
          setTopError(is401 ? "__401__" : "No se pudo cargar el checkout. Recargá la página e intentá de nuevo.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [auth.accessToken, auth.isLoggedIn]);

  // Re-fetch shipping methods whenever province changes
  useEffect(() => {
    if (!activeProvince) return;
    let cancelled = false;

    getShippingMethods(activeProvince).then((methods) => {
      if (cancelled) return;
      setShippingMethods(methods);
    }).catch(() => {});

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProvince]);

  // Auto-select shipping: standard by default, free when threshold met.
  // Never overrides a manual "retiro" selection.
  useEffect(() => {
    if (shippingMethods.length === 0) return;
    const current = shippingMethods.find((m) => m.id === selectedShippingId);
    if (current?.name.toLowerCase().includes("retiro")) return;
    const qualifies = subtotal >= FREE_SHIPPING_THRESHOLD;
    const target = qualifies
      ? shippingMethods.find((m) => Number(m.cost) === 0 && !m.name.toLowerCase().includes("retiro"))
      : shippingMethods.find((m) => Number(m.cost) > 0);
    if (target) setSelectedShippingId(target.id);
  }, [shippingMethods, subtotal]);

  const updateBuyer = (key: keyof BuyerForm) => (val: string) => {
    setBuyerForm((prev) => ({ ...prev, [key]: val }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const updateAddress = (key: keyof AddressForm) => (val: string) => {
    setAddressForm((prev) => ({ ...prev, [key]: val }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleConfirm = async () => {
    if (!auth.isLoggedIn || !auth.accessToken) {
      setTopError("Tenés que iniciar sesión para finalizar la compra.");
      return;
    }
    if (cartProducts.length === 0) {
      setTopError("El carrito está vacío.");
      return;
    }

    const errors = validateForm(buyerForm, addressForm, isNew, selectedShippingId);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTopError("Revisá los campos marcados en rojo antes de continuar.");
      if (errors.name || errors.phone) {
        buyerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errors.street || errors.number || errors.city || errors.postalCode) {
        addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errors.shipping) {
        shippingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    setTopError(null);
    setSuccessMessage(null);

    try {
      let addressId = selectedAddressId;

      if (isNew) {
        const created = await createMyAddress(auth.accessToken, {
          recipient: buyerForm.name,
          phone: buyerForm.phone,
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
        addressId = created.id;
        setAddresses((prev) => [...prev, created]);
      }

      await clearMyCart(auth.accessToken);
      for (const item of cartProducts) {
        await addMyCartItem(auth.accessToken, item.product.id, item.quantity);
      }

      const order = await createOrder(auth.accessToken, {
        addressId,
        shippingMethodId: selectedShippingId,
        notes: notes.trim() || undefined,
        couponCode: couponCode || undefined,
      });

      const payment = await createPayment(auth.accessToken, {
        orderId: order.id,
        provider: selectedPayment.provider,
        method: selectedPayment.method,
        amount: order.total,
        currency: "ARS",
        externalReference: order.orderNumber,
        metadata: {
          checkoutSource: "frontend",
          paymentMethodId: selectedPayment.id,
          shippingMethodId: selectedShippingId,
        },
      });

      if (selectedPayment.id === "mercado-pago" && payment.initPoint) {
        clearCart();
        window.location.assign(payment.initPoint);
        return;
      }

      clearCart();
      setSuccessPaymentId(selectedPayment.id);
      setSuccessOrderTotal(total);
      setSuccessMessage(
        payment.message ||
          `Tu pedido quedó registrado. Número de orden: ${order.orderNumber}. Te contactaremos para coordinar los próximos pasos.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setTopError(msg.includes("401") ? "__401__" : msg || "No se pudo finalizar la compra. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (!successMessage && cartProducts.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4 py-12 md:px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-zinc-200 bg-zinc-50">
            <svg className="h-7 w-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">El carrito está vacío</h1>
          <p className="mt-2 text-sm text-zinc-500">Sumá productos antes de continuar al checkout.</p>
          <Link
            href="/tienda"
            className="mt-6 inline-flex rounded-xl border-2 border-zinc-900 bg-zinc-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-800"
          >
            Ir a la tienda
          </Link>
        </div>
      </main>
    );
  }

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!auth.isLoggedIn) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4 py-12 md:px-6">
        <div className="w-full max-w-md rounded-2xl border-2 border-zinc-900 bg-white p-8 shadow-[6px_6px_0_#11111115]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">Checkout</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
            Iniciá sesión para continuar
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            Necesitás una cuenta para generar el pedido y recibir las confirmaciones de compra.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-xl border-2 border-zinc-900 bg-zinc-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-800"
            >
              Ingresar
            </Link>
            <Link
              href="/registro"
              className="rounded-xl border-2 border-zinc-300 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-700 hover:border-zinc-500"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (successMessage) {
    const isTransfer = successPaymentId === "transferencia";
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-12 md:px-6">
        <div className="rounded-2xl border-2 border-zinc-900 bg-white p-8 shadow-[6px_6px_0_#11111115]">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-green-200 bg-green-50">
            <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-zinc-900">¡Pedido registrado!</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{successMessage}</p>

          {isTransfer && (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Datos para transferir</p>
              <div className="rounded-xl border-2 border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs text-zinc-400 mb-1">Importe</p>
                <p className="text-2xl font-black text-zinc-900">{formatARS(successOrderTotal)}</p>
              </div>
              <div className="rounded-xl border-2 border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs text-zinc-400 mb-1.5">Alias</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-black text-zinc-900">nortegaming.pagos</span>
                  <button type="button" onClick={() => copyToClipboard("nortegaming.pagos", "alias-ok")}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${copiedField === "alias-ok" ? "bg-green-500 text-white" : "bg-zinc-900 text-white hover:bg-zinc-700"}`}>
                    {copiedField === "alias-ok" ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border-2 border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs text-zinc-400 mb-1.5">CVU</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-bold text-zinc-900 break-all">0000177500091496182530</span>
                  <button type="button" onClick={() => copyToClipboard("0000177500091496182530", "cvu-ok")}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${copiedField === "cvu-ok" ? "bg-green-500 text-white" : "bg-zinc-900 text-white hover:bg-zinc-700"}`}>
                    {copiedField === "cvu-ok" ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-xs px-1">
                <span className="text-zinc-500">Titular</span>
                <span className="font-semibold text-zinc-700">Emiliano Thomas Andrusyszyn</span>
              </div>
              <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-200">
                Envianos el comprobante por WhatsApp para confirmar. Acreditamos en el día.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/mi-cuenta" className="rounded-xl border-2 border-zinc-900 bg-zinc-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-800">
              Ver mi cuenta
            </Link>
            <Link href="/tienda" className="rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-700 hover:border-zinc-400">
              Seguir comprando
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Main checkout ───────────────────────────────────────────────────────────
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 md:px-6 md:py-10 md:pb-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">Norte Gaming</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
          Checkout
        </h1>
      </div>

      {/* Global error */}
      {topError && (
        topError === "__401__" ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>
              Tu sesión expiró.{" "}
              <a href="/login" className="font-bold underline">Iniciá sesión de nuevo</a>
              {" "}para continuar con la compra.
            </span>
          </div>
        ) : (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{topError}</span>
          </div>
        )
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* 1. Datos del comprador */}
          <section ref={buyerRef} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <SectionHeader n={1} title="Datos del comprador" />
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Field
                label="Nombre completo"
                value={buyerForm.name}
                onChange={updateBuyer("name")}
                error={fieldErrors.name}
                placeholder="Ej: Juan Pérez"
              />
              <Field
                label="Teléfono / WhatsApp"
                value={buyerForm.phone}
                onChange={updateBuyer("phone")}
                error={fieldErrors.phone}
                type="tel"
                placeholder="Ej: 3764 123456"
              />
              <div className="sm:col-span-2">
                <Field label="Email de la cuenta" value={auth.email} readOnly />
                <p className="mt-1.5 text-xs text-zinc-400">
                  Las confirmaciones se envían a este email. Para cambiarlo, actualizá tu cuenta.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Dirección */}
          <section ref={addressRef} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <SectionHeader n={2} title="Dirección de entrega" />
            <div className="p-6">
              {/* Saved addresses */}
              {addresses.length > 0 && (
                <div className="mb-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Direcciones guardadas
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {addresses.map((addr) => {
                      const sel = selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`rounded-xl border-2 p-3.5 text-left transition-all hover:shadow-sm ${
                            sel
                              ? "border-zinc-900 bg-zinc-900"
                              : "border-zinc-200 bg-white hover:border-zinc-400"
                          }`}
                        >
                          <p className={`text-sm font-bold ${sel ? "text-white" : "text-zinc-900"}`}>
                            {addr.recipient}
                          </p>
                          <p className={`mt-0.5 text-xs ${sel ? "text-zinc-300" : "text-zinc-500"}`}>
                            {addr.street} {addr.number}, {addr.city}
                          </p>
                          <p className={`text-xs ${sel ? "text-zinc-400" : "text-zinc-400"}`}>
                            {addr.province} · CP {addr.postalCode}
                          </p>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setSelectedAddressId("new")}
                      className={`rounded-xl border-2 border-dashed p-3.5 text-left transition-all ${
                        isNew
                          ? "border-zinc-500 bg-zinc-50"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <p className="text-sm font-bold text-zinc-700">+ Nueva dirección</p>
                      <p className="mt-0.5 text-xs text-zinc-400">Usar una dirección diferente</p>
                    </button>
                  </div>
                </div>
              )}

              {/* New address form */}
              {isNew && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Provincia
                      </span>
                      <select
                        value={addressForm.province}
                        onChange={(e) => updateAddress("province")(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm hover:border-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                      >
                        {AR_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <Field
                    label="Ciudad / Localidad"
                    value={addressForm.city}
                    onChange={updateAddress("city")}
                    error={fieldErrors.city}
                    placeholder="Ej: Posadas"
                  />
                  <Field
                    label="Código postal"
                    value={addressForm.postalCode}
                    onChange={updateAddress("postalCode")}
                    error={fieldErrors.postalCode}
                    placeholder="Ej: 3300"
                  />
                  <Field
                    label="Calle"
                    value={addressForm.street}
                    onChange={updateAddress("street")}
                    error={fieldErrors.street}
                    placeholder="Ej: San Martín"
                  />
                  <Field
                    label="Número"
                    value={addressForm.number}
                    onChange={updateAddress("number")}
                    error={fieldErrors.number}
                    placeholder="Ej: 1234"
                  />
                  <Field
                    label="Piso"
                    value={addressForm.floor}
                    onChange={updateAddress("floor")}
                    optional
                    placeholder="Ej: 3"
                  />
                  <Field
                    label="Departamento"
                    value={addressForm.apartment}
                    onChange={updateAddress("apartment")}
                    optional
                    placeholder="Ej: A"
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Referencia"
                      value={addressForm.reference}
                      onChange={updateAddress("reference")}
                      optional
                      placeholder="Ej: Portón verde, timbre 2B"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. Envío */}
          <section ref={shippingRef} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <SectionHeader n={3} title="Envío" />
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
                  Cargando...
                </div>
              ) : (
                <>
                  {/* Envío gratis a partir de $150.000 */}
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <div className="flex items-center gap-3 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3.5">
                      <svg className="h-5 w-5 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-black text-green-700">¡Envío GRATIS en tu pedido!</p>
                        <p className="text-xs text-green-600">Tu pedido supera los {formatARS(FREE_SHIPPING_THRESHOLD)} — el envío no tiene costo.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Progreso hacia envío gratis */}
                      {(() => {
                        const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
                        const pct = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
                        return (
                          <div>
                            <div className="mb-1.5 flex justify-between text-xs">
                              <span className="font-semibold text-zinc-600">
                                Te faltan <span className="text-zinc-900">{formatARS(remaining)}</span> para envío gratis
                              </span>
                              <span className="text-zinc-400">{Math.round(pct)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className="h-full rounded-full bg-red-600 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-zinc-400">
                              Envío gratis en compras desde {formatARS(FREE_SHIPPING_THRESHOLD)}
                            </p>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* Opciones de envío */}
                  <div className="space-y-2">
                    {shippingMethods.map((method) => {
                      const sel = selectedShippingId === method.id;
                      const isRetiro = Number(method.cost) === 0 && method.name.toLowerCase() !== "envío gratis";
                      const isFree = Number(method.cost) === 0;
                      const showFree = isFree || subtotal >= FREE_SHIPPING_THRESHOLD;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedShippingId(method.id)}
                          className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left transition-all hover:shadow-sm ${
                            sel ? "border-zinc-900 bg-zinc-900" : "border-zinc-200 bg-white hover:border-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${sel ? "border-white bg-white" : "border-zinc-300"}`} />
                            <div>
                              <p className={`text-sm font-black ${sel ? "text-white" : "text-zinc-900"}`}>{method.name}</p>
                              {method.description && (
                                <p className={`mt-0.5 text-xs ${sel ? "text-zinc-300" : "text-zinc-500"}`}>{method.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 shrink-0 text-right">
                            {isRetiro || showFree ? (
                              <p className={`text-sm font-black ${sel ? "text-white" : "text-zinc-900"}`}>GRATIS</p>
                            ) : (
                              <>
                                <p className={`text-xs line-through ${sel ? "text-zinc-400" : "text-zinc-400"}`}>{formatARS(SHIPPING_TIERS[0].realPrice)}</p>
                                <p className={`text-sm font-black ${sel ? "text-white" : "text-zinc-900"}`}>desde {formatARS(SHIPPING_TIERS[0].customerPrice)}</p>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Badge 50% — solo para envío a domicilio */}
                  {isPaidShipping && subtotal < FREE_SHIPPING_THRESHOLD && !isRetiroMethod && (
                    <p className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.065-.473.18-.668a29.7 29.7 0 00-3.008-1.61.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424zM4.5 11.25a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h11a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-11z" clipRule="evenodd" />
                      </svg>
                      Norte Gaming cubre el 50% del costo de envío
                    </p>
                  )}

                  {fieldErrors.shipping && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.shipping}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* 4. Pago */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <SectionHeader n={4} title="Método de pago" />
            <div className="p-6">
              <div className="grid gap-2.5">
                {PAYMENT_METHODS.map((pm) => {
                  const sel = selectedPaymentId === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setSelectedPaymentId(pm.id)}
                      className={`flex items-start gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all hover:shadow-sm ${
                        sel
                          ? "border-zinc-900 bg-zinc-900"
                          : "border-zinc-200 bg-white hover:border-zinc-400"
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                          sel ? "border-white bg-white" : "border-zinc-300"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-sm font-bold ${sel ? "text-white" : "text-zinc-900"}`}>
                            {pm.label}
                          </p>
                          {pm.badge && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                                sel ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {pm.badge}
                            </span>
                          )}
                        </div>
                        <p className={`mt-0.5 text-xs ${sel ? "text-zinc-300" : "text-zinc-500"}`}>
                          {pm.shortDesc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Context message */}
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
                {selectedPayment.contextMsg}
              </div>
            </div>
          </section>

          {/* 5. Notas (opcional) */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <SectionHeader n={5} title="Notas del pedido" muted />
            <div className="border-t border-zinc-100 px-6 pb-6 pt-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Horario de entrega, indicaciones para el repartidor, aclaraciones especiales..."
                className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 hover:border-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
              />
            </div>
          </section>
        </div>

        {/* ── Right column: Resumen ────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6">
          <div className="rounded-2xl border-2 border-zinc-900 bg-white shadow-[6px_6px_0_#11111115]">
            {/* Products */}
            <div className="border-b border-zinc-200 px-5 py-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Tu compra
              </p>
              <div className="space-y-3">
                {cartProducts.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    {product.images[0] ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-lg border border-zinc-100 bg-zinc-50" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">{product.name}</p>
                      <p className="text-xs text-zinc-400">
                        x{quantity} · {formatARS(product.price)} c/u
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-zinc-900">
                      {formatARS(product.price * quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="border-b border-zinc-200 px-5 py-4">
              {couponCode ? (
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-black text-green-700">{couponCode}</p>
                    <p className="text-xs text-green-600">{couponLabel}</p>
                  </div>
                  <button type="button" onClick={removeCoupon} className="text-xs font-bold text-red-500 hover:text-red-700">Quitar</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código de descuento"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="rounded-lg border-2 border-zinc-900 px-3 py-2 text-xs font-black uppercase tracking-wider hover:bg-zinc-100 disabled:opacity-40"
                  >
                    {couponLoading ? "..." : "Aplicar"}
                  </button>
                </div>
              )}
              {couponError && <p className="mt-1.5 text-xs text-red-600">{couponError}</p>}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-b border-zinc-200 px-5 py-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-semibold">{formatARS(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Envío</span>
                <span className="font-semibold">
                  {!selectedShipping
                    ? "—"
                    : shippingCost === 0
                      ? "Gratis"
                      : (
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-400 line-through">{formatARS(SHIPPING_TIERS[0].realPrice)}</span>
                          <span className="text-red-600 font-black">{formatARS(shippingCost)}</span>
                        </span>
                      )
                  }
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({couponCode})</span>
                  <span className="font-semibold">-{formatARS(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-zinc-900">
                <span className="text-base font-black">Total</span>
                <span className="text-xl font-black">{formatARS(total)}</span>
              </div>
            </div>

            {/* Selection summary */}
            <div className="space-y-1 border-b border-zinc-100 px-5 py-3 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Pago</span>
                <span className="font-semibold text-zinc-700">{selectedPayment.label}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Envío</span>
                <span
                  className={`font-semibold ${
                    selectedShipping ? "text-zinc-700" : "text-red-500"
                  }`}
                >
                  {selectedShipping
                    ? subtotal >= FREE_SHIPPING_THRESHOLD
                      ? "Envío Estándar (GRATIS)"
                      : "Envío Estándar"
                    : "No seleccionado"}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-2.5 p-5">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-zinc-900 bg-zinc-900 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Confirmando...
                  </>
                ) : selectedPaymentId === "mercado-pago" ? (
                  "Confirmar y pagar con MP"
                ) : (
                  "Confirmar pedido"
                )}
              </button>
              <Link
                href="/carrito"
                className="flex w-full items-center justify-center rounded-xl border-2 border-zinc-200 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
              >
                Volver al carrito
              </Link>
            </div>

            {/* Trust */}
            <div className="space-y-2 rounded-b-2xl border-t border-zinc-100 bg-zinc-50 px-5 py-4">
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Compra segura. Tus datos solo se usan para gestionar tu pedido.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
                <span>Te contactamos por WhatsApp si necesitamos confirmar datos del envío.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
