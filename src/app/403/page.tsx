import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ForbiddenPage() {
  return (
    <main className="vellum-stage">
      <div className="vellum-shell flex min-h-screen items-center justify-center py-10">
        <Card className="vellum-panel w-full max-w-xl bg-white/76 py-0">
          <CardHeader className="gap-3 border-b border-border/80 px-6 py-6">
            <span className="section-kicker">Forbidden</span>
            <CardTitle className="font-heading text-4xl font-normal">403</CardTitle>
            <CardDescription className="text-sm leading-6 text-[#3d3d3a]">
              当前账号已经登录，但没有访问这个区域的权限。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-6 py-6">
            <p className="text-sm leading-6 text-[#3d3d3a]">
              你可以返回工作台首页，或者联系系统管理员调整角色与可访问范围。
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className={buttonVariants()} href="/dashboard">
                返回 /dashboard
              </Link>
              <Link
                className={cn(buttonVariants({ variant: "outline" }))}
                href="/"
              >
                回到落地页
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
