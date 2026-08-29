"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreateBrand,
  adminCreateProduct,
  adminGetBrands,
  adminGetCategories,
  adminGetProductBySlug,
  adminGetProductBySku,
  AdminProductItem,
  AdminBrandItem,
  AdminCategoryItem,
  adminUpdateProduct,
  adminUploadProductImage,
} from "@/lib/admin-api";
import { brands as carouselBrands } from "@/lib/mock-data";
import { resolvePublicImageUrl } from "@/lib/public-image-url";
import { Select } from "@/components/common/select";
import { CreateProductDto, ProductImageInputDto, ProductSpecInputDto } from "@/types/backend";

type NoticeTone = "success" | "error" | "info";

interface NoticeState {
  tone: NoticeTone;
  text: string;
}

interface ProductFormState {
  name: string;
  shortDescription: string;
  description: string;
  currentPrice: string;
  previousPrice: string;
  sku: string;
  stock: string;
  isFeatured: boolean;
  isOnOffer: boolean;
  freeShipping: boolean;
  isActive: boolean;
  brandId: string;
  categoryId: string;
  availability: "IN_STOCK" | "OUT_OF_STOCK" | "ORDER_ONLY";
  images: ProductImageInputDto[];
  specs: ProductSpecInputDto[];
  variants: string;
}

const DRAFT_KEY = "norte-gaming-admin-product-draft-v1";

const initialForm = (): ProductFormState => ({
  name: "",
  shortDescription: "",
  description: "",
  currentPrice: "",
  previousPrice: "",
  sku: "",
  stock: "",
  isFeatured: false,
  isOnOffer: false,
  freeShipping: false,
  isActive: true,
  brandId: "",
  categoryId: "",
  availability: "IN_STOCK",
  images: [{ url: "", alt: "" }],
  specs: [{ name: "", value: "" }],
  variants: "",
});

const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const noticeClass = (tone: NoticeTone) => {
  if (tone === "success") return "bg-green-100 text-green-800";
  if (tone === "error") return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
};

const toFormFromProduct = (product: AdminProductItem): ProductFormState => ({
  name: product.name || "",
  shortDescription: product.shortDescription || "",
  description: product.description || "",
  currentPrice: String(product.currentPrice ?? ""),
  previousPrice: product.previousPrice !== null && product.previousPrice !== undefined ? String(product.previousPrice) : "",
  sku: product.sku || "",
  stock: String(product.stock ?? "0"),
  isFeatured: Boolean(product.isFeatured),
  isOnOffer: Boolean(product.isOnOffer) || product.previousPrice !== null,
  freeShipping: Boolean(product.freeShipping),
  isActive: Boolean(product.isActive),
  brandId: product.brandId || "",
  categoryId: product.categoryId || "",
  availability: product.availability || "IN_STOCK",
  images:
    product.images && product.images.length > 0
      ? product.images.map((img) => ({
          url: resolvePublicImageUrl(img.url) || img.url || "",
          ...(img.alt ? { alt: img.alt } : {}),
        }))
      : [{ url: "", alt: "" }],
  specs:
    product.specs && product.specs.length > 0
      ? product.specs.map((spec) => ({ name: spec.name || "", value: spec.value || "" }))
      : [{ name: "", value: "" }],
  variants: product.variants?.join("\n") || "",
});

const normalizeDraft = (draft: ProductFormState): ProductFormState => ({
  ...draft,
  variants: draft.variants || "",
  availability: draft.availability || "IN_STOCK",
});

interface ProductFormProps {
  /** Product being edited. Omit to create a new product. */
  product?: AdminProductItem;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(product);

  const [brands, setBrands] = useState<AdminBrandItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [form, setForm] = useState<ProductFormState>(() =>
    product ? toFormFromProduct(product) : initialForm(),
  );
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [sessionInvalid, setSessionInvalid] = useState(false);

  const currentPrice = Number(form.currentPrice || 0);
  const imageCount = form.images.filter((img) => (img.url || "").trim().length > 0).length;

  const selectedBrand = useMemo(
    () => brands.find((item) => item.id === form.brandId)?.name || "Sin marca",
    [brands, form.brandId],
  );

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === form.categoryId)?.name || "Sin categoría",
    [categories, form.categoryId],
  );

  useEffect(() => {
    if (isEditing) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, isEditing]);

  const setField = <K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateImage = (index: number, field: keyof ProductImageInputDto, value: string) => {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = { ...images[index], [field]: value };
      return { ...prev, images };
    });
  };

  const updateSpec = (index: number, field: keyof ProductSpecInputDto, value: string) => {
    setForm((prev) => {
      const specs = [...prev.specs];
      specs[index] = { ...specs[index], [field]: value };
      return { ...prev, specs };
    });
  };

  const addImage = () => setForm((prev) => ({ ...prev, images: [...prev.images, { url: "", alt: "" }] }));
  const removeImage = (index: number) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  const addSpec = () => setForm((prev) => ({ ...prev, specs: [...prev.specs, { name: "", value: "" }] }));
  const removeSpec = (index: number) =>
    setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, i) => i !== index) }));

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      setLoadingCatalog(true);
      setNotice(null);
      try {
        const [brandsData, categoriesData] = await Promise.all([
          adminGetBrands(),
          adminGetCategories(),
        ]);

        if (cancelled) return;

        const existingNames = new Set(
          brandsData.map((item: AdminBrandItem) => item.name.trim().toLowerCase()),
        );
        const missingCarouselBrands = carouselBrands.filter(
          (name) => !existingNames.has(name.trim().toLowerCase()),
        );

        if (missingCarouselBrands.length > 0) {
          await Promise.all(
            missingCarouselBrands.map((name) =>
              adminCreateBrand({
                name,
                description: `Marca incorporada desde el carrusel (${name}).`,
              }).catch(() => null),
            ),
          );
        }

        const refreshedBrands = await adminGetBrands();

        if (cancelled) return;

        setBrands(refreshedBrands);
        setCategories(categoriesData);

        if (!isEditing) {
          const draftRaw = window.localStorage.getItem(DRAFT_KEY);
          if (draftRaw) {
            try {
              const draft = JSON.parse(draftRaw) as ProductFormState;
              setForm(normalizeDraft(draft));
            } catch {
              window.localStorage.removeItem(DRAFT_KEY);
            }
          }
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message.includes("401")) {
          setSessionInvalid(true);
        }
        setNotice({
          tone: "error",
          text: `No se pudo cargar el panel: ${error instanceof Error ? error.message : "Error desconocido"}`,
        });
      } finally {
        if (!cancelled) {
          setLoadingCatalog(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadImage = async (index: number, file?: File) => {
    if (!file) return;

    setUploadingIndex(index);
    setNotice({ tone: "info", text: `Subiendo ${file.name}...` });

    try {
      const { url } = await adminUploadProductImage(file);
      updateImage(index, "url", resolvePublicImageUrl(url) || url);
      if (!form.images[index]?.alt) {
        updateImage(index, "alt", file.name.replace(/\.[^/.]+$/, ""));
      }
      setNotice({ tone: "success", text: "Imagen subida correctamente." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: `Error al subir imagen: ${error instanceof Error ? error.message : "Error desconocido"}`,
      });
    } finally {
      setUploadingIndex(null);
      setDragIndex(null);
    }
  };

  const onDropImage = async (index: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await uploadImage(index, event.dataTransfer.files?.[0]);
  };

  const validateAndBuildPayload = (): CreateProductDto | null => {
    const hasCurrentPrice = form.currentPrice.trim().length > 0;
    const parsedCurrentPrice = hasCurrentPrice ? Number(form.currentPrice) : undefined;
    const useOfferPrice = form.isOnOffer;
    const parsedPreviousPrice = useOfferPrice && form.previousPrice.trim() ? Number(form.previousPrice) : undefined;
    const parsedStock = Number(form.stock);

    if (form.name.trim().length < 3) {
      setNotice({ tone: "error", text: "Nombre muy corto." });
      return null;
    }
    if (form.shortDescription.trim().length < 8) {
      setNotice({ tone: "error", text: "Descripción corta inválida." });
      return null;
    }
    if (form.description.trim().length < 20) {
      setNotice({ tone: "error", text: "Descripción completa muy corta." });
      return null;
    }
    if (hasCurrentPrice && (!Number.isFinite(parsedCurrentPrice as number) || (parsedCurrentPrice as number) < 0)) {
      setNotice({ tone: "error", text: "Precio actual inválido." });
      return null;
    }
    if (useOfferPrice && !hasCurrentPrice) {
      setNotice({ tone: "error", text: "Para marcar oferta necesitás cargar el precio actual." });
      return null;
    }
    if (useOfferPrice && parsedPreviousPrice === undefined) {
      setNotice({ tone: "error", text: "Si el producto está en oferta, completá el precio anterior." });
      return null;
    }
    if (parsedPreviousPrice !== undefined && hasCurrentPrice && parsedPreviousPrice < (parsedCurrentPrice as number)) {
      setNotice({ tone: "error", text: "El precio anterior debe ser mayor o igual al actual." });
      return null;
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setNotice({ tone: "error", text: "Stock inválido." });
      return null;
    }
    if (!form.brandId || !form.categoryId) {
      setNotice({ tone: "error", text: "Seleccioná marca y categoría." });
      return null;
    }

    const images = form.images
      .map((img) => ({
        url: img.url.trim(),
        ...(img.alt?.trim() ? { alt: img.alt.trim() } : {}),
      }))
      .filter((img) => img.url.length > 0);

    if (images.length === 0) {
      setNotice({ tone: "error", text: "Cargá al menos una imagen." });
      return null;
    }

    const specs = form.specs
      .map((spec) => ({ name: spec.name.trim(), value: spec.value.trim() }))
      .filter((spec) => spec.name.length > 0 && spec.value.length > 0);

    const variants = form.variants
      .split(/\r?\n/)
      .map((variant) => variant.trim())
      .filter((variant) => variant.length > 0);

    return {
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      currentPrice: hasCurrentPrice ? (parsedCurrentPrice as number) : null,
      ...(useOfferPrice ? { previousPrice: parsedPreviousPrice } : {}),
      sku: form.sku.trim(),
      stock: parsedStock,
      isFeatured: form.isFeatured,
      isOnOffer: form.isOnOffer,
      freeShipping: form.freeShipping,
      isActive: form.isActive,
      brandId: form.brandId,
      categoryId: form.categoryId,
      availability: form.availability,
      images,
      ...(variants.length > 0 ? { variants } : {}),
      ...(specs.length > 0 ? { specs } : {}),
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = validateAndBuildPayload();
    if (!payload) return;

    setSubmitting(true);
    setNotice(null);

    try {
      if (product) {
        await adminUpdateProduct(product.id, payload);
      } else {
        const slugToCheck = payload.name.trim().toLowerCase().replace(/\s+/g, "-");
        try {
          const existingBySlug = await adminGetProductBySlug(slugToCheck);
          if (existingBySlug) {
            setNotice({ tone: "error", text: "No se pudo guardar el producto: el slug ya existe." });
            setSubmitting(false);
            return;
          }
        } catch {
          // 404 esperado: no existe todavía
        }

        try {
          const existingBySku = await adminGetProductBySku(payload.sku.trim());
          if (existingBySku) {
            setNotice({ tone: "error", text: "No se pudo guardar el producto: el SKU ya existe." });
            setSubmitting(false);
            return;
          }
        } catch {
          // 404 esperado: no existe todavía
        }

        await adminCreateProduct(payload);
        window.localStorage.removeItem(DRAFT_KEY);
      }

      router.push("/admin/productos");
      router.refresh();
    } catch (error) {
      setNotice({
        tone: "error",
        text: `No se pudo guardar el producto: ${error instanceof Error ? error.message : "Error desconocido"}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionInvalid) {
    return (
      <div className="mx-auto max-w-md rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Panel de acceso</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-zinc-950">Sesión expirada</h2>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600">Volvé a iniciar sesión para seguir usando el panel.</p>
        <a href="/admin/login" className="mt-4 sm:mt-6 inline-block rounded-lg bg-black px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white">
          Ir al login
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      {notice ? (
        <div className={`lg:col-span-2 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${noticeClass(notice.tone)}`}>
          {notice.text}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
        {loadingCatalog ? <p className="text-sm text-blue-700">Cargando marcas y categorías...</p> : null}

        <section className="rounded-xl border border-zinc-200 p-3 sm:p-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Datos básicos</h4>
          <div className="mt-3 grid gap-3">
            <input type="text" required minLength={3} placeholder="Nombre" value={form.name} onChange={(event) => setField("name", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
            <input type="text" required minLength={8} placeholder="Descripción corta" value={form.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
            <textarea required minLength={20} rows={4} placeholder="Descripción completa" value={form.description} onChange={(event) => setField("description", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 p-3 sm:p-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Precio, stock y clasificación</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="number" step="0.01" min="0" placeholder="Precio actual (vacío = Consultar precio)" value={form.currentPrice} onChange={(event) => setField("currentPrice", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={form.isOnOffer ? "Precio anterior (tachado)" : "Precio anterior (opcional)"}
              value={form.previousPrice}
              onChange={(event) => setField("previousPrice", event.target.value)}
              disabled={!form.isOnOffer}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
            />
            <input type="text" required minLength={2} maxLength={80} placeholder="SKU único" value={form.sku} onChange={(event) => setField("sku", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
            <input type="number" min="0" required placeholder="Stock" value={form.stock} onChange={(event) => setField("stock", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
            <Select
              aria-label="Marca"
              placeholder="Marca"
              value={form.brandId}
              onChange={(value) => setField("brandId", value)}
              options={brands.map((item) => ({ value: item.id, label: item.name }))}
            />
            <Select
              aria-label="Categoría"
              placeholder="Categoría"
              value={form.categoryId}
              onChange={(value) => setField("categoryId", value)}
              options={categories.map((item) => ({ value: item.id, label: item.name }))}
            />
            <Select
              aria-label="Disponibilidad"
              value={form.availability}
              onChange={(value) => setField("availability", value as ProductFormState["availability"])}
              options={[
                { value: "IN_STOCK", label: "Disponibilidad: en stock" },
                { value: "OUT_OF_STOCK", label: "Disponibilidad: sin stock" },
                { value: "ORDER_ONLY", label: "Disponibilidad: a pedido" },
              ]}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-700">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} /> Destacado</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.freeShipping} onChange={(event) => setField("freeShipping", event.target.checked)} /> Envío gratis</label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isOnOffer}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setField("isOnOffer", checked);
                  if (!checked) {
                    setField("previousPrice", "");
                  }
                }}
              />
              En oferta (mostrar precio tachado)
            </label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(event) => setField("isActive", event.target.checked)} /> Activo</label>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Imágenes</h4>
            <button type="button" onClick={addImage} className="rounded-md border border-zinc-300 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">+ Imagen</button>
          </div>
          <div className="space-y-3">
            {form.images.map((image, index) => (
              <div key={index} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragIndex(index);
                  }}
                  onDragLeave={() => setDragIndex(null)}
                  onDrop={(event) => void onDropImage(index, event)}
                  className={`rounded-lg border-2 border-dashed p-4 text-center ${dragIndex === index ? "border-zinc-900 bg-zinc-100" : "border-zinc-300 bg-white"}`}
                >
                  <p className="text-sm font-medium text-zinc-700">Arrastrá una imagen aquí</p>
                  <p className="mt-1 text-xs text-zinc-500">JPG, PNG o WEBP</p>
                  <label className="mt-3 inline-block cursor-pointer rounded-md bg-black px-3 py-2 text-xs font-semibold text-white">
                    Seleccionar
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(event) => void uploadImage(index, event.target.files?.[0])} />
                  </label>
                  {uploadingIndex === index ? <p className="mt-2 text-xs text-blue-700">Subiendo...</p> : null}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input type="url" required placeholder="URL" value={image.url || ""} onChange={(event) => updateImage(index, "url", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                  <input type="text" placeholder="Alt" value={image.alt || ""} onChange={(event) => updateImage(index, "alt", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                </div>
                {image.url ? (
                  <img
                    src={resolvePublicImageUrl(image.url) || image.url}
                    alt={image.alt || "Preview"}
                    className="mt-3 h-28 w-full rounded-md object-cover"
                  />
                ) : null}
                {form.images.length > 1 ? <button type="button" onClick={() => removeImage(index)} className="mt-2 text-xs font-semibold text-red-600">Eliminar imagen</button> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Especificaciones</h4>
            <button type="button" onClick={addSpec} className="rounded-md border border-zinc-300 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">+ Especificación</button>
          </div>
          <div className="space-y-2">
            {form.specs.map((spec, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input type="text" placeholder="Nombre" value={spec.name || ""} onChange={(event) => updateSpec(index, "name", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <input type="text" placeholder="Valor" value={spec.value || ""} onChange={(event) => updateSpec(index, "value", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <button type="button" onClick={() => removeSpec(index)} disabled={form.specs.length === 1} className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-50">Quitar</button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 p-3 sm:p-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Variantes opcionales</h4>
          <p className="mt-2 text-xs text-zinc-500">
            Una variante por línea. Si dejás este campo vacío, el producto no mostrará selector de variantes.
          </p>
          <textarea
            rows={4}
            placeholder="Negro\nBlanco\nGris grafito"
            value={form.variants}
            onChange={(event) => setField("variants", event.target.value)}
            className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </section>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={submitting || loadingCatalog || brands.length === 0 || categories.length === 0} className="flex-1 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">
            {submitting ? "Guardando producto..." : isEditing ? "Actualizar producto" : "Guardar producto"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/productos")}
            className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            Cancelar
          </button>
        </div>
      </form>

      <aside className="h-fit rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm lg:sticky lg:top-6">
        <h4 className="text-base sm:text-lg font-black text-zinc-950">Resumen</h4>
        <div className="mt-4 space-y-3 text-sm text-zinc-700">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Nombre</p>
            <p className="font-semibold text-zinc-900">{form.name || "Sin definir"}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500">Marca</p>
              <p className="font-semibold text-zinc-900">{selectedBrand}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500">Categoría</p>
              <p className="font-semibold text-zinc-900">{selectedCategory}</p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Precio</p>
            <p className="font-semibold text-zinc-900">{currentPrice > 0 ? formatArs(currentPrice) : "Sin definir"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Imágenes válidas</p>
            <p className="font-semibold text-zinc-900">{imageCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Modo</p>
            <p className="font-semibold text-zinc-900">{isEditing ? "Edición" : "Creación"}</p>
          </div>
        </div>
        {!isEditing ? (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
            El formulario guarda borrador automático mientras no estés editando un producto existente.
          </div>
        ) : null}
      </aside>
    </div>
  );
}
