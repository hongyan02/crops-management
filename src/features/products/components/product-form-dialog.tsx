"use client";

import { useState } from "react";
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

import { useCreateProductMutation } from "../hooks";
import { productSchema } from "../schemas";
import type { ProductFormValues } from "../types";

export function ProductFormDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const createProduct = useCreateProductMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      category: "",
      unit: "吨",
    },
  });

  async function onSubmit(data: ProductFormValues) {
    setServerError(null);
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ProductFormValues;
        setError(field, { message: issue.message });
      }
      return;
    }

    try {
      await createProduct.mutateAsync(parsed.data);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : "创建失败");
      return;
    }

    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>新增产品</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增产品</DialogTitle>
          <DialogDescription>填写产品基本信息，创建后可在产品列表中绑定指标。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field>
            <FieldLabel>产品名称</FieldLabel>
            <Input
              placeholder="例如：麦麸"
              {...register("name", { required: "产品名称不能为空" })}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </Field>

          <Field>
            <FieldLabel>分类</FieldLabel>
            <Input
              placeholder="例如：饲料原料"
              {...register("category", { required: "分类不能为空" })}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>单位</FieldLabel>
            <Input placeholder="吨" {...register("unit")} />
          </Field>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>取消</DialogClose>
            <Button type="submit" disabled={isSubmitting || createProduct.isPending}>
              {isSubmitting || createProduct.isPending ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
