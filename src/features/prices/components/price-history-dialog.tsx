"use client";

import { type ReactElement, type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { usePriceHistoryQuery } from "../hooks";
import { formatDateTime, formatPrice } from "../formatters";

type PriceHistoryDialogProps = {
  supplierId: number;
  productId: number;
  supplierName: string;
  productName: string;
  unit: string;
  trigger?: ReactElement;
  triggerLabel?: ReactNode;
};

export function PriceHistoryDialog({
  supplierId,
  productId,
  supplierName,
  productName,
  unit,
  trigger,
  triggerLabel,
}: PriceHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const historyQuery = usePriceHistoryQuery(supplierId, productId, open);
  const records = historyQuery.data ?? [];
  const errorMessage = historyQuery.error instanceof Error ? historyQuery.error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button size="sm" variant="outline" />}>
        {triggerLabel ?? "历史报价"}
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productName} 历史报价</DialogTitle>
          <DialogDescription>
            {supplierName} · {unit} · 按报价时间倒序展示，最新录入排在最前。
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        {historyQuery.isLoading ? (
          <div className="rounded-[9.6px] border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            正在加载历史报价...
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-hidden rounded-[9.6px] border border-border/80 bg-white/80">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-36">报价时间</TableHead>
                    <TableHead className="min-w-24">价格</TableHead>
                    <TableHead className="min-w-20">单位</TableHead>
                    <TableHead className="min-w-44">备注</TableHead>
                    <TableHead className="min-w-36">录入时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(record.quotedAt)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatPrice(record.price)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{record.unit}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.note?.trim() ? record.note : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(record.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="rounded-[9.6px] border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            当前暂无历史报价记录。
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
