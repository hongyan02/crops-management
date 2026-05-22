import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole, getNormalizedSessionRole } from "@server/auth/session";

export default async function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireRole(["admin"]);

  return (
    <DashboardShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: getNormalizedSessionRole(session.user.role),
        displayUsername: session.user.displayUsername,
      }}
    >
      {children}
    </DashboardShell>
  );
}
