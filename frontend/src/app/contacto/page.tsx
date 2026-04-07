"use client";

import { FormEvent, useState } from "react";
import { createContactInquiry } from "@/lib/backend-api";

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const initialFormState: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactoPage() {
  const [form, setForm] = useState<ContactFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      await createContactInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setFeedback({
        tone: "success",
        text: "Consulta enviada correctamente. Te vamos a responder por mail.",
      });
      setForm(initialFormState);
    } catch (error) {
      setFeedback({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la consulta. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-black tracking-tight">Contacto</h1>
      <p className="mt-2 text-zinc-600">Estamos para asesorarte antes y después de tu compra.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
          <input
            placeholder="Nombre"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            minLength={2}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Telefono (opcional)"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Asunto"
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            maxLength={150}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Mensaje"
            rows={6}
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            minLength={10}
            maxLength={2000}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          {feedback ? (
            <p className={feedback.tone === "success" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
              {feedback.text}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md border-2 border-black bg-black px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Enviando..." : "Enviar consulta"}
          </button>
        </form>

        <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-xl font-bold">Canales de atención</h2>
          <p className="text-sm text-zinc-600">
            WhatsApp:{" "}
            <a href="https://wa.me/5493757658938" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              +54 9 3757-658938
            </a>
          </p>
          <p className="text-sm text-zinc-600">Email: nortegamingba@gmail.com</p>
          <p className="text-sm text-zinc-600">
            Instagram:{" "}
            <a href="https://www.instagram.com/nortegaming_" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              @nortegaming_
            </a>
          </p>
          <p className="text-sm text-zinc-600">Puntos de retiro en Posadas, Misiones:</p>
          <ul className="list-disc pl-5 text-sm text-zinc-600">
            <li>Tucumán 1992</li>
            <li>Perito Moreno 5090</li>
          </ul>
          <p className="text-sm text-zinc-600">Soporte: 24/7</p>
          <div className="mt-5 overflow-hidden rounded-lg border border-zinc-300 bg-white">
            <iframe
              title="Mapa ubicación Norte Gaming"
              src="https://www.google.com/maps?q=Tucum%C3%A1n+1992,+Posadas,+Misiones,+Argentina&output=embed"
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600">
              <p className="mb-2">Este mapa corresponde a uno de nuestros puntos de retiro (Tucumán 1992).</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Tucum%C3%A1n+1992,+Posadas,+Misiones,+Argentina"
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline-offset-2 hover:underline"
              >
                Abrir en Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
