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
    // Cart items always have a defined price — CartService.addItem/updateItem
    // reject order-only products without one before they can reach a cart.
    ({ product, quantity }) => `- ${product.name} x${quantity} (${formatARS(product.price! * quantity)})`,
  );

  const message = [
    "Hola Norte Gaming, quiero consultar por estos productos:",
    ...lines,
    `Total estimado: ${formatARS(subtotal)}`,
  ].join("\n");

  return buildWhatsAppHref(message);
};
