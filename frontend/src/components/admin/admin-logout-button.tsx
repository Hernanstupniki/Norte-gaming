"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
    >
      Cerrar sesión
    </button>
  );
}
