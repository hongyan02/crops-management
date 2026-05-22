"use client";

import { useState } from "react";

import {
  DashboardListPagination,
  DashboardListSearchInput,
  DashboardTableMessageRow,
  DashboardTableSurface,
} from "@/components/dashboard/data-table-controls";
import { useProductsQuery } from "@/features/catalog/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductDetailDialog } from "./product-detail-dialog";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductMetricsDialog } from "./product-metrics-dialog";
import type { PaginationMeta } from "@/lib/pagination";

const PAGE_SIZE = 10;

export function ProductsDataTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const productsQuery = useProductsQuery({
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const products = productsQuery.data?.data ?? [];
  const pagination = productsQuery.data?.meta?.pagination as PaginationMeta["pagination"] | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DashboardListSearchInput
          className="max-w-sm"
          placeholder="搜索产品名称或分类..."
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <ProductFormDialog />
      </div>

      <DashboardTableSurface className="bg-white/76">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>产品名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsQuery.isLoading ? (
              <DashboardTableMessageRow colSpan={5} label="加载中..." />
            ) : products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="text-muted-foreground">{product.id}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ProductDetailDialog product={product} />
                      <ProductMetricsDialog product={product} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <DashboardTableMessageRow colSpan={5} label="暂无产品数据" />
            )}
          </TableBody>
        </Table>
      </DashboardTableSurface>

      <DashboardListPagination
        isFetching={productsQuery.isFetching}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
