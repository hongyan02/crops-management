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

import { useQualityMetricsQuery } from "../hooks";
import { MetricFormDialog } from "./metric-form-dialog";
import type { PaginationMeta } from "@/lib/pagination";

const PAGE_SIZE = 10;

export function MetricsDataTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const metricsQuery = useQualityMetricsQuery({
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const metrics = metricsQuery.data?.data ?? [];
  const pagination = metricsQuery.data?.meta?.pagination as PaginationMeta["pagination"] | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DashboardListSearchInput
          className="max-w-sm"
          placeholder="搜索指标名称..."
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <MetricFormDialog />
      </div>

      <DashboardTableSurface className="bg-white/76">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>指标名称</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>说明</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metricsQuery.isLoading ? (
              <DashboardTableMessageRow colSpan={5} label="加载中..." />
            ) : metrics.length > 0 ? (
              metrics.map((metric) => (
                <TableRow key={metric.id}>
                  <TableCell className="text-muted-foreground">{metric.id}</TableCell>
                  <TableCell className="font-medium">{metric.name}</TableCell>
                  <TableCell>{metric.unit}</TableCell>
                  <TableCell className="text-muted-foreground">{metric.description ?? "—"}</TableCell>
                  <TableCell>
                    <MetricFormDialog
                      metric={metric}
                      trigger={<Button size="sm" variant="outline" />}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <DashboardTableMessageRow colSpan={5} label="暂无指标数据" />
            )}
          </TableBody>
        </Table>
      </DashboardTableSurface>

      <DashboardListPagination
        isFetching={metricsQuery.isFetching}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
