"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/store-context";
import { loginUser, registerUser } from "@/lib/user-api";

interface AuthPanelProps {
  mode: "login" | "register";
}

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const { login } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session =
        mode === "login"
          ? await loginUser(email, password)
          : await registerUser({
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email,
              password,
            });

      login(session);
      router.push("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo completar la operación",
      );
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Ingresar" : "Crear cuenta";
  const description =
    mode === "login"
      ? "Accedé a tus guardados, historial y seguimiento de compras."
      : "Registrate para una experiencia de compra más rápida y personalizada.";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center px-4 py-12 md:px-6">
      <div className="grid w-full gap-6 rounded-2xl border-2 border-black bg-white p-6 shadow-[10px_10px_0_#11111118] md:grid-cols-2 md:p-8">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Norte Account</p>
          <h1 className="text-4xl font-black tracking-tight">{title}</h1>
          <p className="text-zinc-600">{description}</p>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            Recuperación visual: recibí un enlace por email para restablecer tu contraseña.
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          {mode === "register" ? (
            <>
              <input
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Nombre"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
              <input
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Apellido"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
            </>
          ) : null}
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
            minLength={8}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <button
            disabled={loading}
            className="w-full rounded-md border-2 border-black bg-black px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
          >
            {mode === "login" ? "Ingresar" : "Registrarme"}
          </button>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          {mode === "login" ? (
            <p className="text-center text-xs text-zinc-600">
              ¿No tenés cuenta? <Link href="/registro" className="font-semibold text-zinc-900">Registrate</Link>
            </p>
          ) : (
            <p className="text-center text-xs text-zinc-600">
              ¿Ya tenés cuenta? <Link href="/login" className="font-semibold text-zinc-900">Ingresá</Link>
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
