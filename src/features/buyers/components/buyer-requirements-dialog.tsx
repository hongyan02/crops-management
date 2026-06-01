"use client";

import { useMemo, useState } from "react";

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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiRequestError } from "@/lib/request";
import { useProductMetricsQuery } from "@/features/catalog/hooks";
import type { ProductMetric } from "@/features/catalog/types";

import {
  useBuyerProductsQuery,
  useBuyerRequirementsQuery,
  useUpdateBuyerRequirementsMutation,
} from "../hooks";
import type { Buyer, BuyerRequirement, QualityLevel } from "../types";

type RequirementDraft = {
  qualityStandard: string;
  notes: string;
};

type BuyerRequirementsDialogProps = {
  buyer: Buyer;
};

const qualityLevels: Array<{ value: QualityLevel; title: string; description: string }> = [
  {
    value: "standard",
    title: "标准质量",
    description: "正常接收与合同约定值。",
  },
  {
    value: "concession",
    title: "让步接收",
    description: "偏离标准但仍可协商接收。",
  },
  {
    value: "rejection",
    title: "退货标准",
    description: "触发退货或拒收的边界。",
  },
];

export function BuyerRequirementsDialog({ buyer }: BuyerRequirementsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, RequirementDraft>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const productsQuery = useBuyerProductsQuery(buyer.id, open);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const activeProductId = selectedProductId ?? products[0]?.id ?? null;
  const metricsQuery = useProductMetricsQuery(activeProductId ?? 0, open && Boolean(activeProductId));
  const requirementsQuery = useBuyerRequirementsQuery(
    buyer.id,
    activeProductId ?? 0,
    open && Boolean(activeProductId),
  );
  const updateRequirements = useUpdateBuyerRequirementsMutation(buyer.id, activeProductId ?? 0);
  const metrics = useMemo(() => metricsQuery.data ?? [], [metricsQuery.data]);
  const requirements = useMemo(() => requirementsQuery.data ?? [], [requirementsQuery.data]);
  const loadingProducts = productsQuery.isLoading;
  const loadingDetail = metricsQuery.isLoading || requirementsQuery.isLoading;
  const baseDrafts = useMemo(() => buildDrafts(metrics, requirements), [metrics, requirements]);
  const effectiveDrafts = useMemo(
    () => ({ ...baseDrafts, ...drafts }),
    [baseDrafts, drafts],
  );
  const queryError = productsQuery.error ?? metricsQuery.error ?? requirementsQuery.error;
  const errorMessage = serverError ?? (queryError instanceof Error ? queryError.message : null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === activeProductId) ?? null,
    [activeProductId, products],
  );

  async function handleSave() {
    if (!activeProductId) {
      return;
    }

    setServerError(null);

    try {
      const requirements = Object.entries(effectiveDrafts)
        .map(([key, draft]) => {
          const [metricId, qualityLevel] = key.split(":");

          return {
            metricId: Number(metricId),
            qualityLevel: qualityLevel as QualityLevel,
            qualityStandard: draft.qualityStandard,
            notes: draft.notes,
          };
        })
        .filter((requirement) => requirement.qualityStandard.trim() || requirement.notes.trim());

      await updateRequirements.mutateAsync(requirements);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : "保存失败");
    }
  }

  function updateDraft(
    metricId: number,
    level: QualityLevel,
    key: keyof RequirementDraft,
    value: string,
  ) {
    setDrafts((current) => {
      const draftKey = getDraftKey(metricId, level);

      return {
        ...current,
        [draftKey]: {
          ...(effectiveDrafts[draftKey] ?? { qualityStandard: "", notes: "" }),
          [key]: value,
        },
      };
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setServerError(null);
        if (!nextOpen) {
          setSelectedProductId(null);
          setDrafts({});
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>质量标准</DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>采购商质量标准</DialogTitle>
          <DialogDescription>
            维护“{buyer.name}”按产品和指标拆分的标准质量、让步接收与退货质量标准。
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        {loadingProducts ? (
          <div className="rounded-[9.6px] border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
            正在加载产品...
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              {products.map((product) => (
                <button
                  className="rounded-[9.6px] border border-border/80 bg-vellum-white px-4 py-3 text-left transition-colors hover:bg-white data-[active=true]:border-foreground/30 data-[active=true]:bg-white"
                  data-active={product.id === activeProductId}
                  key={product.id}
                  type="button"
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setDrafts({});
                  }}
                >
                  <span className="block text-sm font-medium text-foreground">{product.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {product.category} · {product.unit}
                  </span>
                </button>
              ))}
            </div>

            <section className="flex flex-col gap-4">
              <div className="rounded-[9.6px] border border-border/80 bg-white/80 p-4">
                <h3 className="text-sm font-medium text-foreground">
                  {selectedProduct?.name ?? "未选择产品"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loadingDetail
                    ? "正在加载质量标准..."
                    : `当前产品有 ${metrics.length} 个可维护指标。`}
                </p>
              </div>

              {loadingDetail ? (
                <div className="rounded-[9.6px] border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
                  正在加载详情...
                </div>
              ) : metrics.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {metrics.map((metric) => (
                    <div
                      className="rounded-[9.6px] border border-border/80 bg-white/76 p-4"
                      key={metric.id}
                    >
                      <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-medium text-foreground">
                          {metric.name}（{metric.unit}）
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {metric.description || "未填写指标说明"}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3">
                        {qualityLevels.map((level) => {
                          const draft = effectiveDrafts[getDraftKey(metric.id, level.value)] ?? {
                            qualityStandard: "",
                            notes: "",
                          };

                          return (
                            <div
                              className="rounded-[9.6px] border border-border/70 bg-vellum-white p-4"
                              key={level.value}
                            >
                              <div className="flex flex-col gap-1">
                                <h5 className="text-sm font-medium text-foreground">
                                  {level.title}
                                </h5>
                                <p className="text-xs text-muted-foreground">
                                  {level.description}
                                </p>
                              </div>

                              <FieldGroup className="mt-3 grid gap-3 md:grid-cols-2">
                                <Field>
                                  <FieldLabel>质量标准</FieldLabel>
                                  <Input
                                    placeholder={`例如：10-15${metric.unit}`}
                                    value={draft.qualityStandard}
                                    onChange={(event) =>
                                      updateDraft(
                                        metric.id,
                                        level.value,
                                        "qualityStandard",
                                        event.target.value,
                                      )
                                    }
                                  />
                                </Field>
                                <Field>
                                  <FieldLabel>备注</FieldLabel>
                                  <Input
                                    placeholder="可选"
                                    value={draft.notes}
                                    onChange={(event) =>
                                      updateDraft(
                                        metric.id,
                                        level.value,
                                        "notes",
                                        event.target.value,
                                      )
                                    }
                                  />
                                </Field>
                              </FieldGroup>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[9.6px] border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                  此产品还未绑定质量指标，请先到“基础信息”中为产品绑定指标。
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-[9.6px] border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            该采购商还没有绑定产品，请先点击“产品”维护采购产品。
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
          <Button
            disabled={!activeProductId || loadingDetail || updateRequirements.isPending}
            type="button"
            onClick={handleSave}
          >
            {updateRequirements.isPending ? "保存中..." : "保存质量标准"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildDrafts(metrics: ProductMetric[], requirements: BuyerRequirement[]) {
  const nextDrafts: Record<string, RequirementDraft> = {};

  for (const metric of metrics) {
    for (const level of qualityLevels) {
      const existing = requirements.find(
        (requirement) =>
          requirement.metricId === metric.id && requirement.qualityLevel === level.value,
      );

      nextDrafts[getDraftKey(metric.id, level.value)] = {
        qualityStandard: existing?.qualityStandard ?? "",
        notes: existing?.notes ?? "",
      };
    }
  }

  return nextDrafts;
}

function getDraftKey(metricId: number, level: QualityLevel) {
  return `${metricId}:${level}`;
}
