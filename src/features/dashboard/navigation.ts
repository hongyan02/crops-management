import {
  BadgeDollarSign,
  Factory,
  FlaskConical,
  LayoutDashboard,
  type LucideIcon,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

export type DashboardNavItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export type DashboardNavGroup = {
  title: string;
  items: DashboardNavItem[];
};

export type DashboardBreadcrumb = {
  title: string;
  href?: string;
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    title: "工作台",
    items: [
      {
        title: "总览",
        href: "/dashboard",
        description: "查看后台框架入口、状态概览与后续模块接入位置。",
        icon: LayoutDashboard,
      },
      {
        title: "基础信息",
        href: "/products",
        description: "管理产品目录与质量指标定义。",
        icon: Package,
      },
      {
        title: "产品质量",
        href: "/quality",
        description: "查看全部供应商产品质量总览，并录入最新质检结果。",
        icon: FlaskConical,
      },
      {
        title: "价格管理",
        href: "/prices",
        description: "录入供应商产品价格，并查看每个供应关系下的最新报价与历史报价。",
        icon: BadgeDollarSign,
      },
      {
        title: "价格看板",
        href: "/price-overview",
        description: "按产品查看多个供应商的价格变化趋势。",
        icon: TrendingUp,
      },
      {
        title: "供应商管理",
        href: "/suppliers",
        description: "维护供应商联系人与可供应产品。",
        icon: Factory,
      },
      {
        title: "采购商管理",
        href: "/buyers",
        description: "维护采购商联系人、采购产品与分级质量标准。",
        icon: ShoppingCart,
      },
    ],
  },
];

const dashboardNavItems = dashboardNavGroups.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    groupTitle: group.title,
  })),
);

function normalizePathname(pathname: string) {
  if (!pathname) {
    return "/dashboard";
  }

  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

function isPathActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function fallbackSegmentTitle(segment: string) {
  const decoded = decodeURIComponent(segment).replace(/[-_]/g, " ");

  if (/^[a-z0-9 ]+$/i.test(decoded)) {
    return decoded.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return decoded;
}

export function isDashboardNavItemActive(pathname: string, href: string) {
  return isPathActive(normalizePathname(pathname), href);
}

export function getDashboardCurrentItem(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);

  return (
    dashboardNavItems
      .filter((item) => isPathActive(normalizedPathname, item.href))
      .sort((left, right) => right.href.length - left.href.length)[0] ?? null
  );
}

export function getDashboardSectionTitle(pathname: string) {
  return getDashboardCurrentItem(pathname)?.groupTitle ?? "工作台";
}

export function getDashboardBreadcrumbs(pathname: string): DashboardBreadcrumb[] {
  const normalizedPathname = normalizePathname(pathname);
  const segments = normalizedPathname.split("/").filter(Boolean);

  let currentPath = "";

  return segments.map((segment, index) => {
    currentPath += `/${segment}`;

    const matchedItem = dashboardNavItems.find((item) => item.href === currentPath);
    const title = matchedItem?.title ?? fallbackSegmentTitle(segment);
    const isLast = index === segments.length - 1;

    return {
      title,
      href: isLast ? undefined : currentPath,
    };
  });
}
