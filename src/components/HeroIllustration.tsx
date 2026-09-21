"use client";

import { useRef, useState } from "react";

import heroImage from  "../../public/compress-nivishdigital.webp";

const BEACH_IMAGE = heroImage.src;
  

export function HeroIllustration() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePositionFromPointer = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    updatePositionFromPointer(event.clientX);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updatePositionFromPointer(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      <div
        ref={containerRef}
        className="relative h-[420px] w-full overflow-hidden rounded-[30px] border border-white/20 bg-slate-200 shadow-[0_26px_60px_rgba(20,40,80,0.22)]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setDragging(false)}
        style={{ touchAction: "none" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BEACH_IMAGE})` }}
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${BEACH_IMAGE})`,
            clipPath: `inset(0 0 0 ${position}%)`,
          }}
        />

        <div
          aria-hidden
          className="absolute inset-y-0 w-[2px] bg-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
          style={{ left: `${position}%` }}
        />

        <div
          aria-hidden
          className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm"
          style={{ left: `${position}%` }}
        >
          <div className="flex items-center justify-center gap-1 text-slate-700">
            <span className="block h-3 w-1 rounded-full bg-current" />
            <span className="block h-3 w-1 rounded-full bg-current" />
          </div>
        </div>

        <div className="absolute bottom-6 left-6 text-left text-white">
          <div className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/80">Before</div>
          <div className="mt-1 text-[16px] font-semibold">1.5 MB</div>
        </div>

        <div className="absolute right-6 top-6 text-right text-white">
          <div className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/85">After</div>
          <div className="mt-1 text-[16px] font-semibold">150 KB</div>
        </div>
      </div>
    </div>
  );
}
