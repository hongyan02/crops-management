"use client";

import { useState } from "react";

import {
  DashboardListPagination,
  DashboardListSearchInput,
  DashboardTableMessageRow,
  DashboardTableSurface,
} from "@/components/dashboard/data-table-controls";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaginationMeta } from "@/lib/pagination";

import { useSuppliersQuery } from "../hooks";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { SupplierProductsDialog } from "./supplier-products-dialog";

const PAGE_SIZE = 10;

export function SuppliersDataTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const suppliersQuery = useSuppliersQuery({
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const suppliers = suppliersQuery.data?.data ?? [];
  const pagination = suppliersQuery.data?.meta?.pagination as PaginationMeta["pagination"] | undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <DashboardListSearchInput
          className="max-w-sm"
          placeholder="搜索供应商名称..."
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <SupplierFormDialog />
      </div>

      <DashboardTableSurface className="bg-white/76">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>供应商名称</TableHead>
              <TableHead>联系人</TableHead>
              <TableHead>电话</TableHead>
              <TableHead>供应产品</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliersQuery.isLoading ? (
              <DashboardTableMessageRow colSpan={6} label="加载中..." />
            ) : suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="text-muted-foreground">{supplier.id}</TableCell>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.contact ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.phone ?? "—"}</TableCell>
                  <TableCell>{supplier.productCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <SupplierFormDialog
                        supplier={supplier}
                        trigger={<Button size="sm" variant="outline" />}
                      />
                      <SupplierProductsDialog supplier={supplier} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <DashboardTableMessageRow colSpan={6} label="暂无供应商数据" />
            )}
          </TableBody>
        </Table>
      </DashboardTableSurface>

      <DashboardListPagination
        isFetching={suppliersQuery.isFetching}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
