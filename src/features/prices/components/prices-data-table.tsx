"use client";

import { useDeferredValue, useMemo, useState } from "react";

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

import { usePricesQuery } from "../hooks";
import { formatDateTime, formatPrice } from "../formatters";
import type { PriceListMeta } from "../types";
import { PriceFormDialog } from "./price-form-dialog";
import { PriceHistoryDialog } from "./price-history-dialog";

const PAGE_SIZE = 10;
type SupplierFilterValue = "all" | `${number}`;

export function PricesDataTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState<SupplierFilterValue>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const deferredSearch = useDeferredValue(search.trim());

  const pricesQuery = usePricesQuery({
    search: deferredSearch || undefined,
    supplierId: selectedSupplierId === "all" ? undefined : Number(selectedSupplierId),
    category: selectedCategory === "all" ? undefined : selectedCategory,
    page,
    pageSize: PAGE_SIZE,
  });
  const suppliersQuery = useSuppliersQuery({ page: 1, pageSize: 200 });

  const rows = pricesQuery.data?.data ?? [];
  const meta = pricesQuery.data?.meta as PriceListMeta | undefined;
  const pagination = meta?.pagination;
  const categories = useMemo(() => meta?.filterOptions?.categories ?? [], [meta?.filterOptions?.categories]);
  const suppliers = useMemo(() => suppliersQuery.data?.data ?? [], [suppliersQuery.data?.data]);

  const supplierFilterLabel =
    selectedSupplierId === "all"
      ? "全部供应商"
      : suppliers.find((supplier) => supplier.id === Number(selectedSupplierId))?.name ?? "全部供应商";
  const categoryFilterLabel = selectedCategory === "all" ? "全部品类" : selectedCategory;

  const supplierOptions = useMemo(
    () => [
      { label: "全部供应商", value: "all" },
      ...suppliers.map((supplier) => ({
        label: supplier.name,
        value: `${supplier.id}` as SupplierFilterValue,
      })),
    ],
    [suppliers],
  );

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <DashboardListSearchInput
            placeholder="搜索产品、品类或供应商..."
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <DashboardListFilterDropdown
            label={supplierFilterLabel}
            options={supplierOptions}
            title="供应商"
            value={selectedSupplierId}
            onValueChange={(value) => {
              setSelectedSupplierId(value as SupplierFilterValue);
              setPage(1);
            }}
          />
          <DashboardListFilterDropdown
            label={categoryFilterLabel}
            options={categoryOptions}
            title="产品类型"
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value);
              setPage(1);
            }}
          />
          <PriceFormDialog />
        </div>
      </div>

      <DashboardTableSurface scrollable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-44">产品名称</TableHead>
              <TableHead className="min-w-32">供应商</TableHead>
              <TableHead className="min-w-28">品类</TableHead>
              <TableHead className="min-w-20">单位</TableHead>
              <TableHead className="min-w-28">最新价格</TableHead>
              <TableHead className="min-w-40">报价时间</TableHead>
              <TableHead className="min-w-56">备注</TableHead>
              <TableHead className="min-w-44">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricesQuery.isLoading ? (
              <DashboardTableMessageRow colSpan={8} label="正在加载价格数据..." />
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={`${row.supplierId}:${row.productId}`}>
                  <TableCell className="font-medium text-foreground">{row.productName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.supplierName}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.category}</TableCell>
                  <TableCell className="text-muted-foreground">{row.unit}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {formatPrice(row.latestPrice)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(row.quotedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.note?.trim() ? row.note : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <PriceFormDialog
                        allowSupplierSelection={false}
                        allowProductSelection={false}
                        defaultProductId={row.productId}
                        defaultProductName={row.productName}
                        defaultSupplierId={row.supplierId}
                        trigger={<Button size="sm" variant="outline" />}
                        triggerLabel="录入价格"
                      />
                      <PriceHistoryDialog
                        productId={row.productId}
                        productName={row.productName}
                        supplierId={row.supplierId}
                        supplierName={row.supplierName}
                        trigger={<Button size="sm" variant="outline" />}
                        triggerLabel="历史报价"
                        unit={row.unit}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <DashboardTableMessageRow colSpan={8} label="当前筛选条件下没有可展示的价格数据" />
            )}
          </TableBody>
        </Table>
      </DashboardTableSurface>

      <DashboardListPagination
        isFetching={pricesQuery.isFetching}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
