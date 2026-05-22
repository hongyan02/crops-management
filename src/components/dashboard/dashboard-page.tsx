import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

type DashboardPlaceholderCardProps = {
  title: string;
  description: string;
  items: string[];
  className?: string;
  footer?: ReactNode;
};

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="space-y-3">
        <span className="section-kicker">{eyebrow}</span>
        <div className="space-y-2">
          <h2 className="font-heading text-3xl leading-tight font-normal tracking-[-0.035em] text-foreground">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[0.95rem]">
            {description}
          </p>
        </div>
      </div>

      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </section>
  );
}

export function DashboardPlaceholderCard({
  title,
  description,
  items,
  className,
  footer,
}: DashboardPlaceholderCardProps) {
  return (
    <Card className={cn("vellum-panel bg-white/76 py-0", className)}>
      <CardHeader className="gap-3 border-b border-border/80 px-6 py-6">
        <span className="section-kicker">Placeholder</span>
        <CardTitle className="font-heading text-3xl font-normal tracking-[-0.035em]">
          {title}
        </CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6 text-[#3d3d3a]">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 px-6 py-6">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-border/80 bg-[#faf7ef] px-4 py-3 text-sm leading-6 text-[#3d3d3a]"
          >
            {item}
          </div>
        ))}
        {footer ? <div className="pt-2">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
