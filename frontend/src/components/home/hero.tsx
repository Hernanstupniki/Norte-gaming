"use client";

import Link from "next/link";

const CARDS = [
  {
    num: "001",
    title: "AJAZZ AJ199\nMAX NACODEXX",
    status: "LANZAMIENTO",
    subtitle: "Mouse AJAZZ AJ199 Max Nacodexx",
    imageSrc: "/products/mouse_ajazz_aj199_transparente.png",
    href: "/producto/mouse-ajazz-aj199-max-nacodexx-wireless",
  },
  {
    num: "002",
    title: "AJAZZ\nAK650",
    status: "YA DISPONIBLE!",
    subtitle: "Teclado AJAZZ AK650",
    imageSrc: "/products/ajazz-ak650.png.png",
    href: "/producto/teclado-ajazz-ak650",
  },
  {
    num: "003",
    title: "REDRAGON\nAK1 S MOUSEPAD",
    status: "DESTACADO",
    subtitle: "Mousepad REDRAGON AK1 S",
    imageSrc: "/products/redragon-ak1-s-mousepad.png.png",
    href: "/producto/mousepad-redragon-ak-s",
  },
];

function Crosshair() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-red-600">
      <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9" y1="0" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9" y1="13" x2="9" y2="18" stroke="currentColor" strokeWidth="1.2" />
      <line x1="0" y1="9" x2="5" y2="9" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="9" x2="18" y2="9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function GamingCard({ card }: { card: typeof CARDS[0] }) {
  const titleLines = card.title.split("\n");

  return (
    <Link
      href={card.href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-black transition-transform duration-200 hover:-translate-y-1 hover:border-zinc-500"
    >
      {/* Inner frame */}
      <span className="pointer-events-none absolute inset-[7px] rounded-xl border border-zinc-700/50" />

      {/* Corner HUD brackets — outer */}
      <span className="absolute left-3 top-3 h-4 w-4 border-l-[2px] border-t-[2px] border-white/25" />
      <span className="absolute right-3 top-3 h-4 w-4 border-r-[2px] border-t-[2px] border-white/25" />
      <span className="absolute bottom-3 left-3 h-4 w-4 border-b-[2px] border-l-[2px] border-white/25" />
      <span className="absolute bottom-3 right-3 h-4 w-4 border-b-[2px] border-r-[2px] border-white/25" />

      {/* Corner + symbols */}
      <span className="absolute left-[22px] top-[11px] text-[10px] font-bold text-white/20">+</span>
      <span className="absolute right-[22px] top-[11px] text-[10px] font-bold text-white/20">+</span>

      {/* Top: NORTE GAMING label */}
      <div className="relative px-5 pt-5">
        <p className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-red-500">
          <span className="h-px w-6 bg-red-600/60" />
          Norte Gaming
          <span className="h-px w-6 bg-red-600/60" />
        </p>
      </div>

      {/* Product title */}
      <div className="px-5 pt-3">
        {titleLines.map((line, i) => (
          <h2
            key={i}
            className="block text-center text-[1.6rem] font-black uppercase leading-none tracking-tight text-white md:text-[1.8rem]"
            style={{ fontStretch: "condensed" }}
          >
            {line}
          </h2>
        ))}
      </div>

      {/* Card number */}
      <span className="absolute right-4 top-1/3 -translate-y-1/2 text-[10px] font-mono font-bold text-zinc-600">
        {card.num}
      </span>

      {/* Left red dots */}
      <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-[5px]">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="h-[5px] w-[5px] rounded-full bg-red-600 opacity-80" />
        ))}
      </div>

      {/* Crosshair top-left */}
      <div className="absolute left-[14px] top-[38px]">
        <Crosshair />
      </div>

      {/* Product image */}
      <div className="relative mx-auto flex h-96 w-full max-w-[85%] items-center justify-center py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.imageSrc}
          alt={card.subtitle}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.opacity = "0.15";
          }}
        />
      </div>

      {/* Bottom info */}
      <div className="mt-auto px-5 pb-5">
        {/* Status */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
            {card.status}
          </span>
          <span className="flex-1 border-b border-red-600/40" />
        </div>

        {/* Subtitle */}
        <p className="mb-4 text-[11px] text-zinc-400">{card.subtitle}</p>

        {/* CTA button */}
        <button className="w-full rounded-sm border-2 border-white bg-red-600 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[3px_3px_0_#000] transition-all group-hover:shadow-[1px_1px_0_#000]">
          Comprar ahora
        </button>
      </div>

      {/* Bottom hazard strip */}
      <div
        className="h-2 w-full opacity-30"
        style={{
          background:
            "repeating-linear-gradient(45deg, #444, #444 3px, #111 3px, #111 8px)",
        }}
      />
    </Link>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,#d4d4d8_1px,transparent_1px),linear-gradient(to_bottom,#d4d4d8_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <GamingCard key={card.num} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
