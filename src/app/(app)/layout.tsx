import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getUserPermissions } from "@/lib/actions/permissions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const userName = session.user.name ?? "Utilisateur";

  const permissions =
    role !== "ADMIN" && role !== "CLIENT"
      ? await getUserPermissions(userId, role)
      : undefined;

  return (
    <AppShell userName={userName} role={role} permissions={permissions}>
      {children}
    </AppShell>
  );
}
