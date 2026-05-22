"use client";

import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DateTimePicker, createDefaultRecordedAtValue } from "@/components/date-time-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useSupplierProductsQuery, useSuppliersQuery } from "@/features/suppliers/hooks";
import { ApiRequestError } from "@/lib/request";

import { useCreatePriceMutation } from "../hooks";
import { priceFormSchema } from "../schemas";
import type { PriceFormValues } from "../types";

type PriceFormDialogProps = {
  defaultSupplierId?: number | null;
  defaultProductId?: number | null;
  defaultProductName?: string | null;
  allowSupplierSelection?: boolean;
  allowProductSelection?: boolean;
  trigger?: ReactElement;
  triggerLabel?: ReactNode;
};

const defaultValues: PriceFormValues = {
  supplierId: "",
  productId: "",
  price: "",
  quotedAt: createDefaultRecordedAtValue(),
  note: "",
};

export function PriceFormDialog({
  defaultSupplierId,
  defaultProductId,
  defaultProductName,
  allowSupplierSelection = true,
  allowProductSelection = true,
  trigger,
  triggerLabel,
}: PriceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const createPrice = useCreatePriceMutation();
  const supplierSelectable = allowSupplierSelection || !defaultSupplierId;
  const productSelectable = allowProductSelection || !defaultProductId;
  const suppliersQuery = useSuppliersQuery({ page: 1, pageSize: 200 }, open && supplierSelectable);
  const supplierOptions = suppliersQuery.data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PriceFormValues>({
    defaultValues,
  });

  const selectedSupplierId = useWatch({ control, name: "supplierId" });
  const selectedProductId = useWatch({ control, name: "productId" });
  const quotedAt = useWatch({ control, name: "quotedAt" });
  const activeSupplierId = selectedSupplierId ? Number(selectedSupplierId) : 0;
  const productsQuery = useSupplierProductsQuery(activeSupplierId, open && activeSupplierId > 0);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const selectedProduct = products.find((product) => product.id === Number(selectedProductId)) ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      supplierId: defaultSupplierId ? String(defaultSupplierId) : "",
      productId: defaultProductId ? String(defaultProductId) : "",
      price: "",
      quotedAt: createDefaultRecordedAtValue(),
      note: "",
    });
  }, [defaultProductId, defaultSupplierId, open, reset]);

  useEffect(() => {
    if (!open || productsQuery.isLoading) {
      return;
    }

    if (products.length === 0) {
      if (selectedProductId) {
        setValue("productId", "");
      }
      return;
    }

    const currentProductId = selectedProductId ? Number(selectedProductId) : null;
    const hasCurrentProduct = currentProductId
      ? products.some((product) => product.id === currentProductId)
      : false;

    if (!hasCurrentProduct) {
      const fallbackProductId = defaultProductId && products.some((product) => product.id === defaultProductId)
        ? defaultProductId
        : products[0]?.id;

      if (fallbackProductId) {
        setValue("productId", String(fallbackProductId));
      }
    }
  }, [defaultProductId, open, products, productsQuery.isLoading, selectedProductId, setValue]);

  async function onSubmit(values: PriceFormValues) {
    setServerError(null);

    const parsed = priceFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof PriceFormValues;
        setError(field, { message: issue.message });
      }
      return;
    }

    const quotedAt = new Date(parsed.data.quotedAt);
    if (Number.isNaN(quotedAt.getTime())) {
      setError("quotedAt", { message: "报价时间格式无效" });
      return;
    }

    try {
      await createPrice.mutateAsync({
        supplierId: parsed.data.supplierId,
        productId: parsed.data.productId,
        price: parsed.data.price,
        quotedAt: quotedAt.toISOString(),
        note: parsed.data.note?.trim() || undefined,
      });
      reset(defaultValues);
      setOpen(false);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : "录入失败");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setServerError(null);
        }
      }}
    >
      <DialogTrigger render={trigger ?? <Button size="sm" />}>
        {triggerLabel ?? "录入价格"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>录入价格</DialogTitle>
          <DialogDescription>
            选择供应商与产品，录入本次最新报价。相同日期可多次录入，系统会默认显示最新一条。
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {supplierSelectable ? (
              <Field data-invalid={Boolean(errors.supplierId)}>
                <FieldLabel htmlFor="price-supplier">供应商</FieldLabel>
                <NativeSelect
                  aria-invalid={Boolean(errors.supplierId)}
                  disabled={suppliersQuery.isLoading}
                  id="price-supplier"
                  {...register("supplierId")}
                  onChange={(event) => {
                    setValue("supplierId", event.target.value);
                    setValue("productId", "");
                  }}
                >
                  <NativeSelectOption value="">
                    {suppliersQuery.isLoading ? "正在加载供应商..." : "请选择供应商"}
                  </NativeSelectOption>
                  {supplierOptions.map((supplier) => (
                    <NativeSelectOption key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.supplierId]} />
              </Field>
            ) : null}

            <Field data-invalid={Boolean(errors.productId)}>
              <FieldLabel htmlFor="price-product">产品</FieldLabel>
              {productSelectable ? (
                <NativeSelect
                  aria-invalid={Boolean(errors.productId)}
                  disabled={!activeSupplierId || productsQuery.isLoading}
                  id="price-product"
                  {...register("productId")}
                >
                  <NativeSelectOption value="">
                    {!activeSupplierId
                      ? "请先选择供应商"
                      : productsQuery.isLoading
                        ? "正在加载产品..."
                        : products.length > 0
                          ? "请选择产品"
                          : "该供应商暂无可供产品"}
                  </NativeSelectOption>
                  {products.map((product) => (
                    <NativeSelectOption key={product.id} value={String(product.id)}>
                      {product.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <>
                  <Input
                    id="price-product"
                    readOnly
                    value={
                      selectedProduct?.name ??
                      defaultProductName ??
                      (productsQuery.isLoading ? "正在加载产品..." : "")
                    }
                  />
                  <input type="hidden" {...register("productId")} />
                </>
              )}
              <FieldError errors={[errors.productId]} />
            </Field>

            <Field data-invalid={Boolean(errors.price)}>
              <FieldLabel htmlFor="price-value">单价</FieldLabel>
              <Input
                aria-invalid={Boolean(errors.price)}
                id="price-value"
                inputMode="decimal"
                placeholder="例如：2380"
                {...register("price")}
              />
              <FieldError errors={[errors.price]} />
            </Field>

            <Field data-invalid={Boolean(errors.quotedAt)}>
              <FieldLabel>报价时间</FieldLabel>
              <DateTimePicker
                value={quotedAt}
                onChange={(value) => setValue("quotedAt", value)}
              />
              <FieldError errors={[errors.quotedAt]} />
            </Field>

            <Field data-invalid={Boolean(errors.note)}>
              <FieldLabel htmlFor="price-note">
                备注
                {selectedProduct ? ` · 当前单位：${selectedProduct.unit}` : ""}
              </FieldLabel>
              <Textarea
                aria-invalid={Boolean(errors.note)}
                className="min-h-24 resize-y"
                id="price-note"
                placeholder="例如：含运、临时报价、到厂价等"
                rows={3}
                {...register("note")}
              />
              <FieldError errors={[errors.note]} />
            </Field>
          </FieldGroup>

          {serverError ? <FieldError>{serverError}</FieldError> : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>取消</DialogClose>
            <Button disabled={createPrice.isPending || isSubmitting} type="submit">
              {createPrice.isPending || isSubmitting ? "提交中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
