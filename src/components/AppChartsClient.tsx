"use client";

import { useEffect, useRef, useState } from "react";
import type { App } from "@/data/apps";

type AppChart = NonNullable<App["charts"]>[number];

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

export default function AppChartsClient({ charts }: { charts: AppChart[] }) {
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
                if (!isPie && resolvedType === "bar") {
                  borderColor = colorsArray;
                }
              } else if (isPie) {
                backgroundColor = PIE_PALETTE.slice(0, data.length);
              }
            } else if (isPie) {
              backgroundColor = PIE_PALETTE.slice(0, data.length);
            }

            if (isPie) {
              borderColor = "#fff";
            } else if (resolvedType === "line") {
              backgroundColor = hexToRgba(color, 0.08);
            }

            return {
              label: dataset.label || "",
              data,
              borderColor,
              backgroundColor,
              borderWidth: isPie ? 2 : resolvedType === "line" ? 2 : 1,
              borderRadius: resolvedType === "bar" ? 4 : 0,
              pointRadius: resolvedType === "line" ? 3 : 0,
              fill: resolvedType === "line",
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
          nextLegends[chartIndex] = chart.labels.map((label, i) => ({
            color: (PIE_PALETTE[i % PIE_PALETTE.length]),
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
      <p className="font-bold text-[20px] leading-[1.2]">Business Charts</p>
      <div className="grid grid-cols-1 gap-[10px] w-full">
        {charts.map((chart, chartIndex) => {
          const { resolvedType } = normalizeChartType(chart.type);
          const isPie = resolvedType === "pie" || resolvedType === "doughnut";
          const legend = pieLegends[chartIndex];

          return (
            <div key={`${chart.title}-${chartIndex}`} className="bg-tag rounded-[16px] p-[12px]">
              <p className="font-bold text-[15px] leading-[1.2]">{chart.title || `Chart ${chartIndex + 1}`}</p>
              {chart.subtitle ? (
                <p className="text-[12px] text-caption mt-[4px]">{chart.subtitle}</p>
              ) : null}
              {isPie ? (
                <div className="flex flex-col sm:flex-row items-center gap-[16px] mt-[10px]">
                  <div className="relative h-[200px] w-[200px] shrink-0">
                    <canvas
                      ref={(node) => { canvasRefs.current[chartIndex] = node; }}
                    />
                  </div>
                  {legend && (
                    <div className="flex flex-col gap-[8px] flex-1 w-full">
                      {legend.map((item, i) => (
                        <div key={i} className="flex items-center gap-[8px]">
                          <span
                            className="size-[10px] rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[13px] flex-1 leading-[1.2]">{item.label}</span>
                          <span className="text-[13px] font-bold tabular-nums">{item.pct}</span>
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
          );
        })}
      </div>
    </div>
  );
}
