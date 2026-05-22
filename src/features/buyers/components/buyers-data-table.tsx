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

import { useBuyersQuery } from "../hooks";
import { BuyerFormDialog } from "./buyer-form-dialog";
import { BuyerProductsDialog } from "./buyer-products-dialog";
import { BuyerRequirementsDialog } from "./buyer-requirements-dialog";

const PAGE_SIZE = 10;

export function BuyersDataTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const buyersQuery = useBuyersQuery({
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const buyers = buyersQuery.data?.data ?? [];
  const pagination = buyersQuery.data?.meta?.pagination as PaginationMeta["pagination"] | undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <DashboardListSearchInput
          className="max-w-sm"
          placeholder="搜索采购商名称..."
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <BuyerFormDialog />
      </div>

      <DashboardTableSurface className="bg-white/76">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>采购商名称</TableHead>
              <TableHead>联系人</TableHead>
              <TableHead>电话</TableHead>
              <TableHead>采购产品</TableHead>
              <TableHead>质量标准</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buyersQuery.isLoading ? (
              <DashboardTableMessageRow colSpan={7} label="加载中..." />
            ) : buyers.length > 0 ? (
              buyers.map((buyer) => (
                <TableRow key={buyer.id}>
                  <TableCell className="text-muted-foreground">{buyer.id}</TableCell>
                  <TableCell className="font-medium">{buyer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{buyer.contact ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{buyer.phone ?? "—"}</TableCell>
                  <TableCell>{buyer.productCount}</TableCell>
                  <TableCell className="text-muted-foreground">{buyer.requirementCount ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <BuyerFormDialog
                        buyer={buyer}
                        trigger={<Button size="sm" variant="outline" />}
                      />
                      <BuyerProductsDialog buyer={buyer} />
                      <BuyerRequirementsDialog buyer={buyer} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <DashboardTableMessageRow colSpan={7} label="暂无采购商数据" />
            )}
          </TableBody>
        </Table>
      </DashboardTableSurface>

      <DashboardListPagination
        isFetching={buyersQuery.isFetching}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
