"use client";

import { useEffect, useState } from "react";
import { adminListUsers, adminSetUserStatus, adminGetUserById, adminUpdateUser, adminDeleteUser, AdminUserItem } from "@/lib/admin-api";
import { Select } from "@/components/common/select";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "");

export function UsersAdminClient() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async (p = 1, q = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListUsers({ page: p, limit, q });
      setUsers(res.data);
      setPage(res.page);
    } catch (err) {
      setError(errorMessage(err) || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleStatus = async (user: AdminUserItem) => {
    const original = users;
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
    try {
      await adminSetUserStatus(user.id, !user.isActive);
    } catch (err) {
      setUsers(original);
      setError(errorMessage(err) || "No se pudo actualizar el estado");
    }
  };

  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const closeDetails = () => {
    setEditing(false);
    setSelectedUser(null);
    setDetailError(null);
  };

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetails();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editing]);

  const openDetails = async (userId: string) => {
    setEditing(true);
    setSelectedUser(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const u = await adminGetUserById(userId);
      setSelectedUser(u);
    } catch (err) {
      setDetailError(errorMessage(err) || "No se pudo cargar el usuario");
    } finally {
      setDetailLoading(false);
    }
  };

  const saveDetails = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setDetailError(null);
    try {
      const updated = await adminUpdateUser(selectedUser.id, selectedUser);
      setUsers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      closeDetails();
    } catch (err) {
      setDetailError(errorMessage(err) || "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  };

  const [pendingDelete, setPendingDelete] = useState<AdminUserItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const askDelete = (user: AdminUserItem) => {
    setDeleteError(null);
    setPendingDelete(user);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminDeleteUser(pendingDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(errorMessage(err) || "No se pudo eliminar el usuario");
    } finally {
      setDeleting(false);
    }
  };

  const fullNameOf = (user: AdminUserItem) =>
    `${user.firstName || ""}${user.lastName ? ` ${user.lastName}` : ""}`.trim() || user.email;

  const onFieldChange = <K extends keyof AdminUserItem>(field: K, value: AdminUserItem[K]) => {
    setSelectedUser((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Usuarios</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">Gestión de usuarios</h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600 md:text-base">Listado de clientes registrados y acciones administrativas.</p>
      </section>

      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <input
            className="w-full sm:w-72 border rounded-lg px-3 py-2"
            placeholder="Buscar por nombre o email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(1, search);
            }}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              className="px-3 py-2 bg-zinc-100 rounded-lg font-medium"
              onClick={() => void load(1, search)}
            >
              Buscar
            </button>
            <button
              className="px-3 py-2 bg-zinc-100 rounded-lg font-medium"
              onClick={() => { setSearch(""); void load(1, ""); }}
            >
              Limpiar
            </button>
          </div>
        </div>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">No hay usuarios.</div>
          ) : (
            users.map((user) => {
              const fullName = `${user.firstName || ""}${user.lastName ? ` ${user.lastName}` : ""}`.trim() || "Sin nombre";

              return (
                <article key={user.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-zinc-950">{fullName}</h3>
                      <p className="mt-1 break-all text-sm text-zinc-600">{user.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"}`}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Rol</div>
                      <div className="font-medium text-zinc-900">{user.role || "CLIENT"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Creado</div>
                      <div className="font-medium text-zinc-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                      onClick={() => void toggleStatus(user)}
                    >
                      {user.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900"
                      onClick={() => void openDetails(user.id)}
                    >
                      Ver / Editar
                    </button>
                    <button
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                      onClick={() => askDelete(user)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600">
                <th className="pb-2">Nombre</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Rol</th>
                <th className="pb-2">Creado</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-4">Cargando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-4">No hay usuarios.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="py-3">{(user.firstName || "") + (user.lastName ? ` ${user.lastName}` : "")}</td>
                    <td className="py-3">{user.email}</td>
                    <td className="py-3">{user.role || "CLIENT"}</td>
                    <td className="py-3">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}</td>
                    <td className="py-3">{user.isActive ? "Activo" : "Inactivo"}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1 bg-zinc-100 rounded"
                          onClick={() => void toggleStatus(user)}
                        >
                          {user.isActive ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          className="px-3 py-1 bg-zinc-100 rounded"
                          onClick={() => void openDetails(user.id)}
                        >
                          Ver / Editar
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                          onClick={() => askDelete(user)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDetails}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-xl sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="edit-user-title" className="text-lg font-bold">Editar usuario</h2>
            <button type="button" aria-label="Cerrar" className="rounded-lg px-2 py-1 text-xl leading-none text-zinc-500 hover:bg-zinc-100" onClick={closeDetails}>×</button>
          </div>
          {detailError && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{detailError}</div>}
          {detailLoading && <div className="py-6 text-center text-sm text-zinc-600">Cargando usuario...</div>}
          {selectedUser && (
          <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input className="border rounded-lg px-3 py-2" value={selectedUser.firstName ?? ""} placeholder="Nombre" onChange={(e) => onFieldChange('firstName', e.target.value)} />
            <input className="border rounded-lg px-3 py-2" value={selectedUser.lastName ?? ""} placeholder="Apellido" onChange={(e) => onFieldChange('lastName', e.target.value)} />
            <input className="border rounded-lg px-3 py-2 md:col-span-2" value={selectedUser.email} placeholder="Email" disabled />
            <input className="border rounded-lg px-3 py-2" value={selectedUser.phone ?? ""} placeholder="Teléfono" onChange={(e) => onFieldChange('phone', e.target.value)} />
            <Select
              aria-label="Rol"
              value={selectedUser.role ?? 'CLIENT'}
              onChange={(value) => onFieldChange('role', value)}
              options={[
                { value: "CLIENT", label: "CLIENT" },
                { value: "ADMIN", label: "ADMIN" },
              ]}
            />
            <div className="flex items-center gap-3 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                <input type="checkbox" checked={selectedUser.isActive} onChange={(e) => onFieldChange('isActive', e.target.checked)} />
                <span>Activo</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium" onClick={() => void saveDetails()} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            <button className="px-4 py-2 bg-zinc-100 rounded-lg font-medium" onClick={closeDetails}>Cancelar</button>
          </div>
          </>
          )}
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-user-title" className="text-lg font-bold text-zinc-950">
              ¿Eliminar a {fullNameOf(pendingDelete)}?
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              La cuenta <span className="font-medium text-zinc-900">{pendingDelete.email}</span> deja de poder iniciar sesión y desaparece de esta lista.
              Sus pedidos se conservan en el historial, y el email queda libre para registrarse de nuevo.
            </p>
            {deleteError && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</div>}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg bg-zinc-100 px-4 py-2 font-medium"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60"
                onClick={() => void confirmDelete()}
                disabled={deleting}
              >
                {deleting ? "Eliminando..." : "Eliminar usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
