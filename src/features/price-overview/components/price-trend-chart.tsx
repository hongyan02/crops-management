"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import type { EChartsOption, EChartsType } from "echarts";

import type { PriceOverviewSupplierSeries } from "../types";
import { formatPrice } from "@/features/prices/formatters";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
});

const SUPPLIER_COLOR_PALETTE = [
  "#141413",
  "#7b4b2a",
  "#2f6f62",
  "#8a3b5c",
  "#4b5f8c",
  "#9a6a18",
  "#586b41",
  "#6f4f7d",
];

type PriceTrendChartProps = {
  productName: string;
  unit: string;
  supplierSeries: PriceOverviewSupplierSeries[];
  xAxisRange?: {
    start: Date;
    end: Date;
  };
};

export function PriceTrendChart({
  productName,
  unit,
  supplierSeries,
  xAxisRange,
}: PriceTrendChartProps) {
  const chartInstanceRef = useRef<EChartsType | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!wrapperRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeChart = () => {
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        chartInstanceRef.current?.resize({
          width: "auto",
          height: "auto",
        });
        resizeFrameRef.current = null;
      });
    };

    const observer = new ResizeObserver(() => {
      resizeChart();
    });

    observer.observe(wrapperRef.current);
    resizeChart();

    return () => {
      observer.disconnect();

      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const yAxisRange = getPriceAxisRange(supplierSeries);

    return {
      animationDuration: 400,
      grid: {
        left: 28,
        right: 36,
        top: 56,
        bottom: 24,
        containLabel: true,
      },
      legend: {
        top: 14,
        left: 12,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          color: "#3d3d3a",
          fontSize: 12,
        },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#fffdf8",
        borderColor: "#dedcd1",
        textStyle: {
          color: "#141413",
        },
        valueFormatter: (value) =>
          typeof value === "number" ? `${formatPrice(value)} / ${unit}` : `${value ?? "—"}`,
      },
      xAxis: {
        type: "time",
        boundaryGap: ["6%", "6%"],
        min: xAxisRange?.start.getTime(),
        max: xAxisRange?.end.getTime(),
        axisLabel: {
          color: "#73726c",
        },
        axisLine: {
          lineStyle: {
            color: "#dedcd1",
          },
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        min: yAxisRange.min,
        max: yAxisRange.max,
        interval: yAxisRange.interval,
        axisLabel: {
          color: "#73726c",
          formatter: (value: number) => formatPrice(value),
        },
        splitLine: {
          lineStyle: {
            color: "rgba(222, 220, 209, 0.7)",
          },
        },
      },
      series: supplierSeries.map((series) => ({
        name: series.supplierName,
        type: "line",
        color: getSupplierColor(series.supplierName),
        lineStyle: {
          width: 3,
          color: getSupplierColor(series.supplierName),
        },
        itemStyle: {
          color: getSupplierColor(series.supplierName),
          borderColor: "#141413",
          borderWidth: 1.5,
        },
        smooth: false,
        showSymbol: true,
        symbolSize: 8,
        clip: false,
        emphasis: {
          focus: "series",
        },
        data: series.points.map((point) => [point.quotedAt, point.price]),
      })),
      aria: {
        enabled: true,
        description: `${productName} 多供应商价格走势`,
      },
    };
  }, [productName, supplierSeries, unit, xAxisRange]);

  if (supplierSeries.length === 0) {
    return (
      <div className="rounded-[9.6px] border border-dashed border-border/80 bg-muted/20 px-4 py-12 text-sm text-muted-foreground">
        当前没有可展示的趋势数据。
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full overflow-hidden">
      <div className="min-w-0 w-full max-w-full overflow-hidden" ref={wrapperRef}>
        <ReactECharts
          autoResize={false}
          notMerge
          onChartReady={(instance) => {
            chartInstanceRef.current = instance;
            instance.resize();
          }}
          option={option}
          style={{ height: 320, width: "100%", maxWidth: "100%" }}
        />
      </div>
    </div>
  );
}

function getPriceAxisRange(supplierSeries: PriceOverviewSupplierSeries[]) {
  const prices = supplierSeries.flatMap((series) => series.points.map((point) => point.price));

  if (prices.length === 0) {
    return {
      min: 0,
      max: 100,
      interval: 20,
    };
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const spread = maxPrice - minPrice;

  if (spread === 0) {
    const step = minPrice >= 1000 ? 50 : 10;

    return {
      min: Math.max(0, roundDown(minPrice - step, step)),
      max: roundUp(maxPrice + step, step),
      interval: step / 2,
    };
  }

  if (spread < 50) {
    const step = 10;
    return {
      min: Math.max(0, roundDown(minPrice - 10, step)),
      max: roundUp(maxPrice + 10, step),
      interval: step,
    };
  }

  if (spread < 150) {
    const step = 25;
    return {
      min: Math.max(0, roundDown(minPrice - 25, step)),
      max: roundUp(maxPrice + 25, step),
      interval: step,
    };
  }

  const step = 50;
  return {
    min: Math.max(0, roundDown(minPrice - 50, step)),
    max: roundUp(maxPrice + 50, step),
    interval: step,
  };
}

function roundDown(value: number, step: number) {
  return Math.floor(value / step) * step;
}

function roundUp(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

function getSupplierColor(supplierName: string) {
  const hash = Array.from(supplierName).reduce((total, char) => total + char.charCodeAt(0), 0);
  return SUPPLIER_COLOR_PALETTE[hash % SUPPLIER_COLOR_PALETTE.length];
}
