"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/context/store-context";
import { categories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const links = [
  ...categories.map((cat) => ({ href: `/tienda?categoria=${cat.slug}`, label: cat.name })),
  { href: "/nosotros", label: "Nosotros" },
  { href: "/faq", label: "Preguntas frecuentes" },
  { href: "/contacto", label: "Contacto" },
  { href: "/tienda", label: "Ver todo" },
];

export function Navbar() {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null);
  const { auth, cartCount, openCart, logout } = useStore();
  const navLinks = links;

  const submitSearch = () => {
    const q = searchTerm.trim();
    if (!q) {
      window.location.href = "/tienda";
      setMobileOpen(false);
      return;
    }
    window.location.href = `/tienda?q=${encodeURIComponent(q)}`;
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-300 bg-zinc-100">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 md:px-6 lg:hidden">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-[var(--font-space-mono)] text-base font-bold uppercase tracking-[0.24em] text-zinc-950 md:text-lg">
            Norte Gaming
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((current) => !current)}
            className="text-zinc-900"
            aria-expanded={mobileSearchOpen}
            aria-label="Abrir buscador"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20L16.6 16.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {auth.isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-900"
            >
              Salir
            </button>
          ) : (
            <Link href="/login" className="text-zinc-900" aria-label="Mi cuenta">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
                <path d="M5 20C5.8 16.9 8.4 15 12 15C15.6 15 18.2 16.9 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          )}

          <button type="button" onClick={openCart} className="relative text-zinc-900" aria-label="Abrir carrito">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 5H5L7.5 15H17.5L20 8H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="19" r="1.5" fill="currentColor" />
              <circle cx="17" cy="19" r="1.5" fill="currentColor" />
            </svg>
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 rounded-full border border-black bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            ref={mobileButtonRef}
            onClick={() => setMobileOpen((current) => !current)}
            className="text-zinc-900"
            aria-expanded={mobileOpen}
            aria-label="Abrir menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="hidden border-b border-zinc-800 bg-black lg:block">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-[var(--font-space-mono)] text-xl font-bold uppercase tracking-[0.22em] text-white">
              Norte Gaming
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-2xl items-center">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitSearch();
                }
              }}
                placeholder="Buscá mousepads, auriculares, monitores..."
              className="h-11 w-full rounded-l-md border border-zinc-700 bg-zinc-100 px-4 font-[var(--font-space-mono)] text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
            />
            <button
              type="button"
              onClick={submitSearch}
              className="flex h-11 w-12 items-center justify-center rounded-r-md border border-l-0 border-red-700 bg-red-700 text-zinc-100 transition hover:bg-red-600"
              aria-label="Buscar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20L16.6 16.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex h-11 items-center gap-5 text-zinc-200">
            {auth.isLoggedIn ? (
              <button
                type="button"
                onClick={logout}
                className="text-[11px] font-bold uppercase tracking-[0.14em] transition hover:text-red-400"
              >
                Salir
              </button>
            ) : (
              <Link href="/login" className="transition hover:text-red-400" aria-label="Mi cuenta">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 20C5.8 16.9 8.4 15 12 15C15.6 15 18.2 16.9 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Link>
            )}
            <button
              type="button"
              onClick={openCart}
              className="relative transition hover:text-red-400"
              aria-label="Abrir carrito"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 5H5L7.5 15H17.5L20 8H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="19" r="1.5" fill="currentColor" />
                <circle cx="17" cy="19" r="1.5" fill="currentColor" />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 rounded-full border border-black bg-red-600 px-1.5 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden border-t border-zinc-700 bg-zinc-800 lg:block">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-8 overflow-x-auto px-4 py-4 md:px-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative whitespace-nowrap pb-1 font-[var(--font-space-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-100 transition hover:text-red-300",
                pathname === link.href && "text-red-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-red-400",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="border-t border-zinc-300 bg-zinc-100 px-4 py-3 lg:hidden">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitSearch();
              }
            }}
            placeholder="Buscar periféricos"
            className="w-full rounded-md border border-zinc-400 bg-white px-3 py-2 font-[var(--font-space-mono)] text-sm outline-none placeholder:text-zinc-500"
          />
        </div>
      ) : null}

      {mobileOpen ? (
        <div ref={mobileMenuRef} className="border-t border-zinc-300 bg-zinc-100 p-4 lg:hidden">
          <div className="mb-3 flex items-center gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-xs font-semibold uppercase tracking-widest text-zinc-700"
            >
              {auth.isLoggedIn ? "Cuenta" : "Ingresar"}
            </Link>
            <button
              type="button"
              onClick={() => {
                openCart();
                setMobileOpen(false);
              }}
              className="ml-auto text-xs font-semibold uppercase tracking-widest text-zinc-700"
            >
              Carrito ({cartCount})
            </button>
          </div>

          <div className="grid gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-700",
                  pathname === link.href && "border-zinc-900 text-zinc-950",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!mobileOpen) return;

    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (mobileMenuRef.current && mobileMenuRef.current.contains(target)) return;
      if (mobileButtonRef.current && mobileButtonRef.current.contains(target)) return;
      setMobileOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);
