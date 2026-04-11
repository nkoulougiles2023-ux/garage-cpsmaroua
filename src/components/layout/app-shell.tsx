"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ChatPanel } from "./chat-panel";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  userName,
  role,
  permissions,
  notificationCount,
  userId,
}: {
  children: React.ReactNode;
  userName: string;
  role: string;
  permissions?: Record<string, boolean>;
  notificationCount: number;
  userId: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar role={role} permissions={permissions} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={userName}
          role={role}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          notificationCount={notificationCount}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <ChatPanel currentUserId={userId} />
    </div>
  );
}
