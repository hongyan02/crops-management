"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { ChevronDown, Search } from "lucide-react";

import {
  productMetricsQueryOptions,
  type ProductMetric,
} from "@/features/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useSuppliersQuery } from "../hooks";
import { supplierProductsQueryOptions, supplierQualityQueryOptions } from "../queries";
import type { Supplier, SupplierProduct, SupplierQualityRecord } from "../types";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { SupplierQualityDialog } from "./supplier-quality-dialog";
import { SuppliersDataTable } from "./suppliers-data-table";

type SupplierFilterValue = "all" | `${number}`;

type QualityOverviewRow = {
  supplier: Supplier;
  product: SupplierProduct;
};

const SUPPLIER_FETCH_SIZE = 200;
const DEFAULT_TAB = "quality";

export function SuppliersWorkbench() {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [search, setSearch] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<SupplierFilterValue>("all");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const suppliersQuery = useSuppliersQuery({ page: 1, pageSize: SUPPLIER_FETCH_SIZE });
  const suppliersData = suppliersQuery.data?.data;
  const suppliers = useMemo(() => suppliersData ?? [], [suppliersData]);

  const supplierProductQueries = useQueries({
    queries: suppliers.map((supplier) => supplierProductsQueryOptions(supplier.id, true)),
  });

  const supplierProductsMap = useMemo(() => {
    const map = new Map<number, SupplierProduct[]>();

    for (const [index, supplier] of suppliers.entries()) {
      map.set(supplier.id, supplierProductQueries[index]?.data ?? []);
    }

    return map;
  }, [supplierProductQueries, suppliers]);

  const supplierScopedRows = useMemo<QualityOverviewRow[]>(() => {
    return suppliers.flatMap((supplier) => {
      if (selectedSupplierId !== "all" && supplier.id !== Number(selectedSupplierId)) {
        return [];
      }

      return (supplierProductsMap.get(supplier.id) ?? []).map((product) => ({
        supplier,
        product,
      }));
    });
  }, [selectedSupplierId, supplierProductsMap, suppliers]);

  const categories = useMemo(() => {
    const set = new Set<string>();

    for (const row of supplierScopedRows) {
      set.add(row.product.category);
    }

    return ["全部", ...Array.from(set).sort((left, right) => left.localeCompare(right, "zh-CN"))];
  }, [supplierScopedRows]);

  const resolvedCategory = categories.includes(selectedCategory) ? selectedCategory : "全部";

  const preSearchRows = useMemo(
    () =>
      supplierScopedRows.filter(
        (row) => resolvedCategory === "全部" || row.product.category === resolvedCategory,
      ),
    [resolvedCategory, supplierScopedRows],
  );

  const preSearchProductIds = useMemo(
    () => Array.from(new Set(preSearchRows.map((row) => row.product.id))),
    [preSearchRows],
  );

  const productMetricQueries = useQueries({
    queries: preSearchProductIds.map((productId) => productMetricsQueryOptions(productId, true)),
  });

  const productMetricsMap = useMemo(() => {
    const map = new Map<number, ProductMetric[]>();

    for (const [index, productId] of preSearchProductIds.entries()) {
      map.set(productId, productMetricQueries[index]?.data ?? []);
    }

    return map;
  }, [preSearchProductIds, productMetricQueries]);

  const visibleRows = useMemo(() => {
    const rows = preSearchRows.filter((row) => {
      if (!deferredSearch) {
        return true;
      }

      const metrics = productMetricsMap.get(row.product.id) ?? [];

      return (
        row.product.name.toLowerCase().includes(deferredSearch) ||
        row.product.category.toLowerCase().includes(deferredSearch) ||
        row.supplier.name.toLowerCase().includes(deferredSearch) ||
        metrics.some((metric) => metric.name.toLowerCase().includes(deferredSearch))
      );
    });

    return rows.sort((left, right) => {
      const nameCompare = left.product.name.localeCompare(right.product.name, "zh-CN");
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return left.supplier.name.localeCompare(right.supplier.name, "zh-CN");
    });
  }, [deferredSearch, preSearchRows, productMetricsMap]);

  const dynamicMetrics = useMemo(() => {
    const map = new Map<number, ProductMetric>();

    for (const row of visibleRows) {
      for (const metric of productMetricsMap.get(row.product.id) ?? []) {
        if (!map.has(metric.id)) {
          map.set(metric.id, metric);
        }
      }
    }

    return Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  }, [productMetricsMap, visibleRows]);

  const qualityQueries = useQueries({
    queries: visibleRows.map((row) =>
      supplierQualityQueryOptions(row.supplier.id, row.product.id, activeTab === DEFAULT_TAB),
    ),
  });

  const qualityRecordsMap = useMemo(() => {
    const map = new Map<string, SupplierQualityRecord[]>();

    for (const [index, row] of visibleRows.entries()) {
      const records = qualityQueries[index]?.data ?? [];
      const sortedRecords = [...records].sort(
        (left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt),
      );
      map.set(getRowKey(row.supplier.id, row.product.id), sortedRecords);
    }

    return map;
  }, [qualityQueries, visibleRows]);

  const loadingProducts =
    suppliersQuery.isLoading ||
    supplierProductQueries.some((query) => query.isLoading || query.isFetching);
  const loadingMetrics =
    activeTab === DEFAULT_TAB &&
    productMetricQueries.some((query) => query.isLoading || query.isFetching);
  const loadingQuality =
    activeTab === DEFAULT_TAB &&
    qualityQueries.some((query) => query.isLoading || query.isFetching);

  const supplierFilterLabel =
    selectedSupplierId === "all"
      ? "全部供应商"
      : suppliers.find((supplier) => supplier.id === Number(selectedSupplierId))?.name ?? "全部供应商";

  if (suppliersQuery.isLoading) {
    return <SuppliersWorkbenchSkeleton />;
  }

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Tabs defaultValue={DEFAULT_TAB}>
          <TabsList>
            <TabsTrigger value="quality">产品质量总览</TabsTrigger>
            <TabsTrigger value="management">供应商信息管理</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          当前还没有供应商数据。
        </div>
        <div className="flex items-center gap-3">
          <SupplierFormDialog />
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="quality">产品质量总览</TabsTrigger>
          <TabsTrigger value="management">供应商信息管理</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-0 flex flex-col gap-4" value="quality">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="输入商品名、供应商或指标关键词过滤..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label={supplierFilterLabel}
                title="供应商"
                value={selectedSupplierId}
                options={[
                  { label: "全部供应商", value: "all" },
                  ...suppliers.map((supplier) => ({
                    label: supplier.name,
                    value: `${supplier.id}` as SupplierFilterValue,
                  })),
                ]}
                onValueChange={(value) => setSelectedSupplierId(value as SupplierFilterValue)}
              />
              <FilterDropdown
                label={resolvedCategory === "全部" ? "全部品类" : resolvedCategory}
                title="产品类型"
                value={resolvedCategory}
                options={categories.map((category) => ({
                  label: category === "全部" ? "全部品类" : category,
                  value: category,
                }))}
                onValueChange={(value) => setSelectedCategory(value)}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/80 bg-white/80">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-44">产品名称</TableHead>
                    <TableHead className="min-w-32">供应商</TableHead>
                    <TableHead className="min-w-28">品类</TableHead>
                    {dynamicMetrics.map((metric) => (
                      <TableHead className="min-w-32" key={metric.id}>
                        {metric.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingProducts || loadingMetrics || loadingQuality ? (
                    <TableLoadingRow colSpan={Math.max(3 + dynamicMetrics.length, 4)} />
                  ) : visibleRows.length > 0 ? (
                    visibleRows.map((row) => {
                      const rowKey = getRowKey(row.supplier.id, row.product.id);
                      const latestRecordsByMetric = buildLatestRecordMap(
                        qualityRecordsMap.get(rowKey) ?? [],
                      );

                      return (
                        <TableRow key={rowKey}>
                          <TableCell>
                            <SupplierQualityDialog
                              defaultProductId={row.product.id}
                              supplier={row.supplier}
                              trigger={
                                <Button
                                  className="h-auto px-0 text-left text-sm font-medium text-foreground hover:bg-transparent hover:text-foreground hover:underline"
                                  size="sm"
                                  variant="ghost"
                                />
                              }
                              triggerLabel={row.product.name}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{row.supplier.name}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.product.category}
                          </TableCell>
                          {dynamicMetrics.map((metric) => (
                            <TableCell className="font-medium text-foreground" key={metric.id}>
                              {latestRecordsByMetric.get(metric.id)?.value ?? "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableEmptyRow
                      colSpan={Math.max(3 + dynamicMetrics.length, 4)}
                      label="当前筛选条件下没有可展示的质量数据"
                    />
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent className="mt-0" value="management">
          <SuppliersDataTable />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function FilterDropdown({
  title,
  label,
  value,
  options,
  onValueChange,
}: {
  title: string;
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onValueChange: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
        {label}
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SuppliersWorkbenchSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-72 rounded-lg" />
      <Skeleton className="h-9 w-64 rounded-lg" />
      <div className="flex flex-col gap-3 lg:flex-row">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <Skeleton className="h-[520px] rounded-xl" />
    </div>
  );
}

function TableLoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell className="h-24 text-center text-muted-foreground" colSpan={colSpan}>
        正在加载质量数据...
      </TableCell>
    </TableRow>
  );
}

function TableEmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell className="h-24 text-center text-muted-foreground" colSpan={colSpan}>
        {label}
      </TableCell>
    </TableRow>
  );
}

function buildLatestRecordMap(records: SupplierQualityRecord[]) {
  const map = new Map<number, SupplierQualityRecord>();

  for (const record of records) {
    if (!map.has(record.metricId)) {
      map.set(record.metricId, record);
    }
  }

  return map;
}

function getRowKey(supplierId: number, productId: number) {
  return `${supplierId}:${productId}`;
}
