"use client";

import { useEffect, useState } from "react";
import {
  adminListShippingMethods,
  adminCreateShippingMethod,
  adminUpdateShippingMethod,
  adminDeleteShippingMethod,
  type AdminShippingMethod,
} from "@/lib/admin-api";

const AR_PROVINCES = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
  "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
  "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
  "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

type FormState = {
  name: string;
  description: string;
  cost: string;
  provinces: string[];
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  cost: "",
  provinces: [],
  isActive: true,
};

function formatCost(cost: string | number) {
  const n = Number(cost);
  if (n === 0) return "Gratis";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function AdminEnviosPage() {
  const [methods, setMethods] = useState<AdminShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminListShippingMethods();
      setMethods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando zonas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (m: AdminShippingMethod) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      description: m.description ?? "",
      cost: String(Number(m.cost)),
      provinces: m.provinces ?? [],
      isActive: m.isActive,
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const toggleProvince = (p: string) => {
    setForm((prev) => ({
      ...prev,
      provinces: prev.provinces.includes(p)
        ? prev.provinces.filter((x) => x !== p)
        : [...prev.provinces, p],
    }));
  };

  const selectAllProvinces = () => setForm((prev) => ({ ...prev, provinces: [...AR_PROVINCES] }));
  const clearAllProvinces = () => setForm((prev) => ({ ...prev, provinces: [] }));

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("El nombre es obligatorio."); return; }
    if (form.cost === "" || isNaN(Number(form.cost)) || Number(form.cost) < 0) {
      setFormError("Ingresá un costo válido (0 para gratis)."); return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        cost: Number(form.cost),
        provinces: form.provinces,
        isActive: form.isActive,
      };

      if (editingId) {
        const updated = await adminUpdateShippingMethod(editingId, payload);
        setMethods((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      } else {
        const created = await adminCreateShippingMethod(payload);
        setMethods((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta zona de envío?")) return;
    setDeletingId(id);
    try {
      await adminDeleteShippingMethod(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (m: AdminShippingMethod) => {
    try {
      const updated = await adminUpdateShippingMethod(m.id, { isActive: !m.isActive });
      setMethods((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Zonas de envío</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Definí el costo de envío por provincia. Dejá las provincias vacías para que aplique a todo el país.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl border-2 border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-800"
        >
          + Nueva zona
        </button>
      </div>

      {/* Error global */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Legend */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
        <strong className="text-zinc-700">Provincias vacías</strong> = el método aparece para todos los destinos (ej: Retiro en local).<br />
        <strong className="text-zinc-700">Provincias seleccionadas</strong> = solo aparece cuando el cliente elige esa provincia en el checkout.
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-zinc-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
          Cargando zonas...
        </div>
      ) : methods.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 py-14 text-center">
          <p className="text-sm font-semibold text-zinc-500">No hay zonas de envío configuradas.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 rounded-xl border-2 border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-800"
          >
            Crear primera zona
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {methods.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl border-2 bg-white p-5 transition-opacity ${
                m.isActive ? "border-zinc-200" : "border-zinc-100 opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-zinc-900">{m.name}</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                        m.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {m.isActive ? "Activo" : "Inactivo"}
                    </span>
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-700">
                      {formatCost(m.cost)}
                    </span>
                  </div>
                  {m.description && (
                    <p className="mt-1 text-sm text-zinc-500">{m.description}</p>
                  )}
                  <div className="mt-2">
                    {m.provinces.length === 0 ? (
                      <p className="text-xs text-zinc-400">Disponible para todo el país</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {m.provinces.map((p) => (
                          <span
                            key={p}
                            className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(m)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-zinc-400"
                  >
                    {m.isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(m)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-zinc-400"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:border-red-400 disabled:opacity-50"
                  >
                    {deletingId === m.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border-2 border-zinc-900 bg-white shadow-[8px_8px_0_#11111115]">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h2 className="text-base font-black text-zinc-900">
                {editingId ? "Editar zona de envío" : "Nueva zona de envío"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-bold text-zinc-500 hover:border-zinc-400"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {formError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Nombre de la zona
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej: Envío Misiones, Envío Nacional, Retiro en local"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Descripción <span className="font-normal normal-case text-zinc-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Ej: 3 a 5 días hábiles por OCA"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Costo (ARS · 0 para gratis)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.cost}
                    onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                    placeholder="Ej: 5000"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                  />
                </div>

                {/* Provinces */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Provincias que cubre
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={selectAllProvinces} className="text-xs text-zinc-500 hover:text-zinc-800 underline">
                        Todas
                      </button>
                      <button type="button" onClick={clearAllProvinces} className="text-xs text-zinc-500 hover:text-zinc-800 underline">
                        Ninguna
                      </button>
                    </div>
                  </div>
                  <p className="mb-3 text-xs text-zinc-400">
                    {form.provinces.length === 0
                      ? "Sin selección = disponible para todo el país."
                      : `${form.provinces.length} provincia${form.provinces.length !== 1 ? "s" : ""} seleccionada${form.provinces.length !== 1 ? "s" : ""}.`}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {AR_PROVINCES.map((p) => {
                      const selected = form.provinces.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => toggleProvince(p)}
                          className={`rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                            selected
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.isActive ? "bg-zinc-900" : "bg-zinc-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-zinc-700">
                    {form.isActive ? "Zona activa (visible en el checkout)" : "Zona inactiva (oculta)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border-2 border-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-600 hover:border-zinc-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border-2 border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {editingId ? "Guardar cambios" : "Crear zona"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
