"use client";

import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/request";
import { useProductMetricsQuery } from "@/features/catalog/hooks";
import type { Product } from "@/features/catalog/types";
import { useQualityMetricsQuery } from "@/features/quality-metrics/hooks";

import { useUpdateProductMetricsMutation } from "../hooks";

interface ProductMetricsDialogProps {
  product: Product;
}

export function ProductMetricsDialog({ product }: ProductMetricsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[] | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: metricsResult, isLoading: loadingMetrics, error: metricsError } =
    useQualityMetricsQuery({ pageSize: 100 });
  const {
    data: boundMetrics = [],
    isLoading: loadingBoundMetrics,
    error: boundMetricsError,
  } = useProductMetricsQuery(product.id, open);
  const updateMetrics = useUpdateProductMetricsMutation(product.id);
  const metrics = useMemo(() => metricsResult?.data ?? [], [metricsResult?.data]);
  const boundMetricIds = useMemo(
    () => boundMetrics.map((metric) => metric.id),
    [boundMetrics],
  );
  const effectiveSelectedIds = selectedIds ?? boundMetricIds;
  const loading = loadingMetrics || loadingBoundMetrics;
  const queryError = metricsError ?? boundMetricsError;
  const errorMessage = serverError ?? (queryError instanceof Error ? queryError.message : null);

  const selectedCount = effectiveSelectedIds.length;
  const selectedNames = useMemo(
    () =>
      metrics
        .filter((metric) => effectiveSelectedIds.includes(metric.id))
        .map((metric) => metric.name)
        .join("、"),
    [effectiveSelectedIds, metrics],
  );

  function toggleMetric(metricId: number, checked: boolean) {
    setSelectedIds((current) => {
      const currentIds = current ?? boundMetricIds;
      if (checked) {
        return currentIds.includes(metricId) ? currentIds : [...currentIds, metricId];
      }

      return currentIds.filter((id) => id !== metricId);
    });
  }

  async function handleSave() {
    setServerError(null);

    try {
      await updateMetrics.mutateAsync(effectiveSelectedIds);
      setOpen(false);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : "保存失败");
    }
  }

  return (
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          setServerError(null);
          if (!nextOpen) {
            setSelectedIds(null);
          }
        }}
      >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>绑定指标</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>绑定指标</DialogTitle>
          <DialogDescription>
            为“{product.name}”维护可用的质量指标，保存后会覆盖当前绑定结果。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-[9.6px] border border-border/80 bg-white/80 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-border/80 px-2 py-1 text-xs text-muted-foreground">
              分类：{product.category}
            </span>
            <span className="rounded-full border border-border/80 px-2 py-1 text-xs text-muted-foreground">
              单位：{product.unit}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            已选择 {selectedCount} 个指标
            {selectedNames ? `：${selectedNames}` : "。"}
          </p>
        </div>

        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

        {loading ? (
          <div className="space-y-2">
            <div className="h-14 rounded-[9.6px] border border-dashed border-border/80 bg-muted/40" />
            <div className="h-14 rounded-[9.6px] border border-dashed border-border/80 bg-muted/40" />
            <div className="h-14 rounded-[9.6px] border border-dashed border-border/80 bg-muted/40" />
          </div>
        ) : metrics.length > 0 ? (
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {metrics.map((metric) => {
              const checked = effectiveSelectedIds.includes(metric.id);

              return (
                <label
                  key={metric.id}
                  className="flex cursor-pointer items-start gap-3 rounded-[9.6px] border border-border/80 bg-vellum-white px-4 py-3 transition-colors hover:border-foreground/20 hover:bg-white"
                >
                  <input
                    checked={checked}
                    className="mt-1 size-4 rounded border-border text-foreground accent-foreground"
                    type="checkbox"
                    onChange={(event) => toggleMetric(metric.id, event.target.checked)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{metric.name}</p>
                      <span className="rounded-full border border-border/80 px-2 py-1 text-xs text-muted-foreground">
                        {metric.unit}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {metric.description || "未填写指标说明"}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[9.6px] border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            还没有可绑定的指标定义，请先在“指标定义”页签中新增指标。
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button type="button" disabled={loading || updateMetrics.isPending} onClick={handleSave}>
            {updateMetrics.isPending ? "保存中..." : "保存绑定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
