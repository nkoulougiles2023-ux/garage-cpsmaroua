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
    <header className="border-b bg-card">
      {/* CPS Banner */}
      <div className="w-full bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/CPS1.png"
          alt="Centre Polytechnique du Sahel - CPS Maroua"
          className="w-full h-auto object-contain max-h-[60px] sm:max-h-[80px] md:max-h-[100px] lg:max-h-[120px]"
        />
      </div>
      {/* Controls bar */}
      <div className="flex h-12 items-center justify-between px-4 md:px-6">
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
      </div>
    </header>
  );
}
