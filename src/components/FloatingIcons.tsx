"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type FloatingItem = {
  id: string;
  children: ReactNode;
  depth: number;
};

/**
 * Place icons in separate zones around the center for an even spread.
 * Each icon gets its own sector, then a random position within that sector.
 * Icons can go up to 50% off-screen at edges (clipped by overflow-hidden).
 */
function generatePositions(count: number): { top: string; left: string }[] {
  if (count === 0) return [];

  // 8 zones arranged around the center safe area (logo/text).
  // Center content lives at ~y:42-58%. Icons are ~80px on mobile (715px main)
  // so icon centers need ≥6% clearance → top yMax≤28, bottom yMin≥68.
  const zones = [
    { xMin: 0, xMax: 33, yMin: 0, yMax: 28 },      // top-left
    { xMin: 33, xMax: 67, yMin: 0, yMax: 22 },      // top-center (extra buffer)
    { xMin: 67, xMax: 100, yMin: 0, yMax: 28 },     // top-right
    { xMin: 0, xMax: 12, yMin: 30, yMax: 70 },      // mid-left (peeking from edge)
    { xMin: 88, xMax: 100, yMin: 30, yMax: 70 },    // mid-right (peeking from edge)
    { xMin: 0, xMax: 33, yMin: 68, yMax: 90 },      // bottom-left
    { xMin: 33, xMax: 67, yMin: 76, yMax: 90 },     // bottom-center (extra buffer)
    { xMin: 67, xMax: 100, yMin: 68, yMax: 90 },    // bottom-right
  ];

  // Fisher-Yates shuffle
  const shuffled = [...zones];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // One icon per zone — pick as many zones as we have icons
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((zone) => ({
    top: `${zone.yMin + Math.random() * (zone.yMax - zone.yMin)}%`,
    left: `${zone.xMin + Math.random() * (zone.xMax - zone.xMin)}%`,
  }));
}

export default function FloatingIcons({ items }: { items: FloatingItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [positions, setPositions] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    setPositions(generatePositions(items.length));
  }, [items]);

  useEffect(() => {
    if (positions.length === 0) return;

    const driftPhases = items.map(() => ({
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      speedX: 0.3 + Math.random() * 0.3,
      speedY: 0.2 + Math.random() * 0.25,
      ampX: 3 + Math.random() * 4,
      ampY: 3 + Math.random() * 4,
    }));

    const startTime = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: 0, y: 0 };
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    const currentOffsets = items.map(() => ({ x: 0, y: 0 }));
    const targetOffsets = items.map(() => ({ x: 0, y: 0 }));

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;

      items.forEach((item, i) => {
        const drift = driftPhases[i];
        const driftX = Math.sin(elapsed * drift.speedX + drift.phaseX) * drift.ampX;
        const driftY = Math.cos(elapsed * drift.speedY + drift.phaseY) * drift.ampY;

        const parallaxStrength = 12 + item.depth * 18;
        const mouseX = mouseRef.current.x * parallaxStrength;
        const mouseY = mouseRef.current.y * parallaxStrength;

        targetOffsets[i] = { x: driftX + mouseX, y: driftY + mouseY };

        currentOffsets[i] = {
          x: currentOffsets[i].x + (targetOffsets[i].x - currentOffsets[i].x) * 0.04,
          y: currentOffsets[i].y + (targetOffsets[i].y - currentOffsets[i].y) * 0.04,
        };

        const el = iconRefs.current[i];
        if (el) {
          el.style.transform = `translate(-50%, -50%) translate(${currentOffsets[i].x}px, ${currentOffsets[i].y}px)`;
        }
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [items, positions]);

  if (positions.length === 0) {
    return <div ref={containerRef} className="absolute inset-0 z-10" />;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 z-10">
      {items.map((item, i) => (
        <div
          key={item.id}
          ref={(el) => { iconRefs.current[i] = el; }}
          className="absolute"
          style={{
            ...positions[i],
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="icon-pop-in"
            style={{ animationDelay: `${1.0 + i * 0.1}s` }}
          >
            {item.children}
          </div>
        </div>
      ))}
    </div>
  );
}
