"use client";

import { Fragment } from "react";
import type { ComponentType, CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, LogOut } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  dashboardNavGroups,
  getDashboardBreadcrumbs,
  isDashboardNavItemActive,
} from "@/features/dashboard/navigation";

export type DashboardShellUser = {
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  displayUsername?: string | null;
};

type DashboardShellProps = {
  user: DashboardShellUser;
  children: React.ReactNode;
};

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const breadcrumbs = getDashboardBreadcrumbs(pathname);

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-mobile": "16rem",
        } as CSSProperties
      }
    >
      <DashboardSidebar pathname={pathname} user={user} />

      <SidebarInset className="min-h-svh bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <DashboardBreadcrumbs items={breadcrumbs} />
          </div>
        </header>

        <div className="flex min-w-0 w-full max-w-full flex-1 flex-col gap-6 overflow-x-hidden p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardSidebar({ pathname, user }: { pathname: string; user: DashboardShellUser }) {
  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="gap-0 border-b">
        <div className="flex min-h-14 items-center px-3">
          <Link className="truncate text-2xl font-heading text-foreground" href="/dashboard">
            Vellum
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {dashboardNavGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ href, title, icon: Icon }) => (
                  <DashboardSidebarNavItem
                    href={href}
                    icon={Icon}
                    isActive={isDashboardNavItemActive(pathname, href)}
                    key={href}
                    title={title}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <DashboardUserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardSidebarNavItem({
  href,
  title,
  icon: Icon,
  isActive,
}: {
  href: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => {
          if (isMobile) {
            setOpenMobile(false);
          }
        }}
        render={<Link href={href} />}
        tooltip={title}
      >
        <Icon />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DashboardBreadcrumbs({ items }: { items: ReturnType<typeof getDashboardBreadcrumbs> }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/dashboard" />}>控制台</BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item, index) => (
          <Fragment key={`${item.title}-${index}`}>
            <BreadcrumbSeparator>
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink render={<Link href={item.href} />}>{item.title}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function DashboardUserMenu({ user }: { user: DashboardShellUser }) {
  const displayName = user.displayUsername ?? user.name;

  return (
    <>
      <form action={signOutAction} id="dashboard-signout-form" />

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuButton className="h-11" size="lg" />}>
              <Avatar>
                {user.image ? <AvatarImage alt={displayName} src={user.image} /> : null}
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium text-foreground">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatUserRole(user.role)}
                </span>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-56" side="top">
              <DropdownMenuGroup>
                <DropdownMenuLabel>当前账号</DropdownMenuLabel>
                <DropdownMenuItem disabled>{displayName}</DropdownMenuItem>
                <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href="/" />}>
                  <Home />
                  返回落地页
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  nativeButton
                  render={<button form="dashboard-signout-form" type="submit" />}
                  variant="destructive"
                >
                  <LogOut />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}

function formatUserRole(role?: string | null) {
  if (role === "admin") {
    return "管理员";
  }

  if (role === "member") {
    return "成员";
  }

  return role ?? "已登录用户";
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VW"
  );
}
