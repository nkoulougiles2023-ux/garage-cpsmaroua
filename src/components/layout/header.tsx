"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function Header({
  userName,
  role,
  onToggleSidebar,
}: {
  userName: string;
  role: string;
  onToggleSidebar: () => void;
}) {
  const { theme, setTheme } = useTheme();

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrateur",
    CONTROLEUR: "Contrôleur",
    RECEPTIONNISTE: "Réceptionniste",
    MAGASINIER: "Magasinier",
    CLIENT: "Client",
  };

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6 bg-card">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="text-right">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleLabels[role] ?? role}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
