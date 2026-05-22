"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { signInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";

export function SignInForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInInput>({
    // Current Zod v4 and resolver typings disagree on branded internals, but the runtime contract is compatible.
    resolver: zodResolver(signInSchema as never),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      const result = await signInAction(values);

      if (!result || result.ok) {
        return;
      }

      if (result.fieldErrors?.username?.[0]) {
        setError("username", { message: result.fieldErrors.username[0] });
      }

      if (result.fieldErrors?.password?.[0]) {
        setError("password", { message: result.fieldErrors.password[0] });
      }

      if (result.message) {
        setFormError(result.message);
      }
    });
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.username)}>
          <FieldLabel htmlFor="username">用户名</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            placeholder="输入用户名"
            aria-invalid={Boolean(errors.username)}
            {...register("username")}
          />
          <FieldError errors={[errors.username]} />
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">密码</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="输入密码"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      {formError ? (
        <p className="rounded-2xl border border-[rgba(217,119,87,0.25)] bg-[rgba(217,119,87,0.08)] px-4 py-3 text-sm text-[#8a4d38]">
          {formError}
        </p>
      ) : null}

      <Button size="lg" type="submit" disabled={isPending}>
        {isPending ? "正在登录..." : "进入后台"}
      </Button>
    </form>
  );
}
