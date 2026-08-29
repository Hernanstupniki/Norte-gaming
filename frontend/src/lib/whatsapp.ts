import { formatARS } from "@/lib/utils";
import { Product } from "@/types";

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5493757658938";

const buildWhatsAppHref = (message: string) =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

export const buildProductWhatsAppHref = (product: Product) => {
  const priceLine =
    product.price !== undefined
      ? `- Precio: ${formatARS(product.price)}`
      : "- Precio: A consultar";

  const message = [
    "Hola Norte Gaming, quiero consultar por este producto:",
    `- Producto: ${product.name}`,
    `- Marca: ${product.brand}`,
    priceLine,
  ].join("\n");

  return buildWhatsAppHref(message);
};

export const buildCartWhatsAppHref = (
  items: Array<{ product: Product; quantity: number }>,
  subtotal: number,
) => {
  const lines = items.map(
    ({ product, quantity }) =>
      `- ${product.name} x${quantity} (${
        product.price !== undefined ? formatARS(product.price * quantity) : "Consultar precio"
      })`,
  );

  const message = [
    "Hola Norte Gaming, quiero consultar por estos productos:",
    ...lines,
    `Total estimado: ${formatARS(subtotal)}`,
  ].join("\n");

  return buildWhatsAppHref(message);
};

export const buildAvailabilityWhatsAppHref = (product: Product) => {
  const variantSuffix = product.variants?.length
    ? ` ${product.variants.join(" / ")}`
    : "";

  const message = `Hola Norte Gaming 👋 Quería consultar disponibilidad y precio del ${product.name}${variantSuffix}.`;

  return buildWhatsAppHref(message);
};
