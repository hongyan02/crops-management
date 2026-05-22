"use client";

import { useDeferredValue, useState } from "react";
import { Plus } from "lucide-react";

import {
  DashboardListFilterDropdown,
  DashboardListPagination,
  DashboardListSearchInput,
  DashboardTableMessageRow,
  DashboardTableSurface,
} from "@/components/dashboard/data-table-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSuppliersQuery } from "@/features/suppliers/hooks";
import { SupplierQualityDialog } from "@/features/suppliers/components/supplier-quality-dialog";

import { useQualityOverviewQuery } from "../hooks";
import type { QualityOverviewMeta } from "../types";

const PAGE_SIZE = 10;

type SupplierFilterValue = "all" | `${number}`;

export function QualityOverviewDataTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState<SupplierFilterValue>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const deferredSearch = useDeferredValue(search.trim());

  const overviewQuery = useQualityOverviewQuery({
    search: deferredSearch || undefined,
    supplierId: selectedSupplierId === "all" ? undefined : Number(selectedSupplierId),
    category: selectedCategory === "all" ? undefined : selectedCategory,
    page,
    pageSize: PAGE_SIZE,
  });
  const suppliersQuery = useSuppliersQuery({ page: 1, pageSize: 200 });

  const overview = overviewQuery.data?.data;
  const meta = overviewQuery.data?.meta as QualityOverviewMeta | undefined;
  const rows = overview?.rows ?? [];
  const metrics = overview?.metrics ?? [];
  const pagination = meta?.pagination;
  const categories = meta?.filterOptions?.categories ?? [];
  const suppliers = suppliersQuery.data?.data ?? [];

  const supplierFilterLabel =
    selectedSupplierId === "all"
      ? "全部供应商"
      : suppliers.find((supplier) => supplier.id === Number(selectedSupplierId))?.name ?? "全部供应商";

  const categoryFilterLabel = selectedCategory === "all" ? "全部品类" : selectedCategory;

  const supplierOptions = [
    { label: "全部供应商", value: "all" },
    ...suppliers.map((supplier) => ({
      label: supplier.name,
      value: `${supplier.id}` as SupplierFilterValue,
    })),
  ];

  const categoryOptions = [
    { label: "全部品类", value: "all" },
    ...categories.map((category) => ({
      label: category,
      value: category,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <DashboardListSearchInput
          placeholder="搜索产品、供应商、品类或质量指标..."
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <DashboardListFilterDropdown
            title="供应商"
            label={supplierFilterLabel}
            value={selectedSupplierId}
            options={supplierOptions}
            onValueChange={(value) => {
              setSelectedSupplierId(value as SupplierFilterValue);
              setPage(1);
            }}
          />
          <DashboardListFilterDropdown
            title="产品类型"
            label={categoryFilterLabel}
            value={selectedCategory}
            options={categoryOptions}
            onValueChange={(value) => {
              setSelectedCategory(value);
              setPage(1);
            }}
          />
          <SupplierQualityDialog
            allowSupplierSelection
            trigger={<Button size="sm" />}
            triggerLabel={
              <>
                <Plus data-icon="inline-start" />
                录入质量
              </>
            }
          />
        </div>
      </div>

      <DashboardTableSurface scrollable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-44">产品名称</TableHead>
              <TableHead className="min-w-32">供应商</TableHead>
              <TableHead className="min-w-28">品类</TableHead>
              {metrics.map((metric) => (
                <TableHead className="min-w-32" key={metric.id}>
                  {metric.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {overviewQuery.isLoading ? (
              <DashboardTableMessageRow
                colSpan={Math.max(3 + metrics.length, 4)}
                label="正在加载质量数据..."
              />
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={`${row.supplierId}:${row.productId}`}>
                  <TableCell className="font-medium text-foreground">{row.productName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.supplierName}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.category}</TableCell>
                  {metrics.map((metric) => (
                    <TableCell className="font-medium text-foreground" key={metric.id}>
                      {row.latestValues[String(metric.id)]?.value ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <DashboardTableMessageRow
                colSpan={Math.max(3 + metrics.length, 4)}
                label="当前筛选条件下没有可展示的质量数据"
              />
            )}
          </TableBody>
        </Table>
      </DashboardTableSurface>

      <DashboardListPagination
        isFetching={overviewQuery.isFetching}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
