"use client";

import { useEffect, useState } from "react";
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  AdminCategoryItem,
} from "@/lib/admin-api";

export function CategoriesAdminClient() {
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editingSaving, setEditingSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetCategories();
      setCategories(res);
    } catch (err: any) {
      setError(err?.message || "Error cargando categorías");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setCreatingCategory(true);
    setError(null);
    try {
      const created = await adminCreateCategory({
        name: newName,
        description: newDescription || undefined,
      });
      setCategories((prev) => [...prev, created]);
      setNewName("");
      setNewDescription("");
    } catch (err: any) {
      setError(err?.message || "No se pudo crear la categoría");
    } finally {
      setCreatingCategory(false);
    }
  };

  const startEdit = (category: AdminCategoryItem) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || "");
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setEditingSaving(true);
    setError(null);
    try {
      const updated = await adminUpdateCategory(editingId, {
        name: editName,
        description: editDescription || undefined,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === editingId ? updated : c))
      );
      setEditingId(null);
    } catch (err: any) {
      setError(err?.message || "No se pudo actualizar la categoría");
    } finally {
      setEditingSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta categoría?"))
      return;
    setError(null);
    try {
      await adminDeleteCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    } catch (err: any) {
      setError(err?.message || "No se pudo eliminar la categoría");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">
          Administración
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
          Categorías
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600 md:text-base">
          Crea, edita y gestiona las categorías de productos.
        </p>
      </section>

      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
          <h2 className="font-bold text-zinc-900 mb-3">
            {creatingCategory ? "Creando..." : "Nueva categoría"}
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nombre de la categoría *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              rows={2}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => void handleCreate()}
                disabled={creatingCategory || !newName.trim()}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium text-sm disabled:opacity-50"
              >
                Crear categoría
              </button>
              <button
                onClick={() => {
                  setNewName("");
                  setNewDescription("");
                }}
                className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg font-medium text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-zinc-600">Cargando...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-zinc-600">
            No hay categorías aún. Crea la primera.
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                {editingId === category.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
                      rows={2}
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className="font-bold text-zinc-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-zinc-600 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  {editingId === category.id ? (
                    <>
                      <button
                        onClick={() => void handleUpdate()}
                        disabled={editingSaving}
                        className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                      >
                        {editingSaving ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 bg-zinc-100 text-zinc-900 rounded-lg font-medium text-sm"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(category)}
                        className="px-3 py-1.5 bg-zinc-100 text-zinc-900 rounded-lg font-medium text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => void handleDelete(category.id)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
