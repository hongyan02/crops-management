"use client";

import { type ReactElement, useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import type { Product } from "@/features/catalog/types";
import { cn } from "@/lib/utils";

import type { PartnerKind } from "../types";

type PartnerProductSelectorDialogProps = {
  kind: PartnerKind;
  partnerName: string;
  products: Product[];
  selectedIds: number[];
  loading: boolean;
  saving: boolean;
  errorMessage: string | null;
  open: boolean;
  trigger?: ReactElement;
  onOpenChange: (open: boolean) => void;
  onToggleProduct: (productId: number, checked: boolean) => void;
  onSave: () => void;
};

const labels = {
  supplier: {
    noun: "供应商",
    description: "维护该供应商可供应的产品，后续可在产品下录入多次质检结果。",
    empty: "还没有产品可绑定，请先在基础信息中新增产品。",
  },
  buyer: {
    noun: "采购商",
    description: "维护该采购商需要的产品，后续可在产品下维护质量标准。",
    empty: "还没有产品可绑定，请先在基础信息中新增产品。",
  },
} satisfies Record<PartnerKind, { noun: string; description: string; empty: string }>;

const MAX_VISIBLE_TAGS = 5;
type PartnerProductSelectorContentProps = Omit<PartnerProductSelectorDialogProps, "kind" | "open" | "trigger"> & {
  copy: (typeof labels)[PartnerKind];
};

export function PartnerProductSelectorDialog({
  kind,
  partnerName,
  products,
  selectedIds,
  loading,
  saving,
  errorMessage,
  open,
  trigger,
  onOpenChange,
  onToggleProduct,
  onSave,
}: PartnerProductSelectorDialogProps) {
  const copy = labels[kind];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger ?? <Button size="sm" variant="outline" />}>产品</DialogTrigger>
      {open ? (
        <PartnerProductSelectorContent
          copy={copy}
          errorMessage={errorMessage}
          loading={loading}
          onOpenChange={onOpenChange}
          onSave={onSave}
          onToggleProduct={onToggleProduct}
          partnerName={partnerName}
          products={products}
          saving={saving}
          selectedIds={selectedIds}
        />
      ) : null}
    </Dialog>
  );
}

function PartnerProductSelectorContent({
  copy,
  partnerName,
  products,
  selectedIds,
  loading,
  saving,
  errorMessage,
  onOpenChange,
  onToggleProduct,
  onSave,
}: PartnerProductSelectorContentProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedProducts = useMemo(
    () => products.filter((product) => selectedIdSet.has(product.id)),
    [products, selectedIdSet],
  );
  const filteredProducts = useMemo(() => {
    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.category, product.unit].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [normalizedSearch, products]);
  const visibleCategories = useMemo(
    () => [...new Set(filteredProducts.map((product) => product.category))],
    [filteredProducts],
  );
  const selectedPreview = selectedProducts.slice(0, MAX_VISIBLE_TAGS);
  const hiddenSelectedCount = Math.max(0, selectedProducts.length - selectedPreview.length);
  const categorySummary =
    visibleCategories.length === 0
      ? normalizedSearch
        ? "未匹配分类"
        : "—"
      : visibleCategories.length === 1
        ? visibleCategories[0]
        : `${visibleCategories[0]} 等 ${visibleCategories.length} 类`;

  return (
    <DialogContent className="max-w-3xl overflow-hidden border-border/80 bg-vellum-white p-0 shadow-[0_28px_80px_-42px_rgba(20,20,19,0.35)]">
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <DialogHeader className="gap-2">
          <DialogTitle>维护{copy.noun}产品</DialogTitle>
          <DialogDescription>
            {copy.description} 当前对象：“{partnerName}”。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-[9.6px] border border-border/80 bg-white/78 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            <span className="font-medium">已选择 {selectedIds.length} 个产品</span>
            {selectedPreview.length > 0 ? (
              <>
                <span className="text-muted-foreground">:</span>
                {selectedPreview.map((product) => (
                  <span
                    className="inline-flex items-center rounded-md border border-border/80 bg-vellum-white px-2.5 py-1 text-xs text-foreground"
                    key={product.id}
                  >
                    {product.name}
                  </span>
                ))}
                {hiddenSelectedCount > 0 ? (
                  <span className="text-xs text-muted-foreground">+{hiddenSelectedCount} 个</span>
                ) : null}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">尚未选择产品</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 rounded-[9.6px] bg-white pl-9"
              placeholder="搜索产品名称、分类或单位..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="rounded-full border border-border/80 bg-white/70 px-3 py-2 text-xs text-muted-foreground">
            所属分类：<span className="text-foreground">{categorySummary}</span>
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        {loading ? (
          <div className="overflow-hidden rounded-[12px] border border-border/80 bg-white/75">
            <div className="grid grid-cols-1 gap-px bg-border/80 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="h-[4.5rem] bg-muted/35 px-4 py-3" key={index} />
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          filteredProducts.length > 0 ? (
            <div className="overflow-hidden rounded-[12px] border border-border/80 bg-white/75">
              <div className="max-h-[320px] overflow-y-auto">
                <div className="grid grid-cols-1 gap-px bg-border/80 sm:grid-cols-2">
                  {filteredProducts.map((product) => {
                    const checked = selectedIdSet.has(product.id);

                    return (
                      <label
                        className={cn(
                          "flex min-h-[4.5rem] cursor-pointer items-center gap-3 bg-vellum-white/78 px-4 py-3 transition-colors hover:bg-white",
                          checked && "bg-white",
                        )}
                        key={product.id}
                      >
                        <input
                          checked={checked}
                          className="size-4 shrink-0 rounded border-border accent-foreground"
                          type="checkbox"
                          onChange={(event) => onToggleProduct(product.id, event.target.checked)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {product.name}
                              </p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {product.category}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-border/80 bg-white/80 px-2 py-1 text-xs text-muted-foreground">
                              {product.unit}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-border/80 bg-white/50 px-4 py-8 text-center text-sm text-muted-foreground">
              没有匹配“{search.trim()}”的产品，请调整关键词后重试。
            </div>
          )
        ) : (
          <div className="rounded-[12px] border border-dashed border-border/80 bg-white/50 px-4 py-8 text-center text-sm text-muted-foreground">
            {copy.empty}
          </div>
        )}

        <DialogFooter className="pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={loading || saving} type="button" onClick={onSave}>
            {saving ? "保存中..." : "保存产品"}
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  );
}
