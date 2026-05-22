"use client";

import { type ReactElement, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiRequestError } from "@/lib/request";

import { partnerSchema } from "../schemas";
import type { Partner, PartnerFormValues, PartnerKind } from "../types";

type PartnerEditorDialogProps = {
  kind: PartnerKind;
  partner?: Partner;
  trigger?: ReactElement;
  isPending?: boolean;
  onSubmit: (values: PartnerFormValues) => Promise<void>;
};

const labels = {
  supplier: {
    noun: "供应商",
    placeholder: "例如：华东原料供应有限公司",
  },
  buyer: {
    noun: "采购商",
    placeholder: "例如：华南饲料集团",
  },
} satisfies Record<PartnerKind, { noun: string; placeholder: string }>;

const defaultValues: PartnerFormValues = {
  name: "",
  contact: "",
  phone: "",
  address: "",
};

export function PartnerEditorDialog({
  kind,
  partner,
  trigger,
  isPending,
  onSubmit,
}: PartnerEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = Boolean(partner);
  const copy = labels[kind];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<PartnerFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      partner
        ? {
            name: partner.name,
            contact: partner.contact ?? "",
            phone: partner.phone ?? "",
            address: partner.address ?? "",
          }
        : defaultValues,
    );
  }, [open, partner, reset]);

  async function handleFormSubmit(values: PartnerFormValues) {
    setServerError(null);

    const parsed = partnerSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof PartnerFormValues;
        setError(field, { message: issue.message });
      }
      return;
    }

    try {
      await onSubmit(parsed.data as PartnerFormValues);
      reset(defaultValues);
      setOpen(false);
    } catch (error) {
      setServerError(
        error instanceof ApiRequestError ? error.message : isEditMode ? "保存失败" : "创建失败",
      );
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
        {isEditMode ? "编辑" : `新增${copy.noun}`}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? `编辑${copy.noun}` : `新增${copy.noun}`}</DialogTitle>
          <DialogDescription>
            记录企业名称、联系人、电话与地址，产品关系和质量资料保存后可继续维护。
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleFormSubmit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel>名称</FieldLabel>
              <Input
                aria-invalid={Boolean(errors.name)}
                placeholder={copy.placeholder}
                {...register("name", { required: "名称不能为空" })}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={Boolean(errors.contact)}>
              <FieldLabel>联系人</FieldLabel>
              <Input
                aria-invalid={Boolean(errors.contact)}
                placeholder="例如：张经理"
                {...register("contact")}
              />
              <FieldError errors={[errors.contact]} />
            </Field>

            <Field data-invalid={Boolean(errors.phone)}>
              <FieldLabel>联系电话</FieldLabel>
              <Input
                aria-invalid={Boolean(errors.phone)}
                placeholder="例如：13800000000"
                {...register("phone")}
              />
              <FieldError errors={[errors.phone]} />
            </Field>

            <Field data-invalid={Boolean(errors.address)}>
              <FieldLabel>地址</FieldLabel>
              <Textarea
                aria-invalid={Boolean(errors.address)}
                className="min-h-24 resize-y"
                placeholder="例如：上海市浦东新区"
                rows={3}
                {...register("address")}
              />
              <FieldError errors={[errors.address]} />
            </Field>
          </FieldGroup>

          {serverError ? <FieldError>{serverError}</FieldError> : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>取消</DialogClose>
            <Button disabled={Boolean(isPending) || isSubmitting} type="submit">
              {Boolean(isPending) || isSubmitting
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
