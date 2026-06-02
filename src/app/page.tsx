import Link from "next/link";
import { ArrowRight, Database, ShieldCheck, Sparkles } from "lucide-react";

import { getNormalizedSessionRole, getSession } from "@server/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const featureCards = [
  {
    title: "统一登录",
    description: "用户名密码入口先收敛，后台入口保持单一。",
    icon: ShieldCheck,
  },
  {
    title: "受保护路由",
    description: "未登录访问 `/dashboard` 自动回到登录页。",
    icon: Sparkles,
  },
  {
    title: "本地先跑通",
    description: "PostgreSQL + Better Auth，支撑当前业务模块。",
    icon: Database,
  },
];

export default async function Home() {
  const session = await getSession();
  const primaryHref = session
    ? getNormalizedSessionRole(session.user.role) === "admin"
      ? "/dashboard"
      : "/403"
    : "/sign-in";

  return (
    <main className="vellum-stage">
      <div className="vellum-shell flex min-h-screen flex-col py-6 sm:py-8">
        <header className="flex items-center justify-between gap-4 py-3">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-2xl border border-border/80 bg-white/80 text-sm font-medium text-foreground">
              VW
            </span>
            <div className="flex flex-col">
              <span className="font-heading text-2xl leading-none font-normal">Vellum</span>
              <span className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                Workbench
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link className={buttonVariants({ variant: "outline" })} href="/sign-in">
              登录
            </Link>
            <Link className={buttonVariants()} href={primaryHref}>
              {session ? "进入后台" : "开始使用"}
            </Link>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-10 pt-12 pb-12 text-center sm:pt-16">
          <div className="flex max-w-5xl flex-col items-center gap-6">
            <span className="inline-flex items-center rounded-full border border-border/80 bg-white/88 px-5 py-2 text-sm text-foreground shadow-[0_10px_32px_-24px_rgba(20,20,19,0.55)]">
              管理工作台 v1
            </span>

            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-6xl leading-[0.98] font-normal tracking-tighter text-foreground sm:text-7xl md:text-8xl">
                让后台入口
              </h1>
              <p className="hero-gradient font-heading text-6xl leading-[0.98] font-normal tracking-tighter sm:text-7xl md:text-8xl">
                更清晰一点
              </p>
            </div>

            <p className="max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
              登录、路由保护、权限与业务模块已经收敛到统一工作台入口。
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link className={cn(buttonVariants({ size: "lg" }), "min-w-40")} href={primaryHref}>
                {session ? "进入后台" : "进入登录"}
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "min-w-40")}
                href="/sign-in"
              >
                查看登录页
              </Link>
            </div>
          </div>

          <div className="vellum-placeholder h-80 w-full max-w-5xl rounded-[2.25rem] px-6 py-6 sm:h-90 sm:px-8 sm:py-8">
            <div className="relative flex h-full flex-col justify-between rounded-[1.75rem] border border-white/70 bg-[rgba(255,255,255,0.34)] p-6 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="flex items-center justify-between gap-4">
                <span className="section-kicker">Workspace Entry</span>
                <span className="rounded-full border border-border/80 bg-white/86 px-3 py-1 text-xs text-muted-foreground">
                  Reserved Panel
                </span>
              </div>

              <div className="flex max-w-xl flex-col gap-3">
                <p className="font-heading text-4xl leading-tight font-normal tracking-[-0.04em] text-foreground sm:text-5xl">
                  后续这里可以放你的
                  <span className="hero-gradient"> 产品演示</span>
                </p>
                <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
                  现在先保留一块完整视觉占位，避免首页和登录页继续堆说明文本。
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {featureCards.map(({ title, description, icon: Icon }) => (
                  <Card key={title} className="border-border/70 bg-white/82 py-0 shadow-none">
                    <CardHeader className="gap-4 px-5 pt-5 pb-3">
                      <span className="flex size-12 items-center justify-center rounded-2xl border border-border/80 bg-background">
                        <Icon />
                      </span>
                      <CardTitle className="text-xl font-medium text-foreground">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
