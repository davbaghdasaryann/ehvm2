"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type FloatingItem = {
  id: string;
  children: ReactNode;
  depth: number;
};

/**
 * Place icons in separate zones around the center for an even spread.
 * The generator checks center-to-center distance so icons do not overlap,
 * especially on mobile where the old random zones could collide.
 */
function generatePositions(
  count: number,
  viewport: { width: number; height: number },
): { top: string; left: string }[] {
  if (count === 0) return [];

  const isMobile = viewport.width < 640;
  const iconSize = isMobile ? 80 : 100;
  const minDistance = iconSize + (isMobile ? 22 : 28);
  const jitter = isMobile ? 4 : 6;

  const zones = isMobile
    ? [
        { x: 22, y: 10 },
        { x: 78, y: 11 },
        { x: 17, y: 35 },
        { x: 83, y: 37 },
        { x: 23, y: 66 },
        { x: 77, y: 66 },
        { x: 50, y: 84 },
      ]
    : [
        { x: 20, y: 12 },
        { x: 50, y: 10 },
        { x: 80, y: 12 },
        { x: 11, y: 48 },
        { x: 89, y: 48 },
        { x: 22, y: 79 },
        { x: 50, y: 84 },
        { x: 78, y: 79 },
      ];

  // Fisher-Yates shuffle
  const shuffled = [...zones];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const placed: Array<{ x: number; y: number }> = [];

  selected.forEach((zone) => {
    let best = { x: zone.x, y: zone.y };

    for (let attempt = 0; attempt < 24; attempt++) {
      const candidate = {
        x: Math.max(8, Math.min(92, zone.x + (Math.random() * 2 - 1) * jitter)),
        y: Math.max(6, Math.min(90, zone.y + (Math.random() * 2 - 1) * jitter)),
      };
      const overlaps = placed.some((position) => {
        const dx = ((candidate.x - position.x) / 100) * viewport.width;
        const dy = ((candidate.y - position.y) / 100) * viewport.height;
        return Math.hypot(dx, dy) < minDistance;
      });

      if (!overlaps) {
        best = candidate;
        break;
      }
    }

    placed.push(best);
  });

  return placed.map((position) => ({
    top: `${position.y}%`,
    left: `${position.x}%`,
  }));
}

export default function FloatingIcons({ items }: { items: FloatingItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [positions, setPositions] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    const updatePositions = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      setPositions(generatePositions(items.length, {
        width: rect?.width || window.innerWidth,
        height: rect?.height || window.innerHeight,
      }));
    };

    updatePositions();
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, [items]);

  useEffect(() => {
    if (positions.length === 0) return;

    const driftPhases = items.map(() => ({
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      speedX: 0.3 + Math.random() * 0.3,
      speedY: 0.2 + Math.random() * 0.25,
      ampX: window.innerWidth < 640 ? 1.5 + Math.random() * 2 : 3 + Math.random() * 4,
      ampY: window.innerWidth < 640 ? 1.5 + Math.random() * 2 : 3 + Math.random() * 4,
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

        const parallaxStrength = window.innerWidth < 640 ? 4 + item.depth * 6 : 12 + item.depth * 18;
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
