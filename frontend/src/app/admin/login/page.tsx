"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminLoginUser } from "@/lib/admin-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { accessToken } = await adminLoginUser(email, password);

      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
        };

        if (response.status === 403) {
          throw new Error("Tu cuenta no tiene permisos de administrador.");
        }

        throw new Error(payload.message || "No se pudo iniciar la sesión de admin");
      }

      router.replace("/admin/productos");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Norte Gaming CMS</p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">Ingresar al admin</h1>
        <p className="mt-1 text-sm text-zinc-600">Acceso restringido para usuarios con rol administrador.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </div>
    </main>
  );
}
