"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PaginationState } from "@/lib/pagination";
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
import { TableCell, TableRow } from "@/components/ui/table";

type SearchInputProps = {
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  className?: string;
};

type FilterOption = {
  label: string;
  value: string;
};

type FilterDropdownProps = {
  title: string;
  label: string;
  value: string;
  options: FilterOption[];
  onValueChange: (value: string) => void;
  className?: string;
};

type PaginationProps = {
  pagination?: PaginationState;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
};

type MessageRowProps = {
  colSpan: number;
  label: ReactNode;
};

type TableSurfaceProps = {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
};

export function DashboardListSearchInput({
  value,
  placeholder,
  onValueChange,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </div>
  );
}

export function DashboardListFilterDropdown({
  title,
  label,
  value,
  options,
  onValueChange,
  className,
}: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className={className} size="sm" variant="outline" />}>
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

export function DashboardListPagination({
  pagination,
  isFetching = false,
  onPageChange,
}: PaginationProps) {
  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">共 {pagination?.total ?? 0} 条记录</span>
      <div className="flex items-center gap-2">
        <Button
          disabled={!pagination || currentPage <= 1 || isFetching}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          disabled={!pagination || currentPage >= totalPages || isFetching}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function DashboardTableMessageRow({ colSpan, label }: MessageRowProps) {
  return (
    <TableRow>
      <TableCell className="h-24 text-center text-muted-foreground" colSpan={colSpan}>
        {label}
      </TableCell>
    </TableRow>
  );
}

export function DashboardTableSurface({
  children,
  className,
  scrollable = false,
}: TableSurfaceProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/80 bg-white/80", className)}>
      {scrollable ? <div className="overflow-x-auto">{children}</div> : children}
    </div>
  );
}
