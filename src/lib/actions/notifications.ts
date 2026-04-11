"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const session = await auth();
  if (!session?.user) return [];

  return db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user) return 0;

  return db.notification.count({
    where: { userId: session.user.id, lu: false },
  });
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) return;

  await db.notification.update({
    where: { id: notificationId },
    data: { lu: true },
  });
  revalidatePath("/");
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user) return;

  await db.notification.updateMany({
    where: { userId: session.user.id, lu: false },
    data: { lu: true },
  });
  revalidatePath("/");
}

export async function createNotificationForRole(
  role: string,
  titre: string,
  message: string,
  lien?: string
) {
  const users = await db.user.findMany({
    where: { role: role as any, isActive: true },
    select: { id: true },
  });

  if (users.length === 0) return;

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      titre,
      message,
      lien,
    })),
  });
}

export async function createNotificationForAllStaff(
  titre: string,
  message: string,
  lien?: string,
  excludeUserId?: string
) {
  const users = await db.user.findMany({
    where: {
      isActive: true,
      role: { in: ["ADMIN", "CONTROLEUR", "RECEPTIONNISTE", "MAGASINIER"] as any },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (users.length === 0) return;

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      titre,
      message,
      lien,
    })),
  });
}
