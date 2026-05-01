"use client";

import { useEffect, useRef, useState } from "react";
import type { App } from "@/data/apps";

type AppChart = NonNullable<App["charts"]>[number];
const SECTION_TITLE_CLASS = "font-bold text-[20px] leading-[1.2]";

const PIE_PALETTE = [
  "#4361ee", "#f72585", "#4cc9f0", "#f4a261", "#2ec4b6",
  "#e63946", "#8338ec", "#06d6a0", "#fb8500", "#a8dadc",
];

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim();
  const full = /^#([0-9a-f]{6})$/i;
  const short = /^#([0-9a-f]{3})$/i;
  let val = 0;
  if (full.test(normalized)) val = Number.parseInt(normalized.slice(1), 16);
  else if (short.test(normalized)) {
    const ex = normalized.slice(1).split("").map((c) => c + c).join("");
    val = Number.parseInt(ex, 16);
  } else return `rgba(26,26,26,${alpha})`;
  return `rgba(${(val >> 16) & 255},${(val >> 8) & 255},${val & 255},${alpha})`;
}

function generateGradientPalette(baseHex: string, count: number): string[] {
  const normalized = baseHex.trim();
  const full = /^#([0-9a-f]{6})$/i;
  const short = /^#([0-9a-f]{3})$/i;
  let val = 0;
  if (full.test(normalized)) val = Number.parseInt(normalized.slice(1), 16);
  else if (short.test(normalized)) {
    const ex = normalized.slice(1).split("").map((c) => c + c).join("");
    val = Number.parseInt(ex, 16);
  } else return Array(count).fill("#1a1a1a");

  const r = (val >> 16) & 255;
  const g = (val >> 8) & 255;
  const b = val & 255;

  const palette: string[] = [];
  for (let i = 0; i < count; i++) {
    const ratio = i / Math.max(count - 1, 1);
    const lightness = 0.7 - ratio * 0.55;

    const lr = Math.round(r + (255 - r) * (lightness - 0.5) * 2);
    const lg = Math.round(g + (255 - g) * (lightness - 0.5) * 2);
    const lb = Math.round(b + (255 - b) * (lightness - 0.5) * 2);
    palette.push(`rgb(${Math.max(0, Math.min(255, lr))},${Math.max(0, Math.min(255, lg))},${Math.max(0, Math.min(255, lb))})`);
  }
  return palette;
}

function normalizeChartType(type: string): {
  resolvedType: "line" | "bar" | "doughnut" | "pie";
  indexAxis: "x" | "y";
} {
  if (type === "horizontalBar") return { resolvedType: "bar", indexAxis: "y" };
  if (type === "line" || type === "bar" || type === "doughnut" || type === "pie")
    return { resolvedType: type, indexAxis: "x" };
  return { resolvedType: "line", indexAxis: "x" };
}

type PieLegendItem = { color: string; label: string; pct: string };

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export default function AppChartsClient({ charts, lockedFields = [] }: { charts: AppChart[]; lockedFields?: string[] }) {
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const [pieLegends, setPieLegends] = useState<Array<PieLegendItem[] | null>>(
    () => charts.map(() => null),
  );

  useEffect(() => {
    let alive = true;
    const instances: Array<{ destroy: () => void }> = [];

    const mountCharts = async () => {
      const chartModule = await import("chart.js/auto");
      if (!alive) return;
      const Chart = chartModule.default;
      const nextLegends: Array<PieLegendItem[] | null> = charts.map(() => null);

      charts.forEach((chart, chartIndex) => {
        const canvas = canvasRefs.current[chartIndex];
        if (!canvas || !chart.labels?.length || !chart.datasets?.length) return;

        const { resolvedType, indexAxis } = normalizeChartType(chart.type);
        const isPie = resolvedType === "pie" || resolvedType === "doughnut";

        const normalizedDatasets = chart.datasets
          .map((dataset) => {
            const color = dataset.color || "#4361ee";
            const data = Array.isArray(dataset.data)
              ? dataset.data.filter((value) => Number.isFinite(value))
              : [];
            if (data.length === 0) return null;

            let backgroundColor: string | string[] = hexToRgba(color, 0.75);
            let borderColor: string | string[] = isPie ? "#fff" : color;

            const colors = (dataset as any).colors;
            if (colors && typeof colors === 'string') {
              const colorsArray = colors.split(',').map((c: string) => c.trim()).filter(Boolean);
              if (colorsArray.length > 0) {
                backgroundColor = colorsArray;
                if (isPie) {
                  borderColor = "#fff";
                } else if (resolvedType === "bar") {
                  borderColor = colorsArray;
                }
              } else if (isPie) {
                backgroundColor = generateGradientPalette(color, data.length);
                borderColor = "#fff";
              }
            } else if (isPie) {
              backgroundColor = generateGradientPalette(color, data.length);
              borderColor = "#fff";
            } else if (resolvedType === "line") {
              backgroundColor = hexToRgba(color, 0.08);
            }

            return {
              label: dataset.label || "",
              data,
              borderColor: isPie ? "transparent" : borderColor,
              backgroundColor,
              borderWidth: isPie ? 0 : resolvedType === "line" ? 2 : 1,
              borderRadius: 0,
              pointRadius: resolvedType === "line" ? 5 : 0,
              fill: false,
              tension: 0.4,
            };
          })
          .filter(
            (
              value,
            ): value is {
              label: string;
              data: number[];
              borderColor: string;
              backgroundColor: string | string[];
              borderWidth: number;
              borderRadius: number;
              pointRadius: number;
              fill: boolean;
              tension: number;
            } => value !== null,
          );

        if (normalizedDatasets.length === 0) return;

        // Build pie legend with percentages
        if (isPie && normalizedDatasets[0]) {
          const vals = normalizedDatasets[0].data as number[];
          const total = vals.reduce((a, b) => a + b, 0);
          const datasetColor = chart.datasets[0]?.color || "#4361ee";
          const customColors = (chart.datasets[0] as any)?.colors;
          const colorsArray = customColors ? customColors.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
          const palette = colorsArray.length > 0 ? colorsArray : generateGradientPalette(datasetColor, vals.length);
          nextLegends[chartIndex] = chart.labels.map((label, i) => ({
            color: palette[i] || (PIE_PALETTE[i % PIE_PALETTE.length]),
            label: String(label),
            pct: total > 0 ? `${Math.round((vals[i] / total) * 100)}%` : "—",
          }));
        }

        const instance = new Chart(canvas, {
          type: resolvedType,
          data: {
            labels: chart.labels,
            datasets: normalizedDatasets,
          },
          options: {
            indexAxis,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    if (!isPie) return ctx.formattedValue;
                    const total = (ctx.dataset.data as number[]).reduce(
                      (a: number, b: number) => a + b, 0,
                    );
                    const pct = total > 0
                      ? Math.round(((ctx.raw as number) / total) * 100)
                      : 0;
                    return ` ${ctx.label}: ${ctx.formattedValue} (${pct}%)`;
                  },
                },
              },
            },
            scales:
              isPie
                ? {}
                : {
                    x: { grid: { display: false }, border: { display: false } },
                    y: { grid: { color: "rgba(0,0,0,0.05)" }, border: { display: false } },
                  },
            cutout: resolvedType === "doughnut" ? "60%" : undefined,
          },
        });

        instances.push(instance);
      });

      if (alive) setPieLegends(nextLegends);
    };

    void mountCharts();

    return () => {
      alive = false;
      instances.forEach((instance) => instance.destroy());
    };
  }, [charts]);

  if (charts.length === 0) return null;

  return (
    <div className="flex flex-col gap-[12px] w-full">
      <p className={SECTION_TITLE_CLASS}>Business Charts</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[10px] w-full">
        {charts.map((chart, chartIndex) => {
          const { resolvedType } = normalizeChartType(chart.type);
          const isPie = resolvedType === "pie" || resolvedType === "doughnut";
          const legend = pieLegends[chartIndex];

          return (
            <div key={`${chart.title}-${chartIndex}`} className="rounded-[16px] p-[16px] relative overflow-hidden" style={{ background: "#F5F5F7" }}>
              <div className={lockedFields.includes(`charts.${chartIndex}`) ? "blur-[5px] opacity-65 select-none pointer-events-none" : ""}>
                <p className="font-bold text-[22px] leading-[1.2]">{chart.title || `Chart ${chartIndex + 1}`}</p>
                {chart.subtitle ? (
                  <p className="text-[12px] text-caption mt-[2px]">{chart.subtitle}</p>
                ) : null}
                {isPie ? (
                  <div className="flex flex-row items-center gap-[24px] mt-[14px]">
                    <div className="relative h-[200px] w-[200px] shrink-0">
                      <canvas
                        ref={(node) => { canvasRefs.current[chartIndex] = node; }}
                      />
                    </div>
                    {legend && (
                      <div className="flex flex-col gap-[10px] flex-1">
                        {legend.map((item, i) => (
                          <div key={i} className="flex items-center gap-[8px]">
                            <span
                              className="size-[10px] rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[14px] flex-1 leading-[1.2]">{item.label}</span>
                            <span className="text-[14px] text-caption tabular-nums">{item.pct}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative h-[220px] mt-[10px]">
                    <canvas
                      ref={(node) => { canvasRefs.current[chartIndex] = node; }}
                    />
                  </div>
                )}
              </div>
              {lockedFields.includes(`charts.${chartIndex}`) ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="size-[32px] rounded-full bg-card/80 backdrop-blur-[2px] flex items-center justify-center text-foreground shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
                    <LockIcon />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
