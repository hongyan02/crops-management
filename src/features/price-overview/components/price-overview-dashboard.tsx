"use client";

import { useDeferredValue, useMemo, useState } from "react";

import {
  DashboardListFilterDropdown,
  DashboardListSearchInput,
} from "@/components/dashboard/data-table-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PriceFormDialog } from "@/features/prices/components/price-form-dialog";

import { usePriceOverviewQuery } from "../hooks";
import type {
  PriceOverviewMeta,
} from "../types";
import { ProductTrendCard } from "./product-trend-card";

const DEFAULT_TAB = "trend";

export function PriceOverviewDashboard() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const deferredSearch = useDeferredValue(search.trim());

  const overviewQuery = usePriceOverviewQuery({
    search: deferredSearch || undefined,
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const data = overviewQuery.data?.data;
  const meta = overviewQuery.data?.meta as PriceOverviewMeta | undefined;
  const products = data?.products ?? [];
  const categories = useMemo(
    () => meta?.filterOptions?.categories ?? [],
    [meta?.filterOptions?.categories],
  );
  const categoryFilterLabel = selectedCategory === "all" ? "全部品类" : selectedCategory;

  const categoryOptions = useMemo(
    () => [
      { label: "全部品类", value: "all" },
      ...categories.map((category) => ({
        label: category,
        value: category,
      })),
    ],
    [categories],
  );

  return (
    <Tabs defaultValue={DEFAULT_TAB}>
      <div className="flex min-w-0 w-full max-w-full flex-col gap-4">
        <TabsList>
          <TabsTrigger value={DEFAULT_TAB}>产品价格趋势</TabsTrigger>
        </TabsList>

        <TabsContent
          className="mt-0 flex min-w-0 w-full max-w-full flex-col gap-4"
          value={DEFAULT_TAB}
        >
          <div className="flex min-w-0 w-full max-w-full flex-col gap-3 lg:flex-row lg:items-center">
            <DashboardListSearchInput
              placeholder="搜索产品名称或品类..."
              value={search}
              onValueChange={setSearch}
            />

            <div className="flex flex-wrap items-center justify-end gap-2">
              <DashboardListFilterDropdown
                label={categoryFilterLabel}
                options={categoryOptions}
                title="产品类型"
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              />
              <PriceFormDialog />
            </div>
          </div>

          {overviewQuery.isLoading ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
              正在加载价格看板...
            </div>
          ) : products.length > 0 ? (
            <div className="min-w-0 w-full max-w-full space-y-4">
              {products.map((product) => (
                <ProductTrendCard key={product.productId} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
              当前筛选条件下没有可展示的产品价格趋势。
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
