# Sección "Importados" — Diseño

## Objetivo

Incorporar una sección comercial "Importados" para productos que Norte Gaming
consigue a pedido (MacBooks, notebooks, notebooks gaming, ultrabooks, y a
futuro iPads, consolas, Steam Deck, GPUs). Debe reusar la infraestructura
existente (categorías, `ProductCard`, navbar, admin) sin duplicar sistemas, y
sin alterar el comportamiento del catálogo actual.

## Conceptos clave

Se separan dos ejes ortogonales, tal como pidió el usuario:

- **Categoría** (`Importados`): agrupación comercial. Usa el modelo
  `Category` ya existente en la base — no requiere cambios de esquema, solo
  crear la fila desde `/admin/categorias`.
- **Disponibilidad** (`availability`): eje nuevo e independiente del stock
  numérico. Valores: `IN_STOCK`, `OUT_OF_STOCK`, `ORDER_ONLY` ("a pedido").
  Cualquier categoría podría en el futuro tener productos `ORDER_ONLY`, no
  solo Importados.

## 1. Modelo de datos (Prisma) — requiere migración

```prisma
enum ProductAvailability {
  IN_STOCK
  OUT_OF_STOCK
  ORDER_ONLY
}

model Product {
  // ...campos existentes sin cambios...
  currentPrice  Decimal?             @db.Decimal(12, 2) // antes no-nullable
  availability  ProductAvailability  @default(IN_STOCK)  // nuevo
}
```

Ambos cambios son seguros para los datos existentes: todo producto actual
tiene `currentPrice` ya cargado y cae en `availability = IN_STOCK` por
default, sin cambiar de comportamiento.

## 2. Backend (`backend/src/products`)

- `create-product.dto.ts`: `currentPrice` pasa a `@IsOptional()`. Nuevo campo
  `availability?: ProductAvailability` (`@IsOptional() @IsEnum(...)`).
- `update-product.dto.ts`: hereda vía `PartialType`, sin cambios directos.
- `products.service.ts` (`create`/`update`): `currentPrice` se persiste como
  `null` si no viene; `availability` se persiste con default `IN_STOCK` si no
  viene. Se quita la validación que fuerza `previousPrice < currentPrice`
  cuando `currentPrice` es `null` (no aplica precio tachado sin precio base).

## 3. Frontend — tipos y mapeo (`frontend/src/types`, `lib/backend-mappers.ts`)

- `Product.price` pasa a `price?: number` (antes `number` obligatorio).
- Nuevo campo `Product.availability: "in-stock" | "out-of-stock" | "order-only"`.
- `mapApiProductToProduct`: `price = apiProduct.currentPrice != null ? Number(...) : undefined`;
  `availability` mapea del enum backend (`IN_STOCK`/`OUT_OF_STOCK`/`ORDER_ONLY`)
  a las cadenas kebab-case del frontend.
- `ProductBadge` gana un nuevo valor `"a-pedido"`, calculado en `toBadges`
  cuando `availability === "order-only"` (independiente del badge existente
  `"sin-stock"`, que sigue derivándose de `stock <= 0`).

## 4. Admin (`frontend/src/components/admin/products-admin-client.tsx`)

- Nuevo `<select>` "Disponibilidad" con las 3 opciones, default "En stock",
  ubicado junto a los selects de Marca/Categoría existentes.
- Input "Precio actual" deja de tener `required`; vacío se envía como
  ausente (→ `null` en backend → "Consultar precio" en el frontend).
- Sin cambios en el flujo de creación de categorías: "Importados" se crea
  una sola vez desde `/admin/categorias` (ya existe ese CRUD), y luego se
  selecciona como cualquier otra categoría al cargar un producto.

## 5. `ProductCard` (`frontend/src/components/common/product-card.tsx`)

Cambios acotados y solo activos cuando aplican, para no alterar el
comportamiento de productos normales:

- Precio: `product.price === undefined` → texto "Consultar precio" en vez de
  `formatARS(product.price)`.
- Badge "A pedido" se agrega a la lista de badges ya renderizada cuando
  corresponde (mismo estilo visual que los badges existentes).
- Solo si `availability === "order-only"`: se agrega, debajo del bloque de
  precio/badges (fuera del `<Link>` que envuelve imagen+título, para no
  interferir con la navegación), un botón rojo "Consultar disponibilidad"
  que abre `buildAvailabilityWhatsAppHref(product)` en una nueva pestaña.
  Para productos `in-stock`/`out-of-stock`, la card queda pixel-igual a hoy.

## 6. Página de producto (`frontend/src/components/shop/product-detail-client.tsx`)

Cuando `availability === "order-only"`:

- El grid de 2 botones ("Agregar al carrito" / "Comprar") se reemplaza por
  un único botón full-width "Consultar disponibilidad" (mismo estilo rojo)
  que abre WhatsApp en vez de agregar al carrito/ir a checkout.
- Se agrega debajo del precio: "Producto disponible a pedido" (texto
  destacado, no alarmista) + nota secundaria discreta: "La disponibilidad y
  el precio pueden variar. Consultanos para confirmar tiempo estimado de
  entrega."
- Precio: mismo tratamiento "Consultar precio" si `price` es `undefined`.
- Para productos `in-stock`/`out-of-stock`, la página queda igual a hoy.

## 7. WhatsApp (`frontend/src/lib/whatsapp.ts`)

Nueva función genérica, no hardcodeada por producto:

```ts
export const buildAvailabilityWhatsAppHref = (product: Product) => {
  const variantSuffix = product.variants?.length
    ? ` ${product.variants.join(" / ")}`
    : "";
  const message = `Hola Norte Gaming 👋 Quería consultar disponibilidad y precio del ${product.name}${variantSuffix}.`;
  return buildWhatsAppHref(message);
};
```

Reusada desde `ProductCard` y desde `ProductDetailClient`.

## 8. Navbar (`frontend/src/components/layout/navbar.tsx`)

- Se agrega `{ href: "/importados", label: "Importados" }` al array `links`
  (no a `categories` de `mock-data.ts`, porque apunta a una página propia,
  no a un filtro de `/tienda`). Al ser el mismo array usado por el bloque
  desktop y el menú mobile, ambos quedan cubiertos sin código adicional.
- Diferenciación sutil: un punto rojo (`•`, `text-red-500`) antes o después
  del texto, misma tipografía/tamaño/tracking que el resto de los links.

## 9. Página `/importados` (`frontend/src/app/importados/page.tsx`)

Server component nuevo, mismo patrón que `page.tsx` (home):

- `fetchCatalogProducts()` + filtro por categoría `importados`.
- Header propio: fondo negro, "IMPORTADOS", bajada "Tecnología que
  conseguimos para vos.", texto secundario sobre MacBooks/notebooks a
  pedido. Mismos recursos visuales que el resto del sitio (tipografía
  condensada, bordes, rojo intenso, detalles técnicos) — nada de estética
  Apple/SaaS.
- Grid de resultados con `ProductCard` (mismo componente que toda la
  tienda).

## 10. Sección promo en el Home (`frontend/src/components/home/imported-promo.tsx`)

Nuevo componente, insertado en `frontend/src/app/page.tsx` inmediatamente
después del primer `ProductShowcase` ("Destacados"):

- Fondo negro, acento rojo, tipografía blanca, detalles técnicos
  consistentes con el resto del sitio (líneas, bordes, mono/condensada).
- Contenido: "IMPORTADOS A PEDIDO", "MacBooks · Notebooks Gaming ·
  Ultrabooks", copy corto, CTA "VER IMPORTADOS →" → `/importados`.

## 11. Ripple controlado en `Storefront` (`frontend/src/components/shop/storefront.tsx`)

Único ajuste fuera del alcance directo, necesario porque hoy asume
`price: number` en 3 puntos:

- Cálculo de `maxProductPrice` (`Math.max(...)`): ignora productos sin
  precio definido.
- Filtro `matchPrice`: un producto sin precio siempre pasa el filtro de
  precio máximo (no tiene sentido excluirlo por un slider de precio).
- Sort `precio-asc`/`precio-desc`: productos sin precio quedan al final,
  sin alterar el orden relativo del resto.

Nada de esto cambia el comportamiento para productos con precio definido
(la inmensa mayoría del catálogo actual).

## Fuera de alcance

- No se migra "sin stock" a un valor de `availability`; sigue derivándose
  de `stock <= 0` como hoy, sin tocar esa lógica existente.
- No se crea un sistema de cards ni de filtros separado para Importados.
- No se agregan las categorías futuras (iPads, consolas, Steam Deck, GPUs)
  — quedan cubiertas por el mismo mecanismo sin cambios de código
  adicionales, se cargan como productos de la categoría Importados
  (o categorías propias, a decisión comercial futura).

## Verificación antes de cerrar

- Build + typecheck de frontend y backend.
- Lint si existe configurado.
- Migración de Prisma aplicada sin pérdida de datos sobre el schema actual.
- Producto normal (`in-stock`, con precio): comportamiento idéntico al
  actual en card, detalle, carrito y checkout.
- Producto `order-only` con precio definido: card muestra precio +
  "Consultar disponibilidad"; detalle reemplaza los botones de compra.
- Producto `order-only` sin precio: "Consultar precio" en card y detalle,
  nunca `$0`.
- Navbar desktop y mobile muestran "Importados" con el estilo correcto.
- `/importados` renderiza correctamente en desktop/tablet/mobile.
- CTA de WhatsApp arma el mensaje correcto, incluyendo variante si existe.
- Alta de un producto Importado desde el admin, marcado `ORDER_ONLY`, sin
  tocar código.
