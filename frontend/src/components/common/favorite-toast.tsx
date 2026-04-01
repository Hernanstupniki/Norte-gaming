"use client";

import { useStore } from "@/context/store-context";

export function FavoriteToast() {
  const { favoriteNotice, dismissFavoriteNotice } = useStore();

  if (!favoriteNotice) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-lg border-2 border-black bg-white px-4 py-3 shadow-[6px_6px_0_#1111111a] sm:bottom-6">
      <div className="pointer-events-auto flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-900">{favoriteNotice}</p>
        <button
          type="button"
          onClick={dismissFavoriteNotice}
          className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-700 hover:bg-zinc-100"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
