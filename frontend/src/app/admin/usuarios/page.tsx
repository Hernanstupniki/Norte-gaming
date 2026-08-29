import { UsersAdminClient } from "@/components/admin/users-admin-client";

export const metadata = {
  title: "Admin - Usuarios",
  robots: "noindex, nofollow",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Usuarios</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">Panel de usuarios</h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600 md:text-base">
          Ver y gestionar los clientes registrados en la plataforma.
        </p>
      </section>

      <UsersAdminClient />
    </div>
  );
}
