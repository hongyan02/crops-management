"use client";

import { type ReactElement, type ReactNode, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateTimePicker, createDefaultRecordedAtValue } from "@/components/date-time-picker";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiRequestError } from "@/lib/request";
import { useProductMetricsQuery } from "@/features/catalog/hooks";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import {
  useCreateSupplierQualityMutation,
  useSuppliersQuery,
  useSupplierProductsQuery,
  useSupplierQualityQuery,
} from "../hooks";
import type { Supplier, SupplierQualityRecord } from "../types";

type ProductDraft = {
  batchNo: string;
  recordedAt: string;
  values: Record<number, string>;
};

type SupplierQualityDialogProps = {
  supplier?: Supplier;
  defaultProductId?: number | null;
  trigger?: ReactElement;
  triggerLabel?: ReactNode;
  allowSupplierSelection?: boolean;
};

export function SupplierQualityDialog({
  supplier,
  defaultProductId,
  trigger,
  triggerLabel,
  allowSupplierSelection = false,
}: SupplierQualityDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(supplier?.id ?? null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [draftsByProductId, setDraftsByProductId] = useState<Record<number, ProductDraft>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fallbackDraftsRef = useRef<Record<number, ProductDraft>>({});
  const suppliersQuery = useSuppliersQuery(
    { page: 1, pageSize: 200 },
    open && allowSupplierSelection,
  );
  const supplierOptions = suppliersQuery.data?.data ?? [];
  const activeSupplier =
    supplier ??
    supplierOptions.find((candidate) => candidate.id === selectedSupplierId) ??
    null;
  const activeSupplierId = activeSupplier?.id ?? null;
  const productsQuery = useSupplierProductsQuery(activeSupplierId ?? 0, open && Boolean(activeSupplierId));
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const activeProductId = selectedProductId ?? products[0]?.id ?? null;
  const metricsQuery = useProductMetricsQuery(activeProductId ?? 0, open && Boolean(activeProductId));
  const qualityQuery = useSupplierQualityQuery(
    activeSupplierId ?? 0,
    activeProductId ?? 0,
    open && Boolean(activeSupplierId) && Boolean(activeProductId),
  );
  const createQuality = useCreateSupplierQualityMutation(activeSupplierId ?? 0, activeProductId ?? 0);
  const metrics = useMemo(() => metricsQuery.data ?? [], [metricsQuery.data]);
  const qualityRecords = qualityQuery.data ?? [];
  const loadingSuppliers = allowSupplierSelection && suppliersQuery.isLoading;
  const loadingProducts = productsQuery.isLoading;
  const loadingDetail = metricsQuery.isLoading || qualityQuery.isLoading;
  const queryError =
    suppliersQuery.error ?? productsQuery.error ?? metricsQuery.error ?? qualityQuery.error;
  const errorMessage = serverError ?? (queryError instanceof Error ? queryError.message : null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === activeProductId) ?? null,
    [activeProductId, products],
  );
  const activeDraft =
    activeProductId && draftsByProductId[activeProductId]
      ? draftsByProductId[activeProductId]
      : activeProductId
        ? (fallbackDraftsRef.current[activeProductId] ??= createEmptyDraft())
        : createEmptyDraft();

  function updateDraft(
    productId: number,
    updater: (current: ProductDraft) => ProductDraft,
  ) {
    setDraftsByProductId((current) => {
      const baseDraft = current[productId] ?? createEmptyDraft();
      return {
        ...current,
        [productId]: updater(baseDraft),
      };
    });
  }

  function updateMetricValue(metricId: number, value: string) {
    if (!activeProductId) {
      return;
    }

    updateDraft(activeProductId, (current) => ({
      ...current,
      values: {
        ...current.values,
        [metricId]: value,
      },
    }));
  }

  function updateBatchField(key: "batchNo" | "recordedAt", value: string) {
    if (!activeProductId) {
      return;
    }

    updateDraft(activeProductId, (current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    if (!activeProductId) {
      return;
    }

    const entries = metrics
      .map((metric) => ({
        metricId: metric.id,
        value: activeDraft.values[metric.id]?.trim() ?? "",
      }))
      .filter((entry) => entry.value.length > 0);

    if (entries.length === 0) {
      setServerError("请至少填写一个质检指标的结果");
      return;
    }

    let recordedAt: string | undefined;

    if (activeDraft.recordedAt) {
      const parsedDate = new Date(activeDraft.recordedAt);

      if (Number.isNaN(parsedDate.getTime())) {
        setServerError("测验时间格式无效");
        return;
      }

      recordedAt = parsedDate.toISOString();
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await createQuality.mutateAsync({
        entries,
        batchNo: activeDraft.batchNo.trim() || undefined,
        recordedAt,
      });

      setDraftsByProductId((current) => ({
        ...current,
        [activeProductId]: createEmptyDraft(),
      }));
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : "保存失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setSelectedSupplierId(supplier?.id ?? null);
          setSelectedProductId(defaultProductId ?? null);
          fallbackDraftsRef.current = {};
          setServerError(null);
          return;
        }

        setSelectedSupplierId(supplier?.id ?? null);
        setSelectedProductId(null);
        setDraftsByProductId({});
        fallbackDraftsRef.current = {};
        setServerError(null);
      }}
    >
      <DialogTrigger render={trigger ?? <Button size="sm" variant="outline" />}>
        {triggerLabel ?? "质量"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-border/80 bg-vellum-white p-0 shadow-[0_28px_80px_-42px_rgba(20,20,19,0.35)]">
        <div className="flex flex-col gap-5 p-6 sm:p-7">
          <DialogHeader className="gap-2">
            <DialogTitle>质量录入</DialogTitle>
            <DialogDescription>
              {allowSupplierSelection
                ? "先选择供应商，再为对应产品录入质检结果。录入时间默认当天。"
                : `为供应商“${activeSupplier?.name ?? supplier?.name ?? "未选择供应商"}”录入产品质检结果，支持统一填写批次号和测验时间。`}
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          {loadingSuppliers ? (
            <DialogMessageCard label="正在加载供应商..." />
          ) : allowSupplierSelection ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="quality-supplier-select">供应商</FieldLabel>
                <NativeSelect
                  id="quality-supplier-select"
                  value={selectedSupplierId ? String(selectedSupplierId) : ""}
                  onChange={(event) => {
                    const nextSupplierId = event.target.value ? Number(event.target.value) : null;
                    setSelectedSupplierId(nextSupplierId);
                    setSelectedProductId(null);
                    setDraftsByProductId({});
                    fallbackDraftsRef.current = {};
                    setServerError(null);
                  }}
                >
                  <NativeSelectOption value="">请选择供应商</NativeSelectOption>
                  {supplierOptions.map((option) => (
                    <NativeSelectOption key={option.id} value={String(option.id)}>
                      {option.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
          ) : null}

          {!activeSupplier ? (
            <DialogMessageCard label="请先选择需要录入质量的供应商。" />
          ) : loadingProducts ? (
            <DialogMessageCard label="正在加载产品..." />
          ) : products.length > 0 ? (
            <>
              {products.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {products.map((product) => (
                    <button
                      className="rounded-full border border-border/80 bg-white/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white data-[active=true]:border-foreground/20 data-[active=true]:bg-white data-[active=true]:text-foreground"
                      data-active={product.id === activeProductId}
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="rounded-[12px] border border-border/80 bg-white/78 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-medium text-foreground">
                      {selectedProduct?.name ?? "未选择产品"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedProduct
                        ? `${selectedProduct.category} · ${selectedProduct.unit}`
                        : "请选择需要录入质量的产品"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {loadingDetail
                      ? "正在加载指标..."
                      : `共 ${metrics.length} 个指标，已有 ${qualityRecords.length} 条历史记录`}
                  </span>
                </div>
              </div>

              {loadingDetail ? (
                <DialogMessageCard label="正在加载指标和历史质检结果..." />
              ) : metrics.length > 0 ? (
                <>
                  <div className="grid gap-4 rounded-[12px] border border-dashed border-border/80 bg-white/40 p-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-foreground">检测批次号</label>
                      <Input
                        className="h-10 bg-white"
                        placeholder="请输入本次检测的统一批次号（可选）"
                        value={activeDraft.batchNo}
                        onChange={(event) => updateBatchField("batchNo", event.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-foreground">测验时间</label>
                      <DateTimePicker
                        disabled={loadingDetail || isSubmitting}
                        value={activeDraft.recordedAt}
                        onChange={(value) => updateBatchField("recordedAt", value)}
                      />
                    </div>
                  </div>

                  <section className="overflow-hidden rounded-[12px] border border-border/80 bg-white/78">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="bg-muted/45 text-foreground">
                            <th className="border-b border-border/80 px-4 py-3 font-medium">
                              质检指标
                            </th>
                            <th className="border-b border-border/80 px-4 py-3 font-medium">
                              质量结果
                            </th>
                            <th className="border-b border-border/80 px-4 py-3 font-medium">
                              单位
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((metric) => (
                            <tr className="align-middle" key={metric.id}>
                              <td className="border-b border-border/70 px-4 py-3 last:border-b-0">
                                <span className="block font-medium text-foreground">
                                  {metric.name}
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                  标准范围：{metric.description || "未填写说明"}
                                </span>
                              </td>
                              <td className="border-b border-border/70 px-4 py-3 last:border-b-0">
                                <Input
                                  className="h-10 bg-white"
                                  placeholder={`例如：12.5${metric.unit}`}
                                  value={activeDraft.values[metric.id] ?? ""}
                                  onChange={(event) =>
                                    updateMetricValue(metric.id, event.target.value)
                                  }
                                />
                              </td>
                              <td className="border-b border-border/70 px-4 py-3 text-muted-foreground last:border-b-0">
                                {metric.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              ) : (
                <DialogMessageCard label="此产品还未绑定质量指标，请先到“基础信息”中为产品绑定指标。" />
              )}

              <QualityRecordList records={qualityRecords} />
            </>
          ) : (
            <DialogMessageCard label="该供应商还没有绑定产品，请先点击“产品”维护可供应产品。" />
          )}

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              disabled={
                loadingSuppliers ||
                loadingProducts ||
                loadingDetail ||
                !activeSupplierId ||
                !activeProductId ||
                isSubmitting
              }
              type="button"
              onClick={() => void handleSave()}
            >
              {isSubmitting ? "保存中..." : "保存质量结果"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DialogMessageCard({ label }: { label: string }) {
  return (
    <div className="rounded-[12px] border border-dashed border-border/80 bg-white/45 px-4 py-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function createEmptyDraft(): ProductDraft {
  return {
    batchNo: "",
    recordedAt: createDefaultRecordedAtValue(),
    values: {},
  };
}

function QualityRecordList({ records }: { records: SupplierQualityRecord[] }) {
  return (
    <section className="rounded-[12px] border border-border/80 bg-white/76 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">历史质检结果</h3>
        <span className="text-xs text-muted-foreground">{records.length} 条</span>
      </div>

      {records.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {records.map((record) => (
            <div
              className="grid gap-2 rounded-[9.6px] border border-border/70 bg-vellum-white px-4 py-3 text-sm md:grid-cols-[1fr_1fr_1fr]"
              key={record.id}
            >
              <span className="font-medium text-foreground">
                {record.metricName}: {record.value}
                {record.metricUnit}
              </span>
              <span className="text-muted-foreground">批次：{record.batchNo ?? "未填写"}</span>
              <span className="text-muted-foreground">
                测验时间：{formatDateTime(record.recordedAt)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">当前产品还没有质检结果。</p>
      )}
    </section>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
