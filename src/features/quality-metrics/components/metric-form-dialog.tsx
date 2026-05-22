"use client";

import { type ReactElement, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { ApiRequestError } from "@/lib/request";

import { useSaveQualityMetricMutation } from "../hooks";
import { metricSchema } from "../schemas";
import type { QualityMetric, QualityMetricFormValues } from "../types";

interface MetricFormDialogProps {
  metric?: QualityMetric;
  trigger?: ReactElement;
}

const defaultValues: QualityMetricFormValues = {
  name: "",
  unit: "",
  description: "",
};

export function MetricFormDialog({ metric, trigger }: MetricFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = Boolean(metric);
  const saveMetric = useSaveQualityMetricMutation(metric?.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<QualityMetricFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      metric
        ? {
            name: metric.name,
            unit: metric.unit,
            description: metric.description ?? "",
          }
        : defaultValues,
    );
  }, [metric, open, reset]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setServerError(null);
    }
  }

  async function onSubmit(data: QualityMetricFormValues) {
    setServerError(null);
    const parsed = metricSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof QualityMetricFormValues;
        setError(field, { message: issue.message });
      }
      return;
    }

    try {
      await saveMetric.mutateAsync(parsed.data as QualityMetricFormValues);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : isEditMode ? "保存失败" : "创建失败");
      return;
    }

    reset(defaultValues);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger ?? <Button size="sm" />}>
        {isEditMode ? "编辑" : "新增指标"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "编辑指标" : "新增指标"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "更新指标名称、单位与说明，保存后会立即反映到绑定界面。"
              : "定义一个新的质量指标，可在产品绑定时使用。"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field>
            <FieldLabel>指标名称</FieldLabel>
            <Input placeholder="例如：水分" {...register("name", { required: "指标名称不能为空" })} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>单位</FieldLabel>
            <Input placeholder="例如：%" {...register("unit", { required: "单位不能为空" })} />
            {errors.unit && (
              <p className="text-sm text-destructive">{errors.unit.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>说明（可选）</FieldLabel>
            <Input placeholder="简要描述该指标的含义" {...register("description")} />
          </Field>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              取消
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || saveMetric.isPending}>
              {isSubmitting || saveMetric.isPending
                ? isEditMode
                  ? "保存中..."
                  : "创建中..."
                : isEditMode
                  ? "保存"
                  : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
