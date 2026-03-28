import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const role = (session.user as any).role as string;
  const userName = session.user.name ?? "Utilisateur";

  return (
    <AppShell userName={userName} role={role}>
      {children}
    </AppShell>
  );
}
