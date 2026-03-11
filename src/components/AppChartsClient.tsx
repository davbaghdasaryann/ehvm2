"use client";

import { useEffect, useRef } from "react";
import type { App } from "@/data/apps";

type AppChart = NonNullable<App["charts"]>[number];

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim();
  const shorthand = /^#([0-9a-f]{3})$/i;
  const full = /^#([0-9a-f]{6})$/i;

  if (shorthand.test(normalized)) {
    const parts = normalized.slice(1).split("");
    const expanded = parts.map((part) => `${part}${part}`).join("");
    const value = Number.parseInt(expanded, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (full.test(normalized)) {
    const value = Number.parseInt(normalized.slice(1), 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return `rgba(26, 26, 26, ${alpha})`;
}

function buildPiePalette(baseColor: string): string[] {
  return [
    hexToRgba(baseColor, 0.8),
    hexToRgba(baseColor, 0.68),
    hexToRgba(baseColor, 0.56),
    hexToRgba(baseColor, 0.44),
    hexToRgba(baseColor, 0.32),
    hexToRgba(baseColor, 0.2),
    hexToRgba(baseColor, 0.12),
  ];
}

function normalizeChartType(type: string): {
  resolvedType: "line" | "bar" | "doughnut" | "pie";
  indexAxis: "x" | "y";
} {
  if (type === "horizontalBar") {
    return { resolvedType: "bar", indexAxis: "y" };
  }

  if (type === "line" || type === "bar" || type === "doughnut" || type === "pie") {
    return { resolvedType: type, indexAxis: "x" };
  }

  return { resolvedType: "line", indexAxis: "x" };
}

export default function AppChartsClient({ charts }: { charts: AppChart[] }) {
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);

  useEffect(() => {
    let alive = true;
    const instances: Array<{ destroy: () => void }> = [];

    const mountCharts = async () => {
      const chartModule = await import("chart.js/auto");
      if (!alive) return;
      const Chart = chartModule.default;

      charts.forEach((chart, chartIndex) => {
        const canvas = canvasRefs.current[chartIndex];
        if (!canvas || !chart.labels?.length || !chart.datasets?.length) return;

        const { resolvedType, indexAxis } = normalizeChartType(chart.type);
        const normalizedDatasets = chart.datasets
          .map((dataset) => {
            const color = dataset.color || "#1a1a1a";
            const data = Array.isArray(dataset.data)
              ? dataset.data.filter((value) => Number.isFinite(value))
              : [];
            if (data.length === 0) return null;

            return {
              label: dataset.label || "",
              data,
              borderColor: color,
              backgroundColor:
                resolvedType === "line"
                  ? hexToRgba(color, 0.08)
                  : resolvedType === "doughnut" || resolvedType === "pie"
                    ? buildPiePalette(color)
                    : hexToRgba(color, 0.2),
              borderWidth: resolvedType === "line" ? 2 : 1,
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
              legend: {
                display: chart.datasets.length > 1,
                position: "top",
                labels: {
                  boxWidth: 10,
                  padding: 12,
                  font: { size: 10 },
                },
              },
            },
            scales:
              resolvedType === "doughnut" || resolvedType === "pie"
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
        {charts.map((chart, chartIndex) => (
          <div key={`${chart.title}-${chartIndex}`} className="bg-tag rounded-[16px] p-[12px]">
            <p className="font-bold text-[15px] leading-[1.2]">{chart.title || `Chart ${chartIndex + 1}`}</p>
            {chart.subtitle ? (
              <p className="text-[12px] text-caption mt-[4px]">{chart.subtitle}</p>
            ) : null}
            <div className="relative h-[220px] mt-[10px]">
              <canvas
                ref={(node) => {
                  canvasRefs.current[chartIndex] = node;
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
