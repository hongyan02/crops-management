import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  return (
    <Card className="w-full border-border/80 bg-white/88 py-0 shadow-[0_28px_70px_-42px_rgba(20,20,19,0.32)]">
      <CardHeader className="gap-2 px-7 pt-7 pb-5">
        <span className="section-kicker">Closed</span>
        <CardTitle className="font-heading text-4xl leading-none font-normal tracking-[-0.04em]">
          暂不开放注册
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          账号统一由管理员创建
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-7 pb-7">
        <Link className={buttonVariants()} href="/sign-in">
          返回登录
        </Link>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
          回到首页
        </Link>
      </CardContent>
    </Card>
  );
}
