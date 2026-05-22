"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import type {
  PriceOverviewProductSeries,
  PriceOverviewSupplierSeries,
} from "../types";
import { PriceTrendChart } from "./price-trend-chart";

const DEFAULT_TIME_RANGE = "1m";

type TimeRangeValue = "1m" | "3m" | "year";

export function ProductTrendCard({ product }: { product: PriceOverviewProductSeries }) {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>(DEFAULT_TIME_RANGE);
  const [selectedYear, setSelectedYear] = useState("");

  const allQuotedAtValues = useMemo(
    () => product.supplierSeries.flatMap((series) => series.points.map((point) => point.quotedAt)),
    [product.supplierSeries],
  );

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        allQuotedAtValues
          .map((value) => new Date(value))
          .filter((value) => !Number.isNaN(value.getTime()))
          .map((value) => value.getFullYear()),
      ),
    ).sort((left, right) => right - left);
  }, [allQuotedAtValues]);

  const latestQuotedAt = useMemo(() => {
    const timestamps = allQuotedAtValues
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value));

    return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;
  }, [allQuotedAtValues]);

  const resolvedSelectedYear = useMemo(() => {
    if (availableYears.length === 0) {
      return "";
    }

    return availableYears.includes(Number(selectedYear)) ? selectedYear : String(availableYears[0]);
  }, [availableYears, selectedYear]);

  const timeWindow = useMemo(() => {
    if (!latestQuotedAt) {
      return null;
    }

    const latest = new Date(latestQuotedAt);

    if (timeRange === "year") {
      const year = Number(resolvedSelectedYear || latest.getFullYear());
      return {
        start: new Date(year, 0, 1, 0, 0, 0, 0),
        end: new Date(year, 11, 31, 23, 59, 59, 999),
      };
    }

    const start = new Date(latest);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - (timeRange === "3m" ? 3 : 1));

    return {
      start,
      end: latest,
    };
  }, [latestQuotedAt, resolvedSelectedYear, timeRange]);

  const filteredSupplierSeries = useMemo<PriceOverviewSupplierSeries[]>(() => {
    if (!timeWindow) {
      return [];
    }

    return product.supplierSeries
      .map((series) => ({
        ...series,
        points: series.points.filter((point) => {
          const quotedAt = new Date(point.quotedAt);
          if (Number.isNaN(quotedAt.getTime())) {
            return false;
          }

          return quotedAt >= timeWindow.start && quotedAt <= timeWindow.end;
        }),
      }))
      .filter((series) => series.points.length > 0);
  }, [product.supplierSeries, timeWindow]);

  return (
    <Card className="min-w-0 w-full max-w-full border border-border/80 bg-white/80 py-0">
      <CardHeader className="border-b border-border/70 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{product.productName}</CardTitle>
            <CardDescription>
              {product.category} · {product.unit}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{product.supplierSeries.length} 家供应商</Badge>
            <Badge variant="outline">{product.latestRows.length} 条当前有效价</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 w-full max-w-full space-y-5 py-4">
        <div className="flex min-w-0 w-full max-w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <TimeRangeButton
              active={timeRange === "1m"}
              label="最近1个月"
              onClick={() => setTimeRange("1m")}
            />
            <TimeRangeButton
              active={timeRange === "3m"}
              label="最近3个月"
              onClick={() => setTimeRange("3m")}
            />
            <TimeRangeButton
              active={timeRange === "year"}
              label="全年"
              onClick={() => setTimeRange("year")}
            />
          </div>

          {timeRange === "year" && availableYears.length > 0 ? (
            <div className="w-full max-w-36 lg:w-36">
              <NativeSelect
                value={resolvedSelectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                {availableYears.map((year) => (
                  <NativeSelectOption key={year} value={String(year)}>
                    {year} 年
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          ) : null}
        </div>

        <PriceTrendChart
          productName={product.productName}
          supplierSeries={filteredSupplierSeries}
          unit={product.unit}
          xAxisRange={timeWindow ?? undefined}
        />
      </CardContent>
    </Card>
  );
}

function TimeRangeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button size="sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {label}
    </Button>
  );
}
