"use client";

import { useState } from "react";

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
import { useProductMetricsQuery } from "@/features/catalog/hooks";
import type { Product } from "@/features/catalog/types";

interface ProductDetailDialogProps {
  product: Product;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ProductDetailDialog({ product }: ProductDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: metrics = [], error, isLoading } = useProductMetricsQuery(product.id, open);
  const serverError = error instanceof Error ? error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>详细</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>查看产品基础信息及当前已绑定的质量指标。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[9.6px] border border-border/80 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">产品编号</p>
            <p className="mt-2 text-sm font-medium text-foreground">{product.id}</p>
          </div>
          <div className="rounded-[9.6px] border border-border/80 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">分类</p>
            <p className="mt-2 text-sm font-medium text-foreground">{product.category}</p>
          </div>
          <div className="rounded-[9.6px] border border-border/80 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">计量单位</p>
            <p className="mt-2 text-sm font-medium text-foreground">{product.unit}</p>
          </div>
          <div className="rounded-[9.6px] border border-border/80 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">创建时间</p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {formatDateTime(product.createdAt)}
            </p>
          </div>
        </div>

        <section className="rounded-[9.6px] border border-border/80 bg-white/76 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">已绑定指标</h3>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "正在加载指标..." : `当前共 ${metrics.length} 个`}
              </p>
            </div>
          </div>

          {serverError ? (
            <p className="mt-4 text-sm text-destructive">{serverError}</p>
          ) : isLoading ? (
            <div className="mt-4 space-y-2">
              <div className="h-16 rounded-[9.6px] border border-dashed border-border/80 bg-muted/40" />
              <div className="h-16 rounded-[9.6px] border border-dashed border-border/80 bg-muted/40" />
            </div>
          ) : metrics.length > 0 ? (
            <div className="mt-4 space-y-3">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-[9.6px] border border-border/70 bg-vellum-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{metric.name}</p>
                      <p className="text-xs text-muted-foreground">
                        单位：{metric.unit}
                        {metric.description ? ` · ${metric.description}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-border/80 px-2 py-1 text-xs text-muted-foreground">
                      ID {metric.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[9.6px] border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              当前产品还未绑定任何质量指标。
            </div>
          )}
        </section>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
