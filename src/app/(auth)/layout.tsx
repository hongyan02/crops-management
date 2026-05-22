import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
            <ArrowLeft data-icon="inline-start" />
            返回首页
          </Link>
        </header>

        <div className="grid flex-1 items-stretch gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_460px]">
          <section className="vellum-placeholder hidden min-h-155 lg:block">
            <div className="relative flex h-full flex-col justify-between p-8">
              <div className="flex items-center justify-between gap-3">
                <span className="section-kicker">Reserved Canvas</span>
                <span className="rounded-full border border-border/80 bg-white/90 px-3 py-1 text-xs text-muted-foreground">
                  Placeholder
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {["模块预览", "操作引导", "公告信息", "品牌内容"].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.6rem] border border-white/80 bg-[rgba(255,255,255,0.48)] px-5 py-5 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="max-w-lg">
                  <p className="font-heading text-5xl leading-[1.02] font-normal tracking-tighter text-foreground">
                    左侧先留白，
                  </p>
                  <p className="hero-gradient font-heading text-5xl leading-[1.02] font-normal tracking-tighter">
                    右侧专注登录
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-end">
            <div className="w-full max-w-md">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
