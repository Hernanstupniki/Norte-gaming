import { formatARS } from "@/lib/utils";
import { Product } from "@/types";

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5493757658938";

const buildWhatsAppHref = (message: string) =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

export const buildProductWhatsAppHref = (product: Product) => {
  const message = [
    "Hola Norte Gaming, quiero consultar por este producto:",
    `- Producto: ${product.name}`,
    `- Marca: ${product.brand}`,
    `- Precio: ${formatARS(product.price)}`,
    `- Link: http://localhost:3000/producto/${product.slug}`,
  ].join("\n");

  return buildWhatsAppHref(message);
};

export const buildCartWhatsAppHref = (
  items: Array<{ product: Product; quantity: number }>,
  subtotal: number,
) => {
  const lines = items.map(
    ({ product, quantity }) => `- ${product.name} x${quantity} (${formatARS(product.price * quantity)})`,
  );

  const message = [
    "Hola Norte Gaming, quiero coordinar la compra de estos productos:",
    ...lines,
    `Total estimado: ${formatARS(subtotal)}`,
  ].join("\n");

  return buildWhatsAppHref(message);
};
