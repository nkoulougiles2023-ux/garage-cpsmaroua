"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Car,
  Package,
  FileText,
  CreditCard,
  Users,
  Settings,
  Gauge,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { label: "Ordres de réparation", href: "/ordres", icon: ClipboardList },
    { label: "Véhicules", href: "/vehicules", icon: Car },
    { label: "Magasin", href: "/magasin", icon: Package },
    { label: "Factures", href: "/factures", icon: FileText },
    { label: "Paiements", href: "/paiements", icon: CreditCard },
    { label: "Rapports", href: "/rapports", icon: BarChart3 },
    { label: "Utilisateurs", href: "/utilisateurs", icon: Users },
    { label: "Paramètres", href: "/parametres", icon: Settings },
  ],
  CONTROLEUR: [
    { label: "Panneau de commandes", href: "/controleur", icon: Gauge },
    { label: "Ordres de réparation", href: "/ordres", icon: ClipboardList },
    { label: "Picklists", href: "/picklists", icon: FileText },
    { label: "Paiements", href: "/paiements", icon: CreditCard },
    { label: "Factures", href: "/factures", icon: FileText },
  ],
  RECEPTIONNISTE: [
    { label: "Tableau de bord", href: "/reception/dashboard", icon: LayoutDashboard },
    { label: "Nouvelle réception", href: "/reception/nouveau", icon: Car },
    { label: "Véhicules", href: "/vehicules", icon: Car },
    { label: "Ordres de réparation", href: "/ordres", icon: ClipboardList },
    { label: "Picklists", href: "/picklists", icon: FileText },
  ],
  MAGASINIER: [
    { label: "Tableau de bord", href: "/magasin/dashboard", icon: LayoutDashboard },
    { label: "Inventaire", href: "/magasin", icon: Package },
    { label: "Entrée de stock", href: "/magasin/entree", icon: Package },
    { label: "Picklists à livrer", href: "/picklists", icon: FileText },
    { label: "Mouvements de stock", href: "/magasin/mouvements", icon: BarChart3 },
    { label: "Alertes stock bas", href: "/magasin/alertes", icon: Package },
  ],
  CLIENT: [
    { label: "Mes réparations", href: "/mes-reparations", icon: Car },
    { label: "Mes factures", href: "/mes-factures", icon: FileText },
  ],
};

export function Sidebar({
  role,
  permissions,
}: {
  role: string;
  permissions?: Record<string, boolean>;
}) {
  const pathname = usePathname();
  const allItems = navByRole[role] ?? [];

  // Admin and Client always see all their items. Other roles are filtered by permissions.
  const items =
    role === "ADMIN" || role === "CLIENT" || !permissions
      ? allItems
      : allItems.filter((item) => permissions[item.href] !== false);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center px-3 border-b border-sidebar-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/CPS1.png"
          alt="CPS Maroua"
          className="w-full h-auto object-contain max-h-[48px]"
        />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
