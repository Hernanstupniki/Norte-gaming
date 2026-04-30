"use client";

import { useEffect, useState } from "react";
import { adminListUsers, adminSetUserStatus, adminGetUserById, adminUpdateUser, AdminUserItem } from "@/lib/admin-api";

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
    } catch (err: any) {
      setError(err?.message || "Error cargando usuarios");
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
    } catch (err: any) {
      setUsers(original);
      setError(err?.message || "No se pudo actualizar el estado");
    }
  };

  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const openDetails = async (userId: string) => {
    setError(null);
    try {
      const u = await adminGetUserById(userId);
      setSelectedUser(u);
      setEditing(true);
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el usuario");
    }
  };

  const saveDetails = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminUpdateUser(selectedUser.id, selectedUser);
      setUsers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedUser(updated);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  };

  const onFieldChange = (field: keyof AdminUserItem, value: any) => {
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editing && selectedUser && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 mt-4 shadow-sm">
          <h2 className="text-lg font-bold mb-3">Editar usuario</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input className="border rounded-lg px-3 py-2" value={selectedUser.firstName ?? ""} placeholder="Nombre" onChange={(e) => onFieldChange('firstName', e.target.value)} />
            <input className="border rounded-lg px-3 py-2" value={selectedUser.lastName ?? ""} placeholder="Apellido" onChange={(e) => onFieldChange('lastName', e.target.value)} />
            <input className="border rounded-lg px-3 py-2 md:col-span-2" value={selectedUser.email} placeholder="Email" disabled />
            <input className="border rounded-lg px-3 py-2" value={selectedUser.phone ?? ""} placeholder="Teléfono" onChange={(e) => onFieldChange('phone', e.target.value)} />
            <select className="border rounded-lg px-3 py-2" value={selectedUser.role ?? 'CLIENT'} onChange={(e) => onFieldChange('role', e.target.value)}>
              <option value="CLIENT">CLIENT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className="flex items-center gap-3 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                <input type="checkbox" checked={selectedUser.isActive} onChange={(e) => onFieldChange('isActive', e.target.checked)} />
                <span>Activo</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium" onClick={() => void saveDetails()} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            <button className="px-4 py-2 bg-zinc-100 rounded-lg font-medium" onClick={() => { setEditing(false); setSelectedUser(null); }}>{'Cancelar'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
