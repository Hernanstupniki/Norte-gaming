"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminCreateBrand,
  adminCreateProduct,
  adminDeleteProduct,
  adminGetBrands,
  adminGetCategories,
  adminListProducts,
  AdminProductItem,
  adminUpdateProduct,
  adminUploadProductImage,
} from "@/lib/admin-api";
import { brands as carouselBrands } from "@/lib/mock-data";
import { CreateProductDto, ProductImageInputDto, ProductSpecInputDto } from "@/types/backend";

type Brand = { id: string; name: string; slug: string };
type Category = { id: string; name: string; slug: string };
type NoticeTone = "success" | "error" | "info";
type AdminTab = "create" | "manage";

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
  isActive: boolean;
  brandId: string;
  categoryId: string;
  images: ProductImageInputDto[];
  specs: ProductSpecInputDto[];
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
  isActive: true,
  brandId: "",
  categoryId: "",
  images: [{ url: "", alt: "" }],
  specs: [{ name: "", value: "" }],
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
  isOnOffer: Boolean(product.isOnOffer),
  isActive: Boolean(product.isActive),
  brandId: product.brandId || "",
  categoryId: product.categoryId || "",
  images:
    product.images && product.images.length > 0
      ? product.images.map((img) => ({ url: img.url || "", ...(img.alt ? { alt: img.alt } : {}) }))
      : [{ url: "", alt: "" }],
  specs:
    product.specs && product.specs.length > 0
      ? product.specs.map((spec) => ({ name: spec.name || "", value: spec.value || "" }))
      : [{ name: "", value: "" }],
});

export function ProductsAdminClient() {
  const [tab, setTab] = useState<AdminTab>("create");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [form, setForm] = useState<ProductFormState>(initialForm());
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
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
    if (editingProductId) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, editingProductId]);

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

  const resetForm = () => {
    setEditingProductId(null);
    const draftRaw = window.localStorage.getItem(DRAFT_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as ProductFormState;
        setForm(draft);
        return;
      } catch {
        window.localStorage.removeItem(DRAFT_KEY);
      }
    }
    setForm(initialForm());
  };

  const loadProducts = async (query = "") => {
    setLoadingProducts(true);
    try {
      const result = await adminListProducts(query);
      setProducts(result.data);
      setSessionInvalid(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        setSessionInvalid(true);
      }
      setNotice({
        tone: "error",
        text: `No se pudo cargar el listado: ${error instanceof Error ? error.message : "Error desconocido"}`,
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const bootstrapPanel = async () => {
      setLoadingCatalog(true);
      setNotice(null);
      try {
        const [brandsData, categoriesData] = await Promise.all([
          adminGetBrands(),
          adminGetCategories(),
        ]);

        if (cancelled) return;

        const existingNames = new Set(
          brandsData.map((item: Brand) => item.name.trim().toLowerCase()),
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
        await loadProducts();

        if (cancelled) return;

        const draftRaw = window.localStorage.getItem(DRAFT_KEY);
        if (draftRaw) {
          try {
            const draft = JSON.parse(draftRaw) as ProductFormState;
            setForm(draft);
          } catch {
            window.localStorage.removeItem(DRAFT_KEY);
          }
        }

        setNotice({ tone: "success", text: "Panel cargado. Listo para gestionar productos." });
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

    void bootstrapPanel();

    return () => {
      cancelled = true;
    };
  }, []);

  const uploadImage = async (index: number, file?: File) => {
    if (!file) return;

    setUploadingIndex(index);
    setNotice({ tone: "info", text: `Subiendo ${file.name}...` });

    try {
      const { url } = await adminUploadProductImage(file);
      updateImage(index, "url", url);
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
    const parsedCurrentPrice = Number(form.currentPrice);
    const parsedPreviousPrice = form.previousPrice.trim() ? Number(form.previousPrice) : undefined;
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
    if (!Number.isFinite(parsedCurrentPrice) || parsedCurrentPrice < 0) {
      setNotice({ tone: "error", text: "Precio actual inválido." });
      return null;
    }
    if (parsedPreviousPrice !== undefined && parsedPreviousPrice < parsedCurrentPrice) {
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

    return {
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      currentPrice: parsedCurrentPrice,
      ...(parsedPreviousPrice !== undefined ? { previousPrice: parsedPreviousPrice } : {}),
      sku: form.sku.trim(),
      stock: parsedStock,
      isFeatured: form.isFeatured,
      isOnOffer: form.isOnOffer,
      isActive: form.isActive,
      brandId: form.brandId,
      categoryId: form.categoryId,
      images,
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
      if (editingProductId) {
        await adminUpdateProduct(editingProductId, payload);
        setNotice({ tone: "success", text: "Producto actualizado correctamente." });
      } else {
        await adminCreateProduct(payload);
        setNotice({ tone: "success", text: "Producto creado correctamente." });
      }

      await loadProducts(search);
      setEditingProductId(null);
      setForm(initialForm());
      window.localStorage.removeItem(DRAFT_KEY);
      setTab("manage");
    } catch (error) {
      setNotice({
        tone: "error",
        text: `No se pudo guardar el producto: ${error instanceof Error ? error.message : "Error desconocido"}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: AdminProductItem) => {
    setEditingProductId(product.id);
    setForm(toFormFromProduct(product));
    setTab("create");
    setNotice({ tone: "info", text: `Editando: ${product.name}` });
  };

  const handleDelete = async (product: AdminProductItem) => {
    const confirmed = window.confirm(`Eliminar producto: ${product.name}?`);
    if (!confirmed) return;

    try {
      await adminDeleteProduct(product.id);
      setNotice({ tone: "success", text: `Producto eliminado: ${product.name}` });
      await loadProducts(search);
      if (editingProductId === product.id) {
        setEditingProductId(null);
        setForm(initialForm());
      }
    } catch (error) {
      setNotice({
        tone: "error",
        text: `No se pudo eliminar: ${error instanceof Error ? error.message : "Error desconocido"}`,
      });
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadProducts(search);
  };

  if (sessionInvalid) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Norte Gaming CMS Pro</p>
        <h2 className="mt-2 text-2xl font-black text-zinc-950">Sesión expirada</h2>
        <p className="mt-1 text-sm text-zinc-600">Volvé a iniciar sesión para seguir usando el panel.</p>
        <a href="/admin/login" className="mt-6 inline-block rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">
          Ir al login
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Norte Gaming CMS Pro</p>
          <h2 className="text-2xl font-black text-zinc-950">Gestión de productos</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("create")}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === "create" ? "bg-black text-white" : "border border-zinc-300 text-zinc-700"}`}
          >
            Crear / Editar
          </button>
          <button
            type="button"
            onClick={() => setTab("manage")}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === "manage" ? "bg-black text-white" : "border border-zinc-300 text-zinc-700"}`}
          >
            Gestionar
          </button>
        </div>
      </div>

      {notice ? <div className={`rounded-lg px-4 py-3 text-sm ${noticeClass(notice.tone)}`}>{notice.text}</div> : null}

      {tab === "create" ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-zinc-950">{editingProductId ? "Editar producto" : "Crear producto"}</h3>
              {editingProductId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProductId(null);
                    resetForm();
                    setNotice({ tone: "info", text: "Edición cancelada. Volviste al borrador." });
                  }}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                >
                  Cancelar edición
                </button>
              ) : null}
            </div>

            {loadingCatalog ? <p className="text-sm text-blue-700">Cargando marcas y categorías...</p> : null}

            <section className="rounded-xl border border-zinc-200 p-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Datos básicos</h4>
              <div className="mt-3 grid gap-3">
                <input type="text" required minLength={3} placeholder="Nombre" value={form.name} onChange={(event) => setField("name", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <input type="text" required minLength={8} placeholder="Descripción corta" value={form.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <textarea required minLength={20} rows={4} placeholder="Descripción completa" value={form.description} onChange={(event) => setField("description", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 p-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Precio, stock y clasificación</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="number" step="0.01" min="0" required placeholder="Precio actual" value={form.currentPrice} onChange={(event) => setField("currentPrice", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <input type="number" step="0.01" min="0" placeholder="Precio anterior" value={form.previousPrice} onChange={(event) => setField("previousPrice", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <input type="text" required minLength={2} maxLength={80} placeholder="SKU único" value={form.sku} onChange={(event) => setField("sku", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <input type="number" min="0" required placeholder="Stock" value={form.stock} onChange={(event) => setField("stock", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <select required value={form.brandId} onChange={(event) => setField("brandId", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900">
                  <option value="">Marca</option>
                  {brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <select required value={form.categoryId} onChange={(event) => setField("categoryId", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900">
                  <option value="">Categoría</option>
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-700">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} /> Destacado</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isOnOffer} onChange={(event) => setField("isOnOffer", event.target.checked)} /> En oferta</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(event) => setField("isActive", event.target.checked)} /> Activo</label>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Imágenes</h4>
                <button type="button" onClick={addImage} className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">+ Imagen</button>
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
                    {image.url ? <img src={image.url} alt={image.alt || "Preview"} className="mt-3 h-28 w-full rounded-md object-cover" /> : null}
                    {form.images.length > 1 ? <button type="button" onClick={() => removeImage(index)} className="mt-2 text-xs font-semibold text-red-600">Eliminar imagen</button> : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Especificaciones</h4>
                <button type="button" onClick={addSpec} className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">+ Especificación</button>
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

            <button type="submit" disabled={submitting || loadingCatalog || brands.length === 0 || categories.length === 0} className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">
              {submitting ? "Guardando producto..." : editingProductId ? "Actualizar producto" : "Guardar producto"}
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h4 className="text-lg font-black text-zinc-950">Resumen</h4>
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
                <p className="font-semibold text-zinc-900">{editingProductId ? "Edición" : "Creación"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              El formulario guarda borrador automático mientras no estés editando un producto existente.
            </div>
          </aside>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o descripción"
              className="min-w-[260px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
            <button type="submit" className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white">Buscar</button>
            <button
              type="button"
              onClick={async () => {
                setSearch("");
                await loadProducts("");
              }}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
            >
              Limpiar
            </button>
          </form>

          {loadingProducts ? <p className="text-sm text-zinc-600">Cargando productos...</p> : null}

          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Marca</th>
                  <th className="px-3 py-2">Categoría</th>
                  <th className="px-3 py-2">Precio</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-zinc-200">
                    <td className="px-3 py-2 font-medium text-zinc-900">{product.name}</td>
                    <td className="px-3 py-2 text-zinc-700">{product.sku}</td>
                    <td className="px-3 py-2 text-zinc-700">{product.brand?.name || "-"}</td>
                    <td className="px-3 py-2 text-zinc-700">{product.category?.name || "-"}</td>
                    <td className="px-3 py-2 text-zinc-700">{formatArs(Number(product.currentPrice || 0))}</td>
                    <td className="px-3 py-2 text-zinc-700">{product.stock}</td>
                    <td className="px-3 py-2 text-zinc-700">{product.isActive ? "Activo" : "Inactivo"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(product)} className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700">Editar</button>
                        <button type="button" onClick={() => void handleDelete(product)} className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && !loadingProducts ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-zinc-500">No hay productos para mostrar.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
