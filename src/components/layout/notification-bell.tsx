"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications";

type Notification = {
  id: string;
  titre: string;
  message: string;
  lien: string | null;
  lu: boolean;
  createdAt: Date;
};

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      startTransition(async () => {
        const notifs = await getNotifications();
        setNotifications(notifs);
      });
    }
  }, [open]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const notifs = await getNotifications();
        setUnreadCount(notifs.filter((n) => !n.lu).length);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline"
                  disabled={isPending}
                >
                  Tout marquer lu
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Aucune notification
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`border-b px-4 py-3 last:border-0 ${
                      notif.lu ? "opacity-60" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {notif.lien ? (
                          <a
                            href={notif.lien}
                            className="text-sm font-medium hover:underline"
                            onClick={() => {
                              if (!notif.lu) handleMarkRead(notif.id);
                              setOpen(false);
                            }}
                          >
                            {notif.titre}
                          </a>
                        ) : (
                          <p className="text-sm font-medium">{notif.titre}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(notif.createdAt).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      {!notif.lu && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                          title="Marquer comme lu"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
