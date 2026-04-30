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

      <div className="bg-white border border-zinc-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <input
            className="border rounded px-3 py-2 w-64"
            placeholder="Buscar por nombre o email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(1, search);
            }}
          />
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 bg-zinc-100 rounded"
              onClick={() => void load(1, search)}
            >
              Buscar
            </button>
            <button
              className="px-3 py-2 bg-zinc-100 rounded"
              onClick={() => { setSearch(""); void load(1, ""); }}
            >
              Limpiar
            </button>
          </div>
        </div>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="overflow-x-auto">
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
        <div className="bg-white border border-zinc-200 rounded-xl p-4 mt-4">
          <h2 className="text-lg font-bold mb-3">Editar usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" value={selectedUser.firstName ?? ""} placeholder="Nombre" onChange={(e) => onFieldChange('firstName', e.target.value)} />
            <input className="border rounded px-3 py-2" value={selectedUser.lastName ?? ""} placeholder="Apellido" onChange={(e) => onFieldChange('lastName', e.target.value)} />
            <input className="border rounded px-3 py-2" value={selectedUser.email} placeholder="Email" disabled />
            <input className="border rounded px-3 py-2" value={selectedUser.phone ?? ""} placeholder="Teléfono" onChange={(e) => onFieldChange('phone', e.target.value)} />
            <select className="border rounded px-3 py-2 md:col-span-1" value={selectedUser.role ?? 'CLIENT'} onChange={(e) => onFieldChange('role', e.target.value)}>
              <option value="CLIENT">CLIENT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selectedUser.isActive} onChange={(e) => onFieldChange('isActive', e.target.checked)} />
                <span>Activo</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 bg-zinc-900 text-white rounded" onClick={() => void saveDetails()} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            <button className="px-4 py-2 bg-zinc-100 rounded" onClick={() => { setEditing(false); setSelectedUser(null); }}>{'Cancelar'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
